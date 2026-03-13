import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";

export interface CsvRow {
  date: Date;
  description: string;
  amount: string;
  balance: string;
  hash: string;
}

export function hashTransaction(date: string, description: string, amount: string, balance: string): string {
  return createHash("sha256")
    .update(`${date}|${description}|${amount}|${balance}`)
    .digest("hex")
    .slice(0, 32);
}

export function parseMacquarieCsv(content: string): CsvRow[] {
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as { Date: string; Description: string; Amount: string; Balance: string }[];

  return records.map((record) => {
    const dateStr = record.Date; // DD/MM/YYYY
    const [day, month, year] = dateStr.split("/");
    const date = new Date(`${year}-${month}-${day}`);

    return {
      date,
      description: record.Description,
      amount: record.Amount,
      balance: record.Balance,
      hash: hashTransaction(dateStr, record.Description, record.Amount, record.Balance),
    };
  });
}
