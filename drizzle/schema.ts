import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** A CSV source imported by an authenticated workspace member. File bytes live in object storage. */
export const datasets = mysqlTable(
  "datasets",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    sourceFileKey: varchar("sourceFileKey", { length: 512 }).notNull(),
    sourceFileUrl: varchar("sourceFileUrl", { length: 1024 }).notNull(),
    rowCount: int("rowCount").notNull().default(0),
    columnCount: int("columnCount").notNull().default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("datasets_owner_idx").on(table.ownerId)],
);

/** One immutable profiling execution against a particular dataset version. */
export const qualityRuns = mysqlTable(
  "quality_runs",
  {
    id: int("id").autoincrement().primaryKey(),
    datasetId: int("datasetId")
      .notNull()
      .references(() => datasets.id, { onDelete: "cascade" }),
    ownerId: int("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: mysqlEnum("status", ["succeeded", "failed"]).notNull(),
    qualityScore: int("qualityScore").notNull(),
    rowsProfiled: int("rowsProfiled").notNull(),
    columnsProfiled: int("columnsProfiled").notNull(),
    durationMs: int("durationMs").notNull(),
    reportJson: text("reportJson").notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  table => [index("quality_runs_dataset_idx").on(table.datasetId), index("quality_runs_owner_idx").on(table.ownerId)],
);

/** A rule-level observation saved for every run, including passed checks for traceability. */
export const qualityFindings = mysqlTable(
  "quality_findings",
  {
    id: int("id").autoincrement().primaryKey(),
    runId: int("runId")
      .notNull()
      .references(() => qualityRuns.id, { onDelete: "cascade" }),
    ruleCode: varchar("ruleCode", { length: 64 }).notNull(),
    ruleName: varchar("ruleName", { length: 255 }).notNull(),
    dimension: mysqlEnum("dimension", ["completeness", "validity", "integrity", "freshness", "consistency"]).notNull(),
    status: mysqlEnum("status", ["passed", "review", "failed"]).notNull(),
    fieldName: varchar("fieldName", { length: 255 }).notNull(),
    affectedRows: int("affectedRows").notNull(),
    evaluatedRows: int("evaluatedRows").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("quality_findings_run_idx").on(table.runId)],
);

/** Inbox-style owner alerts produced when a run completes or surfaces an actionable issue. */
export const qualityNotifications = mysqlTable(
  "quality_notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    runId: int("runId").references(() => qualityRuns.id, { onDelete: "set null" }),
    kind: mysqlEnum("kind", ["run_completed", "quality_alert"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    isRead: boolean("isRead").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [index("quality_notifications_owner_idx").on(table.ownerId)],
);

/**
 * One-time, short-lived OAuth handoffs used only when the static GitHub Pages
 * frontend returns from the API host. The browser receives the opaque code in
 * the URL fragment; the database stores only its SHA-256 digest and the user
 * identifier required to mint a session at redemption time.
 */
export const authHandoffs = mysqlTable(
  "auth_handoffs",
  {
    id: int("id").autoincrement().primaryKey(),
    codeHash: varchar("codeHash", { length: 64 }).notNull().unique(),
    openId: varchar("openId", { length: 64 }).notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    consumedAt: timestamp("consumedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  table => [
    index("auth_handoffs_expiry_idx").on(table.expiresAt),
    index("auth_handoffs_user_idx").on(table.openId),
  ],
);

export type Dataset = typeof datasets.$inferSelect;
export type QualityRun = typeof qualityRuns.$inferSelect;
export type QualityFinding = typeof qualityFindings.$inferSelect;
