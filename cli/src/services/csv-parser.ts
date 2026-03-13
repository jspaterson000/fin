import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";

export interface CsvRow {
  date: Date;
  description: string;
  amount: string;
  balance: string;
  hash: string;
  accountName: string;
  category: string | null;
  subcategory: string | null;
}

export function hashTransaction(date: string, description: string, amount: string, balance: string): string {
  return createHash("sha256")
    .update(`${date}|${description}|${amount}|${balance}`)
    .digest("hex")
    .slice(0, 32);
}

interface MacquarieRecord {
  "Transaction Date": string;
  "Details": string;
  "Account": string;
  "Category": string;
  "Subcategory": string;
  "Debit": string;
  "Credit": string;
  "Balance": string;
  "Original Description": string;
}

function parseDate(dateStr: string): Date {
  // Handle both "DD/MM/YYYY" and "DD Mon YYYY" formats
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(dateStr);
}

export function parseMacquarieCsv(content: string): CsvRow[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as MacquarieRecord[];

  return records.map((record) => {
    const dateStr = record["Transaction Date"];
    const date = parseDate(dateStr);

    const debit = record["Debit"]?.trim();
    const credit = record["Credit"]?.trim();
    // Debit = money out (negative), Credit = money in (positive)
    const amount = debit ? `-${debit}` : credit || "0";

    const description = record["Original Description"]?.trim() || record["Details"]?.trim() || "";

    return {
      date,
      description,
      amount,
      balance: record["Balance"]?.trim() || "0",
      hash: hashTransaction(dateStr, description, amount, record["Balance"]?.trim() || "0"),
      accountName: record["Account"]?.trim() || "Unknown",
      category: record["Category"]?.trim() || null,
      subcategory: record["Subcategory"]?.trim() || null,
    };
  });
}
