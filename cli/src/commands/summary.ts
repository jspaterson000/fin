import { Command } from "commander";
import * as p from "@clack/prompts";
import { db, transactions, accounts, accountSnapshots } from "@fin/db";
import { sql, and, gte, eq, desc, isNotNull } from "drizzle-orm";
import { callClaude } from "../services/categoriser.js";

function fmt(n: number): string {
  return n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const summaryCommand = new Command("summary")
  .description("Print weekly financial summary")
  .action(async () => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Current balances by owner
    const allAccounts = await db.select().from(accounts);
    const ownerTotals: Record<string, { total: number; count: number }> = {};
    let netPosition = 0;

    for (const acc of allAccounts) {
      const [snapshot] = await db
        .select()
        .from(accountSnapshots)
        .where(eq(accountSnapshots.accountId, acc.id))
        .orderBy(desc(accountSnapshots.date))
        .limit(1);

      const balance = snapshot ? Number(snapshot.balance) : 0;
      netPosition += balance;

      const key = acc.owner === "joint" ? "Joint" : acc.owner.charAt(0).toUpperCase() + acc.owner.slice(1);
      ownerTotals[key] ??= { total: 0, count: 0 };
      ownerTotals[key].total += balance;
      ownerTotals[key].count++;
    }

    // Last week's net position
    let lastWeekNet = 0;
    for (const acc of allAccounts) {
      const [snapshot] = await db
        .select()
        .from(accountSnapshots)
        .where(and(
          eq(accountSnapshots.accountId, acc.id),
          sql`${accountSnapshots.date} <= ${weekAgo.toISOString().split("T")[0]}`
        ))
        .orderBy(desc(accountSnapshots.date))
        .limit(1);
      lastWeekNet += snapshot ? Number(snapshot.balance) : 0;
    }

    const netChange = netPosition - lastWeekNet;
    const arrow = netChange >= 0 ? "\u2191" : "\u2193";

    // This week's spend and income
    const [weekSpend] = await db
      .select({ total: sql<string>`coalesce(sum(abs(${transactions.amount})), 0)` })
      .from(transactions)
      .where(and(sql`${transactions.amount} < 0`, gte(transactions.date, weekAgo)));

    const [weekIncome] = await db
      .select({ total: sql<string>`coalesce(sum(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(sql`${transactions.amount} >= 0`, gte(transactions.date, weekAgo)));

    // Top categories this week
    const topCategories = await db
      .select({
        category: transactions.category,
        total: sql<string>`sum(abs(${transactions.amount}))`.as("total"),
      })
      .from(transactions)
      .where(and(
        sql`${transactions.amount} < 0`,
        gte(transactions.date, weekAgo),
        isNotNull(transactions.category)
      ))
      .groupBy(transactions.category)
      .orderBy(sql`total desc`)
      .limit(3);

    // Burn rate (30-day average)
    const [monthSpend] = await db
      .select({ total: sql<string>`coalesce(sum(abs(${transactions.amount})), 0)` })
      .from(transactions)
      .where(and(sql`${transactions.amount} < 0`, gte(transactions.date, thirtyDaysAgo)));
    const burnRate = Number(monthSpend.total);
    const runway = burnRate > 0 ? Math.floor(netPosition / burnRate) : Infinity;

    // Print briefing
    const dateStr = now.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
    console.log(`\n── State of Money (week ending ${dateStr}) ───────────────\n`);
    console.log(`Net position:    $${fmt(netPosition)}  (${arrow} $${fmt(Math.abs(netChange))} from last week)\n`);

    for (const [owner, data] of Object.entries(ownerTotals)) {
      console.log(`${owner.padEnd(16)} $${fmt(data.total)} across ${data.count} accounts`);
    }

    console.log(`\nThis week:       -$${fmt(Number(weekSpend.total))} spent · +$${fmt(Number(weekIncome.total))} income`);

    if (topCategories.length > 0) {
      const catStr = topCategories.map((c) => `${c.category} ($${fmt(Number(c.total))})`).join(" · ");
      console.log(`Top categories:  ${catStr}`);
    }

    console.log(`Burn rate:       $${fmt(burnRate)}/month → ${runway === Infinity ? "∞" : runway} months runway`);

    // Optional Claude narrative insights
    try {
      const statsPayload = JSON.stringify({
        netPosition, netChange, weekSpend: Number(weekSpend.total),
        weekIncome: Number(weekIncome.total), burnRate, runway,
        topCategories: topCategories.map((c) => ({ category: c.category, total: Number(c.total) })),
      });

      const insightPrompt = `You are a personal finance advisor for an Australian couple. Given these weekly stats, provide 2-3 brief, actionable observations. Be specific and helpful, not generic. Stats: ${statsPayload}. Reply with just the observations, one per line, starting with a relevant emoji.`;

      const insights = callClaude(insightPrompt);
      if (insights.trim()) {
        console.log(`\n${insights.trim()}`);
      }
    } catch {
      // Claude unavailable — skip narrative
    }

    console.log(`\n───────────────────────────────────────────────────────────`);
    process.exit(0);
  });
