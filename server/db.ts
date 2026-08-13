import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  analyticsSnapshots,
  channelConnections,
  contentAssets,
  contentSources,
  developmentProposals,
  InsertUser,
  notificationEvents,
  projectAssets,
  publishingPolicies,
  publishingRuns,
  publishingSchedules,
  systemChangeLog,
  users,
  videoProjects,
  workflowTasks,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { isOwnedLinkedVideo } from "./projectAssetGuard";

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

export async function listProjects(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return db!.select().from(videoProjects).where(eq(videoProjects.ownerId, ownerId)).orderBy(desc(videoProjects.updatedAt));
}

export async function createProject(input: typeof videoProjects.$inferInsert) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const result = await db!.insert(videoProjects).values(input);
  const id = Number(result[0].insertId);
  return (await db!.select().from(videoProjects).where(eq(videoProjects.id, id)).limit(1))[0];
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

export async function reviewAsset(ownerId: number, assetId: number, review: { licenseStatus: "approved" | "held" | "rejected"; safetyStatus: "clear" | "review" | "blocked" }) {
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
  const current = await db!.select().from(publishingPolicies).where(eq(publishingPolicies.ownerId, ownerId)).limit(1);
  if (current[0]) return current[0];
  await db!.insert(publishingPolicies).values({ ownerId });
  return (await db!.select().from(publishingPolicies).where(eq(publishingPolicies.ownerId, ownerId)).limit(1))[0];
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

export async function getOwnedAsset(ownerId: number, assetId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  return (await db!.select().from(contentAssets).where(and(eq(contentAssets.id, assetId), eq(contentAssets.ownerId, ownerId))).limit(1))[0];
}

export async function linkOwnedAssetToProject(ownerId: number, projectId: number, assetId: number, clipRole: "primary" | "broll" | "audio" | "reference" = "primary") {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const [project, asset] = await Promise.all([getOwnedProject(ownerId, projectId), getOwnedAsset(ownerId, assetId)]);
  if (!project || !asset) return undefined;
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
  if (!project || !asset || !isOwnedLinkedVideo({ projectId, assetId, assetKind: asset.assetKind, link: link[0] })) return undefined;
  return { project, asset, link: link[0] };
}

export async function listOwnedProjectVideoAssets(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  const links = await db!.select().from(projectAssets);
  const [projects, assets] = await Promise.all([listProjects(ownerId), listAssets(ownerId)]);
  const projectMap = new Map(projects.map(project => [project.id, project]));
  const assetMap = new Map(assets.filter(asset => asset.assetKind === "video").map(asset => [asset.id, asset]));
  return links.flatMap(link => {
    const project = projectMap.get(link.projectId);
    const asset = assetMap.get(link.assetId);
    return project && asset ? [{ project, asset, link }] : [];
  });
}

export async function markPolicyPublished(ownerId: number) {
  const db = await getDb();
  if (!db) databaseUnavailable();
  await db!.update(publishingPolicies).set({ lastPublishedAt: new Date() }).where(eq(publishingPolicies.ownerId, ownerId));
  return getPublishingPolicy(ownerId);
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
