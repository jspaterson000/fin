import { describe, it, expect } from "vitest";
import { buildPrompt, parseResponse, type TransactionInput } from "../../src/services/categoriser.js";

describe("buildPrompt", () => {
  it("includes transaction data in prompt", () => {
    const txns: TransactionInput[] = [
      { id: 1, description: "WOOLWORTHS 1234 BRISBANE", amount: "-45.50", date: "2026-03-13" },
    ];
    const prompt = buildPrompt(txns);
    expect(prompt).toContain("WOOLWORTHS 1234 BRISBANE");
    expect(prompt).toContain("-45.50");
    expect(prompt).toContain("transaction_id");
  });
});

describe("parseResponse", () => {
  it("parses valid JSON array response", () => {
    const response = JSON.stringify([
      {
        transaction_id: 1,
        category: "Groceries",
        subcategory: "Groceries – supermarket",
        merchant_normalised: "Woolworths Brisbane CBD",
        note: "Regular weekly shop",
        is_business_investment: false,
      },
    ]);
    const inputIds = [1];
    const result = parseResponse(response, inputIds);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Groceries");
  });

  it("filters out results with unknown transaction IDs", () => {
    const response = JSON.stringify([
      { transaction_id: 1, category: "Groceries", subcategory: "Groceries – supermarket", merchant_normalised: "Woolworths", note: null, is_business_investment: false },
      { transaction_id: 999, category: "Dining", subcategory: "Dining – coffee", merchant_normalised: "Cafe", note: null, is_business_investment: false },
    ]);
    const result = parseResponse(response, [1]);
    expect(result).toHaveLength(1);
    expect(result[0].transaction_id).toBe(1);
  });

  it("handles malformed JSON gracefully", () => {
    const result = parseResponse("not json at all", [1]);
    expect(result).toHaveLength(0);
  });

  it("extracts JSON from markdown code blocks", () => {
    const response = "Here are the results:\n```json\n[{\"transaction_id\":1,\"category\":\"Dining\",\"subcategory\":\"Dining – coffee\",\"merchant_normalised\":\"Cafe\",\"note\":null,\"is_business_investment\":false}]\n```";
    const result = parseResponse(response, [1]);
    expect(result).toHaveLength(1);
  });
});
