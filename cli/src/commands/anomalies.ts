import { Command } from "commander";
import * as p from "@clack/prompts";
import { db, transactions } from "@fin/db";
import { sql, and, gte, isNotNull } from "drizzle-orm";

export const anomaliesCommand = new Command("anomalies")
  .description("Check for unusual spending")
  .action(async () => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Get category averages for spend transactions over last 90 days
    const categoryAvgs = await db
      .select({
        category: transactions.category,
        avgAmount: sql<string>`avg(abs(${transactions.amount}))`.as("avg_amount"),
      })
      .from(transactions)
      .where(
        and(
          sql`${transactions.amount} < 0`,
          gte(transactions.date, ninetyDaysAgo),
          isNotNull(transactions.category)
        )
      )
      .groupBy(transactions.category);

    const avgMap = new Map(categoryAvgs.map((c) => [c.category, Number(c.avgAmount)]));

    // Find recent spend transactions exceeding 2x average
    const recentSpend = await db
      .select({
        id: transactions.id,
        date: transactions.date,
        description: transactions.description,
        amount: transactions.amount,
        category: transactions.category,
        merchantNormalised: transactions.merchantNormalised,
      })
      .from(transactions)
      .where(
        and(
          sql`${transactions.amount} < 0`,
          gte(transactions.date, ninetyDaysAgo),
          isNotNull(transactions.category)
        )
      );

    const anomalies = recentSpend.filter((txn) => {
      const avg = avgMap.get(txn.category!);
      if (!avg) return false;
      return Math.abs(Number(txn.amount)) > avg * 2;
    });

    if (anomalies.length === 0) {
      p.log.info("No unusual spending detected.");
      process.exit(0);
      return;
    }

    p.log.warn(`${anomalies.length} unusual transactions found:\n`);
    for (const a of anomalies) {
      const avg = avgMap.get(a.category!)!;
      const multiple = (Math.abs(Number(a.amount)) / avg).toFixed(1);
      const merchant = a.merchantNormalised ?? a.description;
      const dateStr = a.date.toLocaleDateString("en-AU");
      p.log.warn(
        `  $${Math.abs(Number(a.amount)).toFixed(2)} at ${merchant} on ${dateStr} — ${multiple}x your ${a.category} average`
      );
    }
    process.exit(0);
  });
