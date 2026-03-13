import { Command } from "commander";
import * as p from "@clack/prompts";
import { db, accounts, transactions, accountSnapshots, syncLog } from "@fin/db";
import { eq } from "drizzle-orm";
import { UpApi } from "../services/up-api.js";

function mapOwnershipType(ownershipType: string, tokenOwner: string): string {
  if (ownershipType === "JOINT") return "joint";
  return tokenOwner;
}

function mapAccountType(accountType: string, ownershipType: string): string {
  if (ownershipType === "JOINT") return "joint";
  if (accountType === "SAVER") return "saver";
  return "transaction";
}

interface TokenConfig {
  owner: string;
  token: string;
}

function getTokens(): TokenConfig[] {
  const tokens: TokenConfig[] = [];
  const jacobToken = process.env.UP_API_TOKEN;
  if (jacobToken) tokens.push({ owner: "jacob", token: jacobToken });
  const thalyaToken = process.env.UP_API_TOKEN_THALYA;
  if (thalyaToken) tokens.push({ owner: "thalya", token: thalyaToken });
  return tokens;
}

export const syncCommand = new Command("sync")
  .description("Pull latest transactions from UP Banking")
  .action(async () => {
    const tokens = getTokens();
    if (tokens.length === 0) {
      p.log.error("No UP API tokens set in .env (UP_API_TOKEN, UP_API_TOKEN_THALYA)");
      process.exit(1);
    }

    const spinner = p.spinner();

    try {
      let totalAccounts = 0;
      let totalTransactions = 0;

      for (const { owner, token } of tokens) {
        const api = new UpApi(token);
        spinner.start(`Fetching ${owner}'s UP accounts...`);
        const upAccounts = await api.getAccounts();
        spinner.stop(`Found ${upAccounts.length} accounts for ${owner}`);

        for (const upAccount of upAccounts) {
          const [dbAccount] = await db
            .insert(accounts)
            .values({
              bank: "up",
              name: upAccount.attributes.displayName,
              type: mapAccountType(upAccount.attributes.accountType, upAccount.attributes.ownershipType),
              owner: mapOwnershipType(upAccount.attributes.ownershipType, owner),
              upAccountId: upAccount.id,
            })
            .onConflictDoUpdate({
              target: accounts.upAccountId,
              set: {
                name: upAccount.attributes.displayName,
                type: mapAccountType(upAccount.attributes.accountType, upAccount.attributes.ownershipType),
                owner: mapOwnershipType(upAccount.attributes.ownershipType, owner),
              },
            })
            .returning();

          spinner.start(`Syncing ${upAccount.attributes.displayName}...`);
          const upTransactions = await api.getTransactions(
            upAccount.id,
            dbAccount.lastSyncedAt ?? undefined
          );

          let added = 0;
          for (const txn of upTransactions) {
            const settledAt = txn.attributes.settledAt;
            if (!settledAt) continue;

            const result = await db
              .insert(transactions)
              .values({
                accountId: dbAccount.id,
                upTransactionId: txn.id,
                date: new Date(settledAt),
                description: txn.attributes.description,
                amount: txn.attributes.amount.value,
                rawCategory: txn.relationships.category?.data?.id ?? null,
              })
              .onConflictDoNothing({ target: transactions.upTransactionId })
              .returning({ id: transactions.id });

            if (result.length > 0) added++;
          }
          totalTransactions += added;

          await db
            .update(accounts)
            .set({ lastSyncedAt: new Date().toISOString() })
            .where(eq(accounts.id, dbAccount.id));

          const today = new Date().toISOString().split("T")[0];
          await db
            .insert(accountSnapshots)
            .values({
              accountId: dbAccount.id,
              date: today,
              balance: upAccount.attributes.balance.value,
            })
            .onConflictDoUpdate({
              target: [accountSnapshots.accountId, accountSnapshots.date],
              set: { balance: upAccount.attributes.balance.value },
            });

          spinner.stop(`${upAccount.attributes.displayName}: ${added} new transactions`);
        }

        totalAccounts += upAccounts.length;
      }

      await db.insert(syncLog).values({
        source: "up_api",
        accountsSynced: totalAccounts,
        transactionsAdded: totalTransactions,
        status: "success",
      });

      p.log.success(`Sync complete: ${totalTransactions} new transactions across ${totalAccounts} accounts`);
      process.exit(0);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db.insert(syncLog).values({
        source: "up_api",
        accountsSynced: 0,
        transactionsAdded: 0,
        status: "error",
        errorMessage: message,
      });
      p.log.error(`Sync failed: ${message}`);
      process.exit(1);
    }
  });
