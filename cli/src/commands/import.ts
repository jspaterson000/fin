import { readFileSync } from "node:fs";
import { Command } from "commander";
import * as p from "@clack/prompts";
import { db, accounts, transactions, accountSnapshots, syncLog } from "@fin/db";
import { eq, and } from "drizzle-orm";
import { parseMacquarieCsv } from "../services/csv-parser.js";

function mapAccountType(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("savings")) return "saver";
  if (lower.includes("spending") || lower.includes("transaction")) return "transaction";
  return "saver";
}

function mapOwner(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("personal")) return "jacob";
  if (lower.includes("joint")) return "joint";
  return "joint";
}

export const importCommand = new Command("import")
  .description("Import Macquarie CSV file")
  .argument("<file...>", "Path(s) to Macquarie CSV export(s)")
  .action(async (files: string[]) => {
    const spinner = p.spinner();

    try {
      let totalAdded = 0;
      let totalParsed = 0;
      const accountsSeen = new Set<string>();

      for (const file of files) {
        spinner.start(`Reading ${file}...`);
        const content = readFileSync(file, "utf-8");
        const rows = parseMacquarieCsv(content);
        spinner.stop(`Parsed ${rows.length} rows from ${file}`);

        if (rows.length === 0) continue;
        totalParsed += rows.length;

        // Group by account name
        const byAccount = new Map<string, typeof rows>();
        for (const row of rows) {
          const existing = byAccount.get(row.accountName) ?? [];
          existing.push(row);
          byAccount.set(row.accountName, existing);
        }

        for (const [accountName, accountRows] of byAccount) {
          // Get or create account
          let [macAccount] = await db
            .select()
            .from(accounts)
            .where(and(eq(accounts.bank, "macquarie"), eq(accounts.name, accountName)))
            .limit(1);

          if (!macAccount) {
            [macAccount] = await db
              .insert(accounts)
              .values({
                bank: "macquarie",
                name: accountName,
                type: mapAccountType(accountName),
                owner: mapOwner(accountName),
              })
              .returning();
          }

          accountsSeen.add(accountName);
          spinner.start(`Importing ${accountRows.length} transactions for ${accountName}...`);

          let added = 0;
          for (const row of accountRows) {
            const inserted = await db
              .insert(transactions)
              .values({
                accountId: macAccount.id,
                csvHash: row.hash,
                date: row.date,
                description: row.description,
                amount: row.amount,
                rawCategory: row.category && row.subcategory
                  ? `${row.category}/${row.subcategory}`
                  : row.category ?? null,
              })
              .onConflictDoNothing({ target: transactions.csvHash })
              .returning({ id: transactions.id });

            if (inserted.length > 0) added++;
          }
          totalAdded += added;

          // Snapshot balance from most recent row
          const latestBalance = accountRows[0].balance;
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

          spinner.stop(`${accountName}: ${added} new (${accountRows.length - added} duplicates skipped)`);
        }
      }

      await db.insert(syncLog).values({
        source: "csv",
        accountsSynced: accountsSeen.size,
        transactionsAdded: totalAdded,
        status: "success",
      });

      p.log.success(`Import complete: ${totalAdded} new transactions across ${accountsSeen.size} Macquarie accounts (${totalParsed - totalAdded} duplicates skipped)`);
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db.insert(syncLog).values({
        source: "csv",
        accountsSynced: 0,
        transactionsAdded: 0,
        status: "error",
        errorMessage: message,
      });
      p.log.error(`Import failed: ${message}`);
      process.exit(1);
    }
  });
