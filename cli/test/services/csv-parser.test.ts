import { describe, it, expect } from "vitest";
import { parseMacquarieCsv, hashTransaction } from "../../src/services/csv-parser.js";

const SAMPLE_CSV = `Date,Description,Amount,Balance
13/03/2026,WOOLWORTHS 1234,-45.50,2954.50
13/03/2026,SALARY PAYMENT,3500.00,6454.50
12/03/2026,UBER *TRIP,-22.30,3000.00`;

describe("parseMacquarieCsv", () => {
  it("parses rows into transactions", () => {
    const rows = parseMacquarieCsv(SAMPLE_CSV);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      date: new Date("2026-03-13"),
      description: "WOOLWORTHS 1234",
      amount: "-45.50",
      balance: "2954.50",
      hash: expect.any(String),
    });
  });

  it("handles positive and negative amounts", () => {
    const rows = parseMacquarieCsv(SAMPLE_CSV);
    expect(rows[0].amount).toBe("-45.50");
    expect(rows[1].amount).toBe("3500.00");
  });

  it("generates unique hashes", () => {
    const rows = parseMacquarieCsv(SAMPLE_CSV);
    const hashes = rows.map((r) => r.hash);
    expect(new Set(hashes).size).toBe(3);
  });

  it("returns latest balance", () => {
    const rows = parseMacquarieCsv(SAMPLE_CSV);
    expect(rows[0].balance).toBe("2954.50");
  });
});

describe("hashTransaction", () => {
  it("produces deterministic hash", () => {
    const h1 = hashTransaction("2026-03-13", "WOOLWORTHS", "-45.50", "2954.50");
    const h2 = hashTransaction("2026-03-13", "WOOLWORTHS", "-45.50", "2954.50");
    expect(h1).toBe(h2);
  });

  it("differs when balance differs", () => {
    const h1 = hashTransaction("2026-03-13", "WOOLWORTHS", "-45.50", "2954.50");
    const h2 = hashTransaction("2026-03-13", "WOOLWORTHS", "-45.50", "2909.00");
    expect(h1).not.toBe(h2);
  });
});
