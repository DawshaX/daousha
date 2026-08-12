import { index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Core account table backing Manus OAuth. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const contentSources = mysqlTable("content_sources", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  sourceKind: mysqlEnum("sourceKind", ["trend", "asset", "audio", "reference"]).notNull(),
  language: mysqlEnum("language", ["ar", "en", "both"]).default("both").notNull(),
  trustStatus: mysqlEnum("trustStatus", ["proposed", "approved", "held", "rejected"]).default("proposed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const contentAssets = mysqlTable("content_assets", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  assetKind: mysqlEnum("assetKind", ["video", "audio", "image", "document", "other"]).notNull(),
  storageKey: varchar("storageKey", { length: 1024 }),
  storageUrl: varchar("storageUrl", { length: 1500 }),
  sourceUrl: varchar("sourceUrl", { length: 1500 }),
  licenseType: varchar("licenseType", { length: 160 }).notNull(),
  licenseUrl: varchar("licenseUrl", { length: 1500 }),
  attribution: text("attribution"),
  licenseStatus: mysqlEnum("licenseStatus", ["pending", "approved", "held", "rejected"]).default("pending").notNull(),
  safetyStatus: mysqlEnum("safetyStatus", ["clear", "review", "blocked"]).default("review").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  brief: text("brief"),
  targetLanguage: mysqlEnum("targetLanguage", ["ar", "en", "both"]).default("both").notNull(),
  status: mysqlEnum("status", ["idea", "research", "script", "production", "review", "approved", "scheduled", "published", "blocked"]).default("idea").notNull(),
  scriptArabic: text("scriptArabic"),
  scriptEnglish: text("scriptEnglish"),
  humanApprovedAt: timestamp("humanApprovedAt"),
  scheduledAt: timestamp("scheduledAt"),
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projectAssets = mysqlTable("project_assets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  assetId: int("assetId").notNull(),
  clipRole: mysqlEnum("clipRole", ["primary", "broll", "audio", "reference"]).default("broll").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const workflowTasks = mysqlTable("workflow_tasks", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  taskKind: mysqlEnum("taskKind", ["trend_scan", "script", "translation", "rights_check", "safety_check", "render", "publish"]).notNull(),
  status: mysqlEnum("status", ["queued", "running", "needs_review", "completed", "failed", "blocked"]).default("queued").notNull(),
  detail: text("detail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const developmentProposals = mysqlTable("development_proposals", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  proposalKind: mysqlEnum("proposalKind", ["source", "workflow", "integration", "model", "safety_rule"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  rationale: text("rationale").notNull(),
  referenceUrl: varchar("referenceUrl", { length: 1500 }),
  state: mysqlEnum("state", ["proposed", "approved", "rejected"]).default("proposed").notNull(),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const publishingSchedules = mysqlTable("publishing_schedules", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  platform: varchar("platform", { length: 80 }).notNull(),
  cronExpression: varchar("cronExpression", { length: 80 }).notNull(),
  timeZone: varchar("timeZone", { length: 80 }).default("UTC").notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  status: mysqlEnum("status", ["draft", "paused", "active", "needs_approval", "failed"]).default("draft").notNull(),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("publishing_schedules_task_uid_idx").on(table.scheduleCronTaskUid)]);

export const systemChangeLog = mysqlTable("system_change_log", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  proposalId: int("proposalId"),
  category: mysqlEnum("category", ["source", "workflow", "integration", "model", "safety_rule", "schedule"]).notNull(),
  summary: varchar("summary", { length: 255 }).notNull(),
  details: text("details"),
  actorType: mysqlEnum("actorType", ["user", "system", "scheduled_job"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const analyticsSnapshots = mysqlTable("analytics_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  platform: varchar("platform", { length: 80 }).notNull(),
  views: int("views").default(0).notNull(),
  engagements: int("engagements").default(0).notNull(),
  retentionRate: int("retentionRate").default(0).notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
