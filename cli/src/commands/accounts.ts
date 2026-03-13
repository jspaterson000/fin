import { Command } from "commander";
import * as p from "@clack/prompts";
import { db, accounts, accountSnapshots } from "@fin/db";
import { eq, desc } from "drizzle-orm";

export const accountsCommand = new Command("accounts")
  .description("List all accounts with current balances")
  .action(async () => {
    const allAccounts = await db.select().from(accounts);

    if (allAccounts.length === 0) {
      p.log.warn("No accounts found. Run 'fin sync' first.");
      process.exit(0);
      return;
    }

    const grouped: Record<string, typeof allAccounts> = {};
    for (const acc of allAccounts) {
      const key = acc.owner === "joint" ? "Joint" : acc.owner.charAt(0).toUpperCase() + acc.owner.slice(1);
      (grouped[key] ??= []).push(acc);
    }

    for (const [owner, accs] of Object.entries(grouped)) {
      p.log.info(`\n${owner}:`);
      for (const acc of accs) {
        const [snapshot] = await db
          .select()
          .from(accountSnapshots)
          .where(eq(accountSnapshots.accountId, acc.id))
          .orderBy(desc(accountSnapshots.date))
          .limit(1);

        const balance = snapshot ? `$${Number(snapshot.balance).toLocaleString("en-AU", { minimumFractionDigits: 2 })}` : "—";
        const lastSync = acc.lastSyncedAt
          ? new Date(acc.lastSyncedAt).toLocaleDateString("en-AU")
          : "never";

        p.log.info(`  ${acc.name} (${acc.type}) — ${balance} — synced: ${lastSync}`);
      }
    }
    process.exit(0);
  });
