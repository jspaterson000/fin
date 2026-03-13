import { execSync } from "node:child_process";

export interface TransactionInput {
  id: number;
  description: string;
  amount: string;
  date: string;
}

export interface CategorisedTransaction {
  transaction_id: number;
  category: string;
  subcategory: string;
  merchant_normalised: string;
  note: string | null;
  is_business_investment: boolean;
}

const CATEGORIES = [
  "Groceries", "Dining", "Transport", "Utilities", "Entertainment",
  "Shopping", "Health", "Income", "Transfer", "Business Investment",
  "Subscriptions", "Rent/Housing", "Insurance", "Personal Care",
  "Education", "Gifts", "Other",
];

export function buildPrompt(txns: TransactionInput[]): string {
  const txnList = txns
    .map((t) => `- ID: ${t.id} | Date: ${t.date} | Amount: $${t.amount} | Description: "${t.description}"`)
    .join("\n");

  return `You are a personal finance categoriser for an Australian couple. Categorise each transaction and return a JSON array.

For each transaction, return:
{
  "transaction_id": <the ID provided>,
  "category": "<one of: ${CATEGORIES.join(", ")}>",
  "subcategory": "<specific subcategory, e.g. 'Dining – coffee', 'Groceries – supermarket', 'Transport – fuel'>",
  "merchant_normalised": "<clean, readable merchant name>",
  "note": "<brief observation if anything stands out, otherwise null>",
  "is_business_investment": <true if this looks like a business expense, false otherwise>
}

Transactions:
${txnList}

Return ONLY a JSON array, no other text.`;
}

export function parseResponse(response: string, validIds: number[]): CategorisedTransaction[] {
  try {
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = codeBlockMatch ? codeBlockMatch[1].trim() : response.trim();

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    const idSet = new Set(validIds);
    return parsed.filter(
      (item: CategorisedTransaction) =>
        idSet.has(item.transaction_id) &&
        typeof item.category === "string" &&
        typeof item.subcategory === "string"
    );
  } catch {
    return [];
  }
}

export function callClaude(prompt: string): string {
  const result = execSync("claude --print", {
    input: prompt,
    encoding: "utf-8",
    timeout: 120_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return result;
}
