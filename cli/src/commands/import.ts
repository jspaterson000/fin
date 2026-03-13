import { readFileSync } from "node:fs";
import { Command } from "commander";
import * as p from "@clack/prompts";
import { db, accounts, transactions, accountSnapshots, syncLog } from "@fin/db";
import { eq } from "drizzle-orm";
import { parseMacquarieCsv } from "../services/csv-parser.js";

export const importCommand = new Command("import")
  .description("Import Macquarie CSV file")
  .argument("<file>", "Path to Macquarie CSV export")
  .action(async (file: string) => {
    const spinner = p.spinner();

    try {
      spinner.start("Reading CSV...");
      const content = readFileSync(file, "utf-8");
      const rows = parseMacquarieCsv(content);
      spinner.stop(`Parsed ${rows.length} rows`);

      if (rows.length === 0) {
        p.log.warn("No transactions found in CSV.");
        process.exit(0);
        return;
      }

      // Get or create Macquarie savings account
      let [macAccount] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.bank, "macquarie"))
        .limit(1);

      if (!macAccount) {
        [macAccount] = await db
          .insert(accounts)
          .values({
            bank: "macquarie",
            name: "Macquarie Savings",
            type: "saver",
            owner: "joint",
          })
          .returning();
      }

      spinner.start("Importing transactions...");
      let added = 0;

      for (const row of rows) {
        const inserted = await db
          .insert(transactions)
          .values({
            accountId: macAccount.id,
            csvHash: row.hash,
            date: row.date,
            description: row.description,
            amount: row.amount,
          })
          .onConflictDoNothing({ target: transactions.csvHash })
          .returning({ id: transactions.id });

        if (inserted.length > 0) added++;
      }

      // Snapshot balance from most recent row
      const latestBalance = rows[0].balance;
      const today = new Date().toISOString().split("T")[0];
      await db
        .insert(accountSnapshots)
        .values({
          accountId: macAccount.id,
          date: today,
          balance: latestBalance,
        })
        .onConflictDoUpdate({
          target: [accountSnapshots.accountId, accountSnapshots.date],
          set: { balance: latestBalance },
        });

      await db.insert(syncLog).values({
        source: "csv",
        accountsSynced: 1,
        transactionsAdded: added,
        status: "success",
      });

      spinner.stop(`Imported ${added} new transactions (${rows.length - added} duplicates skipped)`);
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      spinner.stop(`Import failed: ${message}`);
      process.exit(1);
    }
  });
