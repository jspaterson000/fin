import { db, accounts, transactions, accountSnapshots } from "@fin/db";
import { sql, and, gte, eq, desc, isNotNull, asc } from "drizzle-orm";

export async function getNetPosition() {
  const allAccounts = await db.select().from(accounts);
  let total = 0;

  for (const acc of allAccounts) {
    const [snapshot] = await db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.accountId, acc.id))
      .orderBy(desc(accountSnapshots.date))
      .limit(1);
    total += snapshot ? Number(snapshot.balance) : 0;
  }

  return total;
}

export async function getNetPositionHistory(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select({
      date: accountSnapshots.date,
      total: sql<string>`sum(${accountSnapshots.balance})`.as("total"),
    })
    .from(accountSnapshots)
    .where(gte(accountSnapshots.date, since.toISOString().split("T")[0]))
    .groupBy(accountSnapshots.date)
    .orderBy(asc(accountSnapshots.date));
}

export async function getAccountsWithBalances() {
  const allAccounts = await db.select().from(accounts);
  const result = [];

  for (const acc of allAccounts) {
    const [snapshot] = await db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.accountId, acc.id))
      .orderBy(desc(accountSnapshots.date))
      .limit(1);

    const snapshots = await db
      .select()
      .from(accountSnapshots)
      .where(eq(accountSnapshots.accountId, acc.id))
      .orderBy(asc(accountSnapshots.date))
      .limit(30);

    result.push({
      ...acc,
      balance: snapshot ? Number(snapshot.balance) : 0,
      sparkline: snapshots.map((s) => Number(s.balance)),
    });
  }

  return result;
}

export async function getIncomeVsExpenses(months: number) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const data = await db
    .select({
      month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`.as("month"),
      income: sql<string>`coalesce(sum(case when ${transactions.amount} >= 0 then ${transactions.amount} else 0 end), 0)`.as("income"),
      expenses: sql<string>`coalesce(sum(case when ${transactions.amount} < 0 then abs(${transactions.amount}) else 0 end), 0)`.as("expenses"),
    })
    .from(transactions)
    .where(gte(transactions.date, since))
    .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`)
    .orderBy(sql`month asc`);

  return data.map((d) => ({
    month: d.month,
    income: Number(d.income),
    expenses: Number(d.expenses),
  }));
}

export async function getSpendingByCategory(days: number) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select({
      category: transactions.category,
      total: sql<string>`sum(abs(${transactions.amount}))`.as("total"),
    })
    .from(transactions)
    .where(and(
      sql`${transactions.amount} < 0`,
      gte(transactions.date, since),
      isNotNull(transactions.category)
    ))
    .groupBy(transactions.category)
    .orderBy(sql`total desc`);
}

export async function getCategoryTrends(months: number) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  return db
    .select({
      month: sql<string>`to_char(${transactions.date}, 'YYYY-MM')`.as("month"),
      category: transactions.category,
      total: sql<string>`sum(abs(${transactions.amount}))`.as("total"),
    })
    .from(transactions)
    .where(and(
      sql`${transactions.amount} < 0`,
      gte(transactions.date, since),
      isNotNull(transactions.category)
    ))
    .groupBy(sql`to_char(${transactions.date}, 'YYYY-MM')`, transactions.category)
    .orderBy(sql`month asc`);
}

export async function getTopMerchants(days: number, limit = 10) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return db
    .select({
      merchant: sql<string>`coalesce(${transactions.merchantNormalised}, ${transactions.description})`.as("merchant"),
      total: sql<string>`sum(abs(${transactions.amount}))`.as("total"),
      count: sql<number>`count(*)`.as("count"),
    })
    .from(transactions)
    .where(and(sql`${transactions.amount} < 0`, gte(transactions.date, since)))
    .groupBy(sql`merchant`)
    .orderBy(sql`total desc`)
    .limit(limit);
}

export async function getTransactions(opts: {
  limit?: number;
  offset?: number;
  category?: string;
  owner?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const conditions = [];
  if (opts.category) conditions.push(eq(transactions.category, opts.category));
  if (opts.search) {
    conditions.push(sql`(${transactions.description} ilike ${'%' + opts.search + '%'} or ${transactions.merchantNormalised} ilike ${'%' + opts.search + '%'})`);
  }
  if (opts.dateFrom) conditions.push(gte(transactions.date, new Date(opts.dateFrom)));
  if (opts.dateTo) conditions.push(sql`${transactions.date} <= ${new Date(opts.dateTo)}`);

  let query = db
    .select({
      id: transactions.id,
      date: transactions.date,
      description: transactions.description,
      amount: transactions.amount,
      category: transactions.category,
      subcategory: transactions.subcategory,
      merchantNormalised: transactions.merchantNormalised,
      note: transactions.note,
      isBusinessInvestment: transactions.isBusinessInvestment,
      accountId: transactions.accountId,
      owner: accounts.owner,
      accountName: accounts.name,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id));

  if (opts.owner) conditions.push(eq(accounts.owner, opts.owner));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return query
    .where(where)
    .orderBy(desc(transactions.date))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
}

export async function getAnomalies() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const categoryAvgs = await db
    .select({
      category: transactions.category,
      avgAmount: sql<string>`avg(abs(${transactions.amount}))`.as("avg_amount"),
    })
    .from(transactions)
    .where(and(sql`${transactions.amount} < 0`, gte(transactions.date, ninetyDaysAgo), isNotNull(transactions.category)))
    .groupBy(transactions.category);

  const avgMap = new Map(categoryAvgs.map((c) => [c.category, Number(c.avgAmount)]));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentSpend = await db
    .select()
    .from(transactions)
    .where(and(sql`${transactions.amount} < 0`, gte(transactions.date, sevenDaysAgo), isNotNull(transactions.category)));

  return recentSpend
    .filter((txn) => {
      const avg = avgMap.get(txn.category!);
      return avg && Math.abs(Number(txn.amount)) > avg * 2;
    })
    .map((txn) => ({
      ...txn,
      average: avgMap.get(txn.category!)!,
      multiple: Math.abs(Number(txn.amount)) / avgMap.get(txn.category!)!,
    }));
}
