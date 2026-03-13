import {
  pgTable, text, integer, timestamp, date, boolean, numeric, index, unique,
} from "drizzle-orm/pg-core";

export const accounts = pgTable("accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  bank: text("bank").notNull(), // "up" | "macquarie"
  name: text("name").notNull(),
  type: text("type").notNull(), // "transaction" | "saver" | "joint"
  owner: text("owner").notNull(), // "jacob" | "thalya" | "joint"
  upAccountId: text("up_account_id").unique(),
  lastSyncedAt: text("last_synced_at"), // ISO timestamp for UP API filter[since]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  upTransactionId: text("up_transaction_id").unique(),
  csvHash: text("csv_hash").unique(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  category: text("category"),
  subcategory: text("subcategory"),
  rawCategory: text("raw_category"),
  merchantNormalised: text("merchant_normalised"),
  note: text("note"),
  isBusinessInvestment: boolean("is_business_investment").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
}, (table) => [
  index("idx_transactions_account_date").on(table.accountId, table.date),
  index("idx_transactions_category").on(table.category),
  index("idx_transactions_date").on(table.date),
]);

export const accountSnapshots = pgTable("account_snapshots", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  date: date("date").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  unique("uq_snapshot_account_date").on(table.accountId, table.date),
]);

export const syncLog = pgTable("sync_log", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
  source: text("source").notNull(), // "up_api" | "csv"
  accountsSynced: integer("accounts_synced").notNull(),
  transactionsAdded: integer("transactions_added").notNull(),
  status: text("status").notNull(), // "success" | "error"
  errorMessage: text("error_message"),
});
