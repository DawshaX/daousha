import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  analyticsSnapshots,
  assistantActionPlans,
  assistantActionSteps,
  assistantAttachments,
  assistantAuditEvents,
  assistantKnowledgeItems,
  assistantMemories,
  assistantMessages,
  assistantSessions,
  channelConnections,
  connectionHealthMonitors,
  contentAssets,
  contentPlaybookSteps,
  contentPlaybooks,
  contentSources,
  developmentProposals,
  domainMonitors,
  InsertUser,
  notificationEvents,
  projectAssets,
  playbookRuns,
  publishingPolicies,
  publishingRuns,
  publishingSchedules,
  sourceHealthMonitors,
  systemChangeLog,
  telegramOwnerBindings,
  telegramWebhookUpdates,
  uploadMetadataDrafts,
  users,
  videoProjects,
  workflowTasks,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { isOwnedLinkedVideo } from "./projectAssetGuard";
import { describeTwoFormatPackage } from "../shared/projectPackage";
import { filterOperationalProjectVideoAssets, isOperationalProject } from "./packageOperationalGuard";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

function databaseUnavailable() {
  throw new Error("قاعدة البيانات غير متاحة حاليًا. أعد المحاولة بعد اكتمال التهيئة.");
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId, lastSignedIn: user.lastSignedIn ?? new Date() };
  const updateSet: Record<string, unknown> = { lastSignedIn: values.lastSignedIn };
  for (const field of ["name", "email", "loginMethod"] as const) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = values[field];
    }
  }
  values.role = user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user");
  updateSet.role = values.role;
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  return (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];
}

export async function listProjects(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(videoProjects).where(eq(videoProjects.ownerId, ownerId)).orderBy(desc(videoProjects.updatedAt));
}

export async function listOperationalProjects(ownerId: number) {
  return (await listProjects(ownerId)).filter(isOperationalProject);
}

export async function createProject(input: typeof videoProjects.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(videoProjects).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(videoProjects).where(eq(videoProjects.id, id)).limit(1))[0];
}

export async function createTwoFormatProjectPackage(input: { ownerId: number; title: string; brief?: string; targetLanguage: "ar" | "en" | "both" }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const plan = describeTwoFormatPackage(input);
  return db!.transaction(async tx => {
    const parentResult = await tx.insert(videoProjects).values({ ownerId: input.ownerId, title: plan.parent.title, brief: plan.parent.brief, targetLanguage: plan.parent.targetLanguage, contentFormat: "short", projectKind: plan.parent.projectKind, orientation: plan.parent.orientation });
    const parentId = Number(parentResult[0].insertId);
    const variants = [];
    for (const variant of plan.variants) {
      const result = await tx.insert(videoProjects).values({ ownerId: input.ownerId, title: variant.title, brief: input.brief, targetLanguage: variant.targetLanguage, contentFormat: variant.contentFormat, projectKind: variant.projectKind, orientation: variant.orientation, parentProjectId: parentId });
      const id = Number(result[0].insertId);
      variants.push((await tx.select().from(videoProjects).where(eq(videoProjects.id, id)).limit(1))[0]);
    }
    const parent = (await tx.select().from(videoProjects).where(eq(videoProjects.id, parentId)).limit(1))[0];
    return { parent, variants };
  });
}

export async function getOwnedProject(ownerId: number, projectId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(videoProjects).where(and(eq(videoProjects.id, projectId), eq(videoProjects.ownerId, ownerId))).limit(1))[0];
}

export async function acknowledgeProjectPreview(ownerId: number, projectId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(videoProjects).set({ previewAcknowledgedAt: new Date(), previewAcknowledgedBy: ownerId }).where(and(eq(videoProjects.id, projectId), eq(videoProjects.ownerId, ownerId)));
  return getOwnedProject(ownerId, projectId);
}

export async function saveProjectScripts(ownerId: number, projectId: number, scripts: { arabicScript: string; englishScript: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(videoProjects).set({ status: "script", scriptArabic: scripts.arabicScript, scriptEnglish: scripts.englishScript }).where(and(eq(videoProjects.id, projectId), eq(videoProjects.ownerId, ownerId)));
  return getOwnedProject(ownerId, projectId);
}

export async function listAssets(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(contentAssets).where(eq(contentAssets.ownerId, ownerId)).orderBy(desc(contentAssets.updatedAt));
}

export async function createAsset(input: typeof contentAssets.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(contentAssets).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(contentAssets).where(eq(contentAssets.id, id)).limit(1))[0];
}

export async function reviewAsset(ownerId: number, assetId: number, review: { licenseStatus: "approved" | "held" | "rejected"; safetyStatus: "clear" | "review" | "blocked"; reviewNotes?: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(contentAssets).set(review).where(and(eq(contentAssets.id, assetId), eq(contentAssets.ownerId, ownerId)));
  return (await db!.select().from(contentAssets).where(and(eq(contentAssets.id, assetId), eq(contentAssets.ownerId, ownerId))).limit(1))[0];
}

export async function listSources(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(contentSources).where(eq(contentSources.ownerId, ownerId)).orderBy(desc(contentSources.updatedAt));
}

export async function createSource(input: typeof contentSources.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(contentSources).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(contentSources).where(eq(contentSources.id, id)).limit(1))[0];
}

export async function reviewSource(ownerId: number, sourceId: number, trustStatus: "approved" | "held" | "rejected") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(contentSources).set({ trustStatus }).where(and(eq(contentSources.id, sourceId), eq(contentSources.ownerId, ownerId)));
  return (await db!.select().from(contentSources).where(and(eq(contentSources.id, sourceId), eq(contentSources.ownerId, ownerId))).limit(1))[0];
}

export async function updateProjectStatus(ownerId: number, projectId: number, status: "idea" | "research" | "script" | "production" | "review" | "approved" | "blocked") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const values = status === "approved" ? { status, humanApprovedAt: new Date() } : { status };
  await db!.update(videoProjects).set(values).where(and(eq(videoProjects.id, projectId), eq(videoProjects.ownerId, ownerId)));
  return (await db!.select().from(videoProjects).where(and(eq(videoProjects.id, projectId), eq(videoProjects.ownerId, ownerId))).limit(1))[0];
}

export async function listProposals(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(developmentProposals).where(eq(developmentProposals.ownerId, ownerId)).orderBy(desc(developmentProposals.updatedAt));
}

export async function createProposal(input: typeof developmentProposals.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(developmentProposals).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(developmentProposals).where(eq(developmentProposals.id, id)).limit(1))[0];
}

export async function listSchedules(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(publishingSchedules).where(eq(publishingSchedules.ownerId, ownerId)).orderBy(desc(publishingSchedules.updatedAt));
}

export async function createSchedule(input: typeof publishingSchedules.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(publishingSchedules).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(publishingSchedules).where(eq(publishingSchedules.id, id)).limit(1))[0];
}

export async function getOwnedSchedule(ownerId: number, scheduleId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(publishingSchedules).where(and(eq(publishingSchedules.id, scheduleId), eq(publishingSchedules.ownerId, ownerId))).limit(1))[0];
}

export async function getScheduleByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(publishingSchedules).where(eq(publishingSchedules.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function activateSchedule(ownerId: number, scheduleId: number, taskUid: string, nextRunAt?: string | null) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(publishingSchedules).set({ status: "active", scheduleCronTaskUid: taskUid, nextRunAt: nextRunAt ? new Date(nextRunAt) : null }).where(and(eq(publishingSchedules.id, scheduleId), eq(publishingSchedules.ownerId, ownerId)));
  return getOwnedSchedule(ownerId, scheduleId);
}

export async function setScheduleStatus(ownerId: number, scheduleId: number, status: "paused" | "active" | "failed" | "needs_approval", nextRunAt?: string | null) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(publishingSchedules).set({ status, nextRunAt: nextRunAt ? new Date(nextRunAt) : null }).where(and(eq(publishingSchedules.id, scheduleId), eq(publishingSchedules.ownerId, ownerId)));
  return getOwnedSchedule(ownerId, scheduleId);
}

export async function markScheduleExecuted(ownerId: number, scheduleId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(publishingSchedules).set({ lastRunAt: new Date() }).where(and(eq(publishingSchedules.id, scheduleId), eq(publishingSchedules.ownerId, ownerId)));
  return getOwnedSchedule(ownerId, scheduleId);
}

export async function listChangeLog(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(systemChangeLog).where(eq(systemChangeLog.ownerId, ownerId)).orderBy(desc(systemChangeLog.createdAt));
}

export async function createChangeLogEntry(input: typeof systemChangeLog.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(systemChangeLog).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(systemChangeLog).where(eq(systemChangeLog.id, id)).limit(1))[0];
}

export async function recordAnalyticsSnapshot(input: typeof analyticsSnapshots.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(analyticsSnapshots).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.id, id)).limit(1))[0];
}

export async function listChannelConnections(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(channelConnections).where(eq(channelConnections.ownerId, ownerId)).orderBy(desc(channelConnections.updatedAt));
}

export async function getChannelConnection(ownerId: number, platform: typeof channelConnections.$inferSelect.platform) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(channelConnections).where(and(eq(channelConnections.ownerId, ownerId), eq(channelConnections.platform, platform))).limit(1))[0];
}

export async function upsertChannelConnection(input: typeof channelConnections.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.insert(channelConnections).values(input).onDuplicateKeyUpdate({
    set: {
      label: input.label,
      externalAccountRef: input.externalAccountRef,
      status: input.status,
      scopeSummary: input.scopeSummary,
      credentialCiphertext: input.credentialCiphertext,
      credentialExpiresAt: input.credentialExpiresAt,
      lastVerifiedAt: input.lastVerifiedAt,
      lastError: input.lastError,
    },
  });
  return (await db!.select().from(channelConnections).where(and(eq(channelConnections.ownerId, input.ownerId), eq(channelConnections.platform, input.platform))).limit(1))[0];
}

export async function getPublishingPolicy(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const existing = (await db!.select().from(publishingPolicies).where(eq(publishingPolicies.ownerId, ownerId)).limit(1))[0];
  if (existing) return existing;
  await db!.insert(publishingPolicies).values({ ownerId });
  return (await db!.select().from(publishingPolicies).where(eq(publishingPolicies.ownerId, ownerId)).limit(1))[0];
}

export async function getContentMixStatus(ownerId: number) {
  const [policy, projects] = await Promise.all([getPublishingPolicy(ownerId), listOperationalProjects(ownerId)]);
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);
  const publishedToday = projects.filter(project => project.status === "published" && project.publishedAt && project.publishedAt >= startOfToday);
  const readyProjects = projects.filter(project => ["approved", "review"].includes(project.status));
  return {
    dailyShortTarget: policy.dailyShortTarget,
    dailyLongTarget: policy.dailyLongTarget,
    publishedShorts: publishedToday.filter(project => project.contentFormat === "short").length,
    publishedLongs: publishedToday.filter(project => project.contentFormat === "long").length,
    readyShorts: readyProjects.filter(project => project.contentFormat === "short").length,
    readyLongs: readyProjects.filter(project => project.contentFormat === "long").length,
  };
}

export async function updatePublishingPolicy(ownerId: number, patch: Partial<Omit<typeof publishingPolicies.$inferInsert, "id" | "ownerId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.insert(publishingPolicies).values({ ownerId, ...patch }).onDuplicateKeyUpdate({ set: patch });
  return getPublishingPolicy(ownerId);
}

export async function listPublishingRuns(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(publishingRuns).where(eq(publishingRuns.ownerId, ownerId)).orderBy(desc(publishingRuns.createdAt));
}

export async function createPublishingRun(input: typeof publishingRuns.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(publishingRuns).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(publishingRuns).where(eq(publishingRuns.id, id)).limit(1))[0];
}

export async function updatePublishingRun(ownerId: number, runId: number, patch: Partial<Omit<typeof publishingRuns.$inferInsert, "id" | "ownerId" | "createdAt">>) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(publishingRuns).set(patch).where(and(eq(publishingRuns.id, runId), eq(publishingRuns.ownerId, ownerId)));
  return (await db!.select().from(publishingRuns).where(and(eq(publishingRuns.id, runId), eq(publishingRuns.ownerId, ownerId))).limit(1))[0];
}

export async function getUploadMetadataDraft(ownerId: number, projectId: number, assetId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(uploadMetadataDrafts).where(and(
    eq(uploadMetadataDrafts.ownerId, ownerId),
    eq(uploadMetadataDrafts.projectId, projectId),
    eq(uploadMetadataDrafts.assetId, assetId),
  )).limit(1))[0];
}

export async function upsertPrivateUploadMetadataDraft(input: {
  ownerId: number;
  projectId: number;
  assetId: number;
  title: string;
  description: string;
  tags: string[];
}) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const values = {
    ownerId: input.ownerId,
    projectId: input.projectId,
    assetId: input.assetId,
    platform: "youtube" as const,
    visibility: "private" as const,
    title: input.title,
    description: input.description,
    tagsJson: JSON.stringify(input.tags),
  };
  await db!.insert(uploadMetadataDrafts).values(values).onDuplicateKeyUpdate({ set: {
    title: values.title,
    description: values.description,
    tagsJson: values.tagsJson,
  } });
  return getUploadMetadataDraft(input.ownerId, input.projectId, input.assetId);
}

export async function getOwnedAsset(ownerId: number, assetId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(contentAssets).where(and(eq(contentAssets.id, assetId), eq(contentAssets.ownerId, ownerId))).limit(1))[0];
}

export async function linkOwnedAssetToProject(ownerId: number, projectId: number, assetId: number, clipRole: "primary" | "broll" | "audio" | "reference" = "primary") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const [project, asset] = await Promise.all([getOwnedProject(ownerId, projectId), getOwnedAsset(ownerId, assetId)]);
  if (!project || !asset || !isOperationalProject(project)) return undefined;
  const existing = (await db!.select().from(projectAssets).where(and(eq(projectAssets.projectId, projectId), eq(projectAssets.assetId, assetId))).limit(1))[0];
  if (existing) return existing;
  const result = await db!.insert(projectAssets).values({ projectId, assetId, clipRole });
  const id = Number(result[0].insertId);
  return (await db!.select().from(projectAssets).where(eq(projectAssets.id, id)).limit(1))[0];
}

export async function getOwnedProjectVideoAsset(ownerId: number, projectId: number, assetId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const [project, asset, link] = await Promise.all([
    getOwnedProject(ownerId, projectId),
    getOwnedAsset(ownerId, assetId),
    db!.select().from(projectAssets).where(and(eq(projectAssets.projectId, projectId), eq(projectAssets.assetId, assetId))).limit(1),
  ]);
  if (!project || !asset || !isOperationalProject(project) || !isOwnedLinkedVideo({ projectId, assetId, assetKind: asset.assetKind, link: link[0] })) return undefined;
  return { project, asset, link: link[0] };
}

export async function listOwnedProjectVideoAssets(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const links = await db!.select().from(projectAssets);
  const [projects, assets] = await Promise.all([listProjects(ownerId), listAssets(ownerId)]);
  const projectMap = new Map(projects.map(project => [project.id, project]));
  const assetMap = new Map(assets.filter(asset => asset.assetKind === "video").map(asset => [asset.id, asset]));
  return filterOperationalProjectVideoAssets(links.flatMap(link => {
    const project = projectMap.get(link.projectId);
    const asset = assetMap.get(link.assetId);
    return project && asset ? [{ project, asset, link }] : [];
  }));
}

export async function markPolicyPublished(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(publishingPolicies).set({ lastPublishedAt: new Date() }).where(eq(publishingPolicies.ownerId, ownerId));
  return getPublishingPolicy(ownerId);
}

export async function markProjectPublished(ownerId: number, projectId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(videoProjects).set({ status: "published", publishedAt: new Date() }).where(and(eq(videoProjects.ownerId, ownerId), eq(videoProjects.id, projectId)));
  return getOwnedProject(ownerId, projectId);
}

export async function listNotificationEvents(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(notificationEvents).where(eq(notificationEvents.ownerId, ownerId)).orderBy(desc(notificationEvents.createdAt));
}

export async function recordNotificationEvent(input: typeof notificationEvents.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(notificationEvents).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(notificationEvents).where(eq(notificationEvents.id, id)).limit(1))[0];
}

export async function getDomainMonitor(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(domainMonitors).where(eq(domainMonitors.ownerId, ownerId)).limit(1))[0];
}

export async function getDomainMonitorByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(domainMonitors).where(eq(domainMonitors.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function upsertDomainMonitor(input: { ownerId: number; domain: string; scheduleCronTaskUid: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.insert(domainMonitors).values(input).onDuplicateKeyUpdate({ set: { domain: input.domain, scheduleCronTaskUid: input.scheduleCronTaskUid } });
  return getDomainMonitor(input.ownerId);
}

export async function updateDomainMonitorCheck(id: number, input: { status: "pending" | "delegated"; detail: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(domainMonitors).set({ status: input.status, lastDetail: input.detail, lastCheckedAt: new Date() }).where(eq(domainMonitors.id, id));
  return (await db!.select().from(domainMonitors).where(eq(domainMonitors.id, id)).limit(1))[0];
}

export async function markDomainMonitorNotified(id: number, status: "pending" | "delegated") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(domainMonitors).set({ lastNotifiedStatus: status, lastNotificationAt: new Date() }).where(eq(domainMonitors.id, id));
}

export async function getSourceHealthMonitor(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(sourceHealthMonitors).where(eq(sourceHealthMonitors.ownerId, ownerId)).limit(1))[0] ?? null;
}

export async function getSourceHealthMonitorByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(sourceHealthMonitors).where(eq(sourceHealthMonitors.scheduleCronTaskUid, taskUid)).limit(1))[0] ?? null;
}

export async function upsertSourceHealthMonitor(input: { ownerId: number; scheduleCronTaskUid: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const existing = await getSourceHealthMonitor(input.ownerId);
  if (existing) {
    await db!.update(sourceHealthMonitors).set({ scheduleCronTaskUid: input.scheduleCronTaskUid }).where(eq(sourceHealthMonitors.id, existing.id));
    return getSourceHealthMonitor(input.ownerId);
  }
  const result = await db!.insert(sourceHealthMonitors).values(input);
  return (await db!.select().from(sourceHealthMonitors).where(eq(sourceHealthMonitors.id, Number(result[0].insertId))).limit(1))[0] ?? null;
}

export async function updateSourceHealthMonitorCheck(id: number, input: { status: "healthy" | "degraded"; summary: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(sourceHealthMonitors).set({ status: input.status, lastSummary: input.summary.slice(0, 4_000), lastCheckedAt: new Date() }).where(eq(sourceHealthMonitors.id, id));
  return (await db!.select().from(sourceHealthMonitors).where(eq(sourceHealthMonitors.id, id)).limit(1))[0] ?? null;
}

export async function markSourceHealthMonitorNotified(id: number, status: "healthy" | "degraded") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(sourceHealthMonitors).set({ lastNotifiedStatus: status }).where(eq(sourceHealthMonitors.id, id));
}

export async function getConnectionHealthMonitor(ownerId: number, platform: "youtube" | "facebook" | "instagram" | "tiktok") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(connectionHealthMonitors).where(and(eq(connectionHealthMonitors.ownerId, ownerId), eq(connectionHealthMonitors.platform, platform))).limit(1))[0];
}

export async function getConnectionHealthMonitorByTaskUid(taskUid: string) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(connectionHealthMonitors).where(eq(connectionHealthMonitors.scheduleCronTaskUid, taskUid)).limit(1))[0];
}

export async function upsertConnectionHealthMonitor(input: { ownerId: number; platform: "youtube" | "facebook" | "instagram" | "tiktok"; scheduleCronTaskUid: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.insert(connectionHealthMonitors).values(input).onDuplicateKeyUpdate({ set: { scheduleCronTaskUid: input.scheduleCronTaskUid } });
  return getConnectionHealthMonitor(input.ownerId, input.platform);
}

export async function updateConnectionHealthMonitorCheck(id: number, input: { status: "healthy" | "degraded" | "disconnected"; detail: string }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(connectionHealthMonitors).set({ status: input.status, lastDetail: input.detail, lastCheckedAt: new Date() }).where(eq(connectionHealthMonitors.id, id));
  return (await db!.select().from(connectionHealthMonitors).where(eq(connectionHealthMonitors.id, id)).limit(1))[0];
}

export async function markConnectionHealthMonitorNotified(id: number, status: "healthy" | "degraded" | "disconnected") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(connectionHealthMonitors).set({ lastNotifiedStatus: status, lastNotificationAt: new Date() }).where(eq(connectionHealthMonitors.id, id));
}

export async function createAssistantSession(input: { ownerId: number; title: string; origin?: "web" | "telegram" }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(assistantSessions).values({ ownerId: input.ownerId, title: input.title, origin: input.origin ?? "web" });
  const id = Number(result[0].insertId);
  return (await db!.select().from(assistantSessions).where(and(eq(assistantSessions.id, id), eq(assistantSessions.ownerId, input.ownerId))).limit(1))[0];
}

export async function listAssistantSessions(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(assistantSessions).where(eq(assistantSessions.ownerId, ownerId)).orderBy(desc(assistantSessions.updatedAt));
}

export async function getOwnedAssistantSession(ownerId: number, sessionId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(assistantSessions).where(and(eq(assistantSessions.id, sessionId), eq(assistantSessions.ownerId, ownerId))).limit(1))[0];
}

export async function archiveAssistantSession(ownerId: number, sessionId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(assistantSessions).set({ status: "archived" }).where(and(eq(assistantSessions.id, sessionId), eq(assistantSessions.ownerId, ownerId)));
  return getOwnedAssistantSession(ownerId, sessionId);
}

export async function listAssistantMessages(ownerId: number, sessionId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(assistantMessages).where(and(eq(assistantMessages.ownerId, ownerId), eq(assistantMessages.sessionId, sessionId))).orderBy(assistantMessages.createdAt);
}

export async function createAssistantMessage(input: {
  ownerId: number;
  sessionId: number;
  role: "user" | "assistant" | "system";
  content: string;
  displayKind?: "message" | "plan" | "tool_result" | "notice";
}) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(assistantMessages).values({ ...input, displayKind: input.displayKind ?? "message" });
  const id = Number(result[0].insertId);
  await db!.update(assistantSessions).set({ lastMessageAt: new Date() }).where(and(eq(assistantSessions.id, input.sessionId), eq(assistantSessions.ownerId, input.ownerId)));
  return (await db!.select().from(assistantMessages).where(eq(assistantMessages.id, id)).limit(1))[0];
}

export async function createAssistantActionPlan(input: {
  ownerId: number;
  sessionId: number;
  summary: string;
  impact: "read" | "draft" | "guarded" | "high";
  requiresApproval: boolean;
  status?: "proposed" | "approved" | "executing" | "completed" | "blocked" | "failed";
}) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(assistantActionPlans).values({ ...input, status: input.status ?? "proposed" });
  const id = Number(result[0].insertId);
  return (await db!.select().from(assistantActionPlans).where(and(eq(assistantActionPlans.id, id), eq(assistantActionPlans.ownerId, input.ownerId))).limit(1))[0];
}

export async function getOwnedAssistantActionPlan(ownerId: number, planId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(assistantActionPlans).where(and(eq(assistantActionPlans.id, planId), eq(assistantActionPlans.ownerId, ownerId))).limit(1))[0];
}

export async function listAssistantActionPlans(ownerId: number, sessionId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(assistantActionPlans).where(and(eq(assistantActionPlans.ownerId, ownerId), eq(assistantActionPlans.sessionId, sessionId))).orderBy(desc(assistantActionPlans.createdAt));
}

export async function updateAssistantActionPlan(ownerId: number, planId: number, patch: { status: "proposed" | "approved" | "executing" | "completed" | "blocked" | "failed"; approvedAt?: Date | null }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(assistantActionPlans).set(patch).where(and(eq(assistantActionPlans.id, planId), eq(assistantActionPlans.ownerId, ownerId)));
  return getOwnedAssistantActionPlan(ownerId, planId);
}

export async function listAssistantActionSteps(ownerId: number, planId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(assistantActionSteps).where(and(eq(assistantActionSteps.ownerId, ownerId), eq(assistantActionSteps.planId, planId))).orderBy(assistantActionSteps.stepOrder);
}

export async function createAssistantActionStep(input: {
  ownerId: number;
  planId: number;
  stepOrder: number;
  title: string;
  toolName: string;
  inputSummary?: string;
  status?: "pending" | "running" | "completed" | "blocked" | "failed" | "skipped";
}) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(assistantActionSteps).values({ ...input, status: input.status ?? "pending" });
  const id = Number(result[0].insertId);
  return (await db!.select().from(assistantActionSteps).where(eq(assistantActionSteps.id, id)).limit(1))[0];
}

export async function updateAssistantActionStep(ownerId: number, stepId: number, patch: { status: "pending" | "running" | "completed" | "blocked" | "failed" | "skipped"; resultSummary?: string | null }) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(assistantActionSteps).set(patch).where(and(eq(assistantActionSteps.id, stepId), eq(assistantActionSteps.ownerId, ownerId)));
  return (await db!.select().from(assistantActionSteps).where(and(eq(assistantActionSteps.id, stepId), eq(assistantActionSteps.ownerId, ownerId))).limit(1))[0];
}

export async function createAssistantAuditEvent(input: {
  ownerId: number;
  sessionId?: number;
  planId?: number;
  stepId?: number;
  actor: "user" | "assistant" | "system";
  action: string;
  target?: string;
  decision: "allowed" | "approved" | "blocked" | "completed" | "failed";
  detail?: string;
}) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(assistantAuditEvents).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(assistantAuditEvents).where(eq(assistantAuditEvents.id, id)).limit(1))[0];
}

export async function listAssistantAuditEvents(ownerId: number, limit = 80) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(assistantAuditEvents).where(eq(assistantAuditEvents.ownerId, ownerId)).orderBy(desc(assistantAuditEvents.createdAt)).limit(limit);
}

export async function listAssistantMemories(ownerId: number) { const db = await getDb(); if (!db) databaseUnavailable(); return db!.select().from(assistantMemories).where(eq(assistantMemories.ownerId, ownerId)).orderBy(desc(assistantMemories.updatedAt)); }
export async function createAssistantMemory(input: { ownerId: number; kind: "preference" | "project" | "rule" | "decision"; title: string; content: string }) { const db = await getDb(); if (!db) databaseUnavailable(); const result = await db!.insert(assistantMemories).values(input); const id = Number(result[0].insertId); return (await db!.select().from(assistantMemories).where(eq(assistantMemories.id, id)).limit(1))[0]; }
export async function listContentPlaybooks(ownerId: number) { const db = await getDb(); if (!db) databaseUnavailable(); return db!.select().from(contentPlaybooks).where(eq(contentPlaybooks.ownerId, ownerId)).orderBy(desc(contentPlaybooks.updatedAt)); }
export async function listContentPlaybookSteps(playbookId: number) { const db = await getDb(); if (!db) databaseUnavailable(); return db!.select().from(contentPlaybookSteps).where(eq(contentPlaybookSteps.playbookId, playbookId)).orderBy(contentPlaybookSteps.stepOrder); }
export async function createContentPlaybook(input: { ownerId: number; title: string; description: string; impact: "read" | "draft" | "guarded" | "high"; steps: Array<{ title: string; toolName: string; inputTemplate?: string }> }) { const db = await getDb(); if (!db) databaseUnavailable(); return db!.transaction(async tx => { const result = await tx.insert(contentPlaybooks).values({ ownerId: input.ownerId, title: input.title, description: input.description, impact: input.impact }); const id = Number(result[0].insertId); if (input.steps.length) await tx.insert(contentPlaybookSteps).values(input.steps.map((step, index) => ({ playbookId: id, stepOrder: index + 1, ...step }))); return (await tx.select().from(contentPlaybooks).where(eq(contentPlaybooks.id, id)).limit(1))[0]; }); }
export async function createPlaybookRun(input: { ownerId: number; playbookId: number; sessionId?: number; status: "queued" | "running" | "completed" | "blocked" | "failed"; resultSummary?: string }) { const db = await getDb(); if (!db) databaseUnavailable(); const result = await db!.insert(playbookRuns).values({ ...input, completedAt: ["completed", "blocked", "failed"].includes(input.status) ? new Date() : null }); const id = Number(result[0].insertId); return (await db!.select().from(playbookRuns).where(eq(playbookRuns.id, id)).limit(1))[0]; }
export async function updatePlaybookRun(ownerId: number, runId: number, input: { status: "queued" | "running" | "completed" | "blocked" | "failed"; resultSummary?: string }) { const db = await getDb(); if (!db) databaseUnavailable(); await db!.update(playbookRuns).set({ ...input, completedAt: ["completed", "blocked", "failed"].includes(input.status) ? new Date() : null }).where(and(eq(playbookRuns.id, runId), eq(playbookRuns.ownerId, ownerId))); return (await db!.select().from(playbookRuns).where(and(eq(playbookRuns.id, runId), eq(playbookRuns.ownerId, ownerId))).limit(1))[0] ?? null; }
export async function listPlaybookRuns(ownerId: number, limit = 30) { const db = await getDb(); if (!db) databaseUnavailable(); return db!.select().from(playbookRuns).where(eq(playbookRuns.ownerId, ownerId)).orderBy(desc(playbookRuns.createdAt)).limit(limit); }
export async function recordTelegramWebhookUpdate(input: { updateId: number; ownerId: number; chatId: string }) { const db = await getDb(); if (!db) databaseUnavailable(); try { const result = await db!.insert(telegramWebhookUpdates).values(input); const id = Number(result[0].insertId); return { created: true, row: (await db!.select().from(telegramWebhookUpdates).where(eq(telegramWebhookUpdates.id, id)).limit(1))[0] }; } catch { return { created: false, row: (await db!.select().from(telegramWebhookUpdates).where(eq(telegramWebhookUpdates.updateId, input.updateId)).limit(1))[0] }; } }
export async function updateTelegramWebhookUpdate(updateId: number, status: "completed" | "ignored" | "failed", detail: string) { const db = await getDb(); if (!db) databaseUnavailable(); await db!.update(telegramWebhookUpdates).set({ status, detail }).where(eq(telegramWebhookUpdates.updateId, updateId)); }
export async function upsertTelegramOwnerPairing(ownerId: number, pairingCodeHash: string, expiresAt: Date) { const db = await getDb(); if (!db) databaseUnavailable(); const existing = await db!.select().from(telegramOwnerBindings).where(eq(telegramOwnerBindings.ownerId, ownerId)).limit(1); if (existing[0]) { await db!.update(telegramOwnerBindings).set({ chatId: null, pairingCodeHash, status: "pending", expiresAt, pairedAt: null }).where(eq(telegramOwnerBindings.ownerId, ownerId)); return (await db!.select().from(telegramOwnerBindings).where(eq(telegramOwnerBindings.ownerId, ownerId)).limit(1))[0]; } const result = await db!.insert(telegramOwnerBindings).values({ ownerId, pairingCodeHash, status: "pending", expiresAt }); return (await db!.select().from(telegramOwnerBindings).where(eq(telegramOwnerBindings.id, Number(result[0].insertId))).limit(1))[0]; }
export async function pairTelegramOwnerByCode(pairingCodeHash: string, chatId: string) { const db = await getDb(); if (!db) databaseUnavailable(); const now = new Date(); const candidate = await db!.select().from(telegramOwnerBindings).where(and(eq(telegramOwnerBindings.pairingCodeHash, pairingCodeHash), eq(telegramOwnerBindings.status, "pending"))).limit(1); const binding = candidate[0]; if (!binding || !binding.expiresAt || binding.expiresAt <= now) return null; await db!.update(telegramOwnerBindings).set({ chatId, pairingCodeHash: null, status: "paired", expiresAt: null, pairedAt: now }).where(eq(telegramOwnerBindings.id, binding.id)); return (await db!.select().from(telegramOwnerBindings).where(eq(telegramOwnerBindings.id, binding.id)).limit(1))[0]; }
export async function getPairedTelegramOwnerByChatId(chatId: string) { const db = await getDb(); if (!db) databaseUnavailable(); return (await db!.select().from(telegramOwnerBindings).where(and(eq(telegramOwnerBindings.chatId, chatId), eq(telegramOwnerBindings.status, "paired"))).limit(1))[0] ?? null; }
export async function getTelegramOwnerBinding(ownerId: number) { const db = await getDb(); if (!db) databaseUnavailable(); return (await db!.select().from(telegramOwnerBindings).where(eq(telegramOwnerBindings.ownerId, ownerId)).limit(1))[0] ?? null; }
export async function createAssistantAttachment(input: { ownerId: number; sessionId: number; storageKey: string; url: string; filename: string; mimeType: string; sizeBytes: number }) { const db = await getDb(); if (!db) databaseUnavailable(); const result = await db!.insert(assistantAttachments).values(input); const id = Number(result[0].insertId); return (await db!.select().from(assistantAttachments).where(eq(assistantAttachments.id, id)).limit(1))[0]; }
export async function listAssistantAttachments(ownerId: number, sessionId: number) { const db = await getDb(); if (!db) databaseUnavailable(); return db!.select().from(assistantAttachments).where(and(eq(assistantAttachments.ownerId, ownerId), eq(assistantAttachments.sessionId, sessionId))).orderBy(desc(assistantAttachments.createdAt)); }
export async function createAssistantKnowledgeItem(input: { ownerId: number; category: "identity" | "rights" | "safety" | "workflow" | "distribution"; title: string; content: string; sourceUrl?: string }) { const db = await getDb(); if (!db) databaseUnavailable(); const result = await db!.insert(assistantKnowledgeItems).values(input); const id = Number(result[0].insertId); return (await db!.select().from(assistantKnowledgeItems).where(eq(assistantKnowledgeItems.id, id)).limit(1))[0]; }
export async function searchAssistantKnowledge(ownerId: number, query: string) { const db = await getDb(); if (!db) databaseUnavailable(); const needle = `%${query.trim().slice(0, 120)}%`; return db!.select().from(assistantKnowledgeItems).where(and(eq(assistantKnowledgeItems.ownerId, ownerId), eq(assistantKnowledgeItems.status, "active"), or(like(assistantKnowledgeItems.title, needle), like(assistantKnowledgeItems.content, needle)))).orderBy(desc(assistantKnowledgeItems.updatedAt)).limit(20); }

export async function getDashboardData(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const [projects, assets, tasks, snapshots, proposals, schedules, changeLog, connections, policy, runs] = await Promise.all([
    db!.select().from(videoProjects).where(eq(videoProjects.ownerId, ownerId)),
    db!.select().from(contentAssets).where(eq(contentAssets.ownerId, ownerId)),
    db!.select().from(workflowTasks).where(eq(workflowTasks.ownerId, ownerId)),
    db!.select().from(analyticsSnapshots).where(eq(analyticsSnapshots.ownerId, ownerId)),
    db!.select().from(developmentProposals).where(eq(developmentProposals.ownerId, ownerId)),
    db!.select().from(publishingSchedules).where(eq(publishingSchedules.ownerId, ownerId)),
    db!.select().from(systemChangeLog).where(eq(systemChangeLog.ownerId, ownerId)),
    db!.select().from(channelConnections).where(eq(channelConnections.ownerId, ownerId)),
    getPublishingPolicy(ownerId),
    db!.select().from(publishingRuns).where(eq(publishingRuns.ownerId, ownerId)).orderBy(desc(publishingRuns.createdAt)),
  ]);
  return {
    projects,
    assets,
    tasks,
    snapshots,
    proposals,
    schedules,
    changeLog,
    connections,
    policy,
    runs,
    stats: {
      activeProjects: projects.filter(project => !["published", "blocked"].includes(project.status)).length,
      reviewProjects: projects.filter(project => project.status === "review").length,
      scheduledProjects: projects.filter(project => project.status === "scheduled").length,
      approvedAssets: assets.filter(asset => asset.licenseStatus === "approved" && asset.safetyStatus === "clear").length,
      openProposals: proposals.filter(proposal => proposal.state === "proposed").length,
      activeSchedules: schedules.filter(schedule => schedule.status === "active").length,
      totalViews: snapshots.reduce((sum, snapshot) => sum + snapshot.views, 0),
    },
  };
}
