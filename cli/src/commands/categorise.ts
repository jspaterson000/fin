import { Command } from "commander";
import * as p from "@clack/prompts";
import { db, transactions } from "@fin/db";
import { isNull, eq } from "drizzle-orm";
import {
  buildPrompt, parseResponse, callClaude, type TransactionInput,
} from "../services/categoriser.js";

const BATCH_SIZES = [50, 25, 10];

export const categoriseCommand = new Command("categorise")
  .description("Categorise uncategorised transactions using Claude")
  .action(async () => {
    const uncategorised = await db
      .select({
        id: transactions.id,
        description: transactions.description,
        amount: transactions.amount,
        date: transactions.date,
      })
      .from(transactions)
      .where(isNull(transactions.category));

    if (uncategorised.length === 0) {
      p.log.info("All transactions are categorised.");
      process.exit(0);
      return;
    }

    p.log.info(`${uncategorised.length} uncategorised transactions found.`);
    const spinner = p.spinner();
    let totalCategorised = 0;

    for (let i = 0; i < uncategorised.length; ) {
      let batchSizeIdx = 0;
      const remaining = uncategorised.slice(i);
      let categorised = false;

      while (batchSizeIdx < BATCH_SIZES.length && !categorised) {
        const batchSize = Math.min(BATCH_SIZES[batchSizeIdx], remaining.length);
        const batch = remaining.slice(0, batchSize);
        const inputs: TransactionInput[] = batch.map((t) => ({
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date.toISOString().split("T")[0],
        }));

        spinner.start(`Categorising batch of ${batchSize} (${i + 1}-${i + batchSize} of ${uncategorised.length})...`);

        try {
          const prompt = buildPrompt(inputs);
          const response = callClaude(prompt);
          const results = parseResponse(response, inputs.map((t) => t.id));

          if (results.length === 0 && batchSizeIdx < BATCH_SIZES.length - 1) {
            spinner.stop(`Empty response, retrying with smaller batch...`);
            batchSizeIdx++;
            continue;
          }

          for (const result of results) {
            await db
              .update(transactions)
              .set({
                category: result.category,
                subcategory: result.subcategory,
                merchantNormalised: result.merchant_normalised,
                note: result.note,
                isBusinessInvestment: result.is_business_investment,
                updatedAt: new Date(),
              })
              .where(eq(transactions.id, result.transaction_id));
          }

          totalCategorised += results.length;
          i += batchSize;
          categorised = true;
          spinner.stop(`Categorised ${results.length}/${batchSize} transactions`);
        } catch (error) {
          if (batchSizeIdx < BATCH_SIZES.length - 1) {
            spinner.stop(`Error, retrying with smaller batch...`);
            batchSizeIdx++;
          } else {
            const skippedIds = batch.map((t) => t.id);
            p.log.warn(`Failed after all retry sizes. Skipping IDs: ${skippedIds.join(", ")}`);
            spinner.stop(`Skipped batch.`);
            i += BATCH_SIZES[batchSizeIdx];
            categorised = true;
          }
        }
      }
    }

    p.log.success(`Done: ${totalCategorised} transactions categorised.`);
    process.exit(0);
  });
