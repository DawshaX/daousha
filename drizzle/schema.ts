import { boolean, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

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
  reviewNotes: text("reviewNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const videoProjects = mysqlTable("video_projects", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  brief: text("brief"),
  targetLanguage: mysqlEnum("targetLanguage", ["ar", "en", "both"]).default("both").notNull(),
  contentFormat: mysqlEnum("contentFormat", ["short", "long"]).default("short").notNull(),
  projectKind: mysqlEnum("projectKind", ["standalone", "package_parent", "package_variant"]).default("standalone").notNull(),
  orientation: mysqlEnum("orientation", ["vertical", "horizontal", "none"]).default("none").notNull(),
  parentProjectId: int("parentProjectId"),
  status: mysqlEnum("status", ["idea", "research", "script", "production", "review", "approved", "scheduled", "published", "blocked"]).default("idea").notNull(),
  scriptArabic: text("scriptArabic"),
  scriptEnglish: text("scriptEnglish"),
  humanApprovedAt: timestamp("humanApprovedAt"),
  previewAcknowledgedAt: timestamp("previewAcknowledgedAt"),
  previewAcknowledgedBy: int("previewAcknowledgedBy"),
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
  contentVariant: mysqlEnum("contentVariant", ["ar", "en", "both", "none"]).default("none").notNull(),
  views: int("views").default(0).notNull(),
  engagements: int("engagements").default(0).notNull(),
  retentionRate: int("retentionRate").default(0).notNull(),
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

/** Official channel connection metadata. OAuth credentials stay server-side and are never returned to the client. */
export const channelConnections = mysqlTable("channel_connections", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  platform: mysqlEnum("platform", ["youtube", "tiktok", "instagram", "facebook", "telegram"]).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  externalAccountRef: varchar("externalAccountRef", { length: 320 }),
  status: mysqlEnum("status", ["disconnected", "configured", "authorized", "error"]).default("disconnected").notNull(),
  scopeSummary: text("scopeSummary"),
  credentialCiphertext: text("credentialCiphertext"),
  credentialExpiresAt: timestamp("credentialExpiresAt"),
  lastVerifiedAt: timestamp("lastVerifiedAt"),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("channel_connections_owner_platform_idx").on(table.ownerId, table.platform)]);

/** Durable, non-publishing health state for an authorized platform connection. */
export const connectionHealthMonitors = mysqlTable("connection_health_monitors", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  platform: mysqlEnum("platform", ["youtube", "facebook", "instagram", "tiktok"]).notNull(),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  status: mysqlEnum("status", ["healthy", "degraded", "disconnected"]).default("degraded").notNull(),
  lastNotifiedStatus: mysqlEnum("lastNotifiedStatus", ["healthy", "degraded", "disconnected"]),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastNotificationAt: timestamp("lastNotificationAt"),
  lastDetail: text("lastDetail"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  uniqueIndex("connection_health_monitors_owner_platform_idx").on(table.ownerId, table.platform),
  index("connection_health_monitors_task_uid_idx").on(table.scheduleCronTaskUid),
]);

/** Guardrails for autonomous publishing. A kill switch always takes precedence over the selected mode. */
export const publishingPolicies = mysqlTable("publishing_policies", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().unique(),
  mode: mysqlEnum("mode", ["human_review", "guarded_auto"]).default("human_review").notNull(),
  publicPublishingEnabled: boolean("publicPublishingEnabled").default(false).notNull(),
  killSwitchEnabled: boolean("killSwitchEnabled").default(true).notNull(),
  requirePrivateCanary: boolean("requirePrivateCanary").default(true).notNull(),
  minIntervalMinutes: int("minIntervalMinutes").default(10).notNull(),
  maxPublicationsPerDay: int("maxPublicationsPerDay").default(6).notNull(),
  dailyShortTarget: int("dailyShortTarget").default(4).notNull(),
  dailyLongTarget: int("dailyLongTarget").default(2).notNull(),
  lastPublishedAt: timestamp("lastPublishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Append-only operational history for every proposed, blocked, uploaded, or published item. */
export const publishingRuns = mysqlTable("publishing_runs", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId"),
  platform: varchar("platform", { length: 80 }).notNull(),
  status: mysqlEnum("status", ["queued", "blocked", "private_uploaded", "public_uploaded", "failed", "skipped"]).default("queued").notNull(),
  visibility: mysqlEnum("visibility", ["private", "public"]).default("private").notNull(),
  decisionReason: text("decisionReason").notNull(),
  externalVideoId: varchar("externalVideoId", { length: 160 }),
  externalUrl: varchar("externalUrl", { length: 1500 }),
  initiatedBy: mysqlEnum("initiatedBy", ["user", "system", "scheduled_job"]).default("system").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** A saved upload brief is review-only metadata; it never performs an upload or changes a publishing run. */
export const uploadMetadataDrafts = mysqlTable("upload_metadata_drafts", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  projectId: int("projectId").notNull(),
  assetId: int("assetId").notNull(),
  platform: mysqlEnum("platform", ["youtube"]).default("youtube").notNull(),
  visibility: mysqlEnum("visibility", ["private"]).default("private").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  tagsJson: text("tagsJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("upload_metadata_drafts_owner_project_asset_idx").on(table.ownerId, table.projectId, table.assetId)]);

/** Delivery history for private operational notifications such as Telegram status updates. */
export const notificationEvents = mysqlTable("notification_events", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  publishingRunId: int("publishingRunId"),
  channel: mysqlEnum("channel", ["telegram"]).default("telegram").notNull(),
  eventType: varchar("eventType", { length: 120 }).notNull(),
  deliveryStatus: mysqlEnum("deliveryStatus", ["pending", "sent", "failed"]).default("pending").notNull(),
  detail: text("detail").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Durable state for the low-frequency EU.org delegation monitor. */
export const domainMonitors = mysqlTable("domain_monitors", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull().unique(),
  domain: varchar("domain", { length: 253 }).notNull(),
  status: mysqlEnum("status", ["pending", "delegated"]).default("pending").notNull(),
  lastNotifiedStatus: mysqlEnum("lastNotifiedStatus", ["pending", "delegated"]),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastCheckedAt: timestamp("lastCheckedAt"),
  lastDetail: text("lastDetail"),
  lastNotificationAt: timestamp("lastNotificationAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [index("domain_monitors_task_uid_idx").on(table.scheduleCronTaskUid)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
