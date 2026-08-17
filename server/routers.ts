import { z } from "zod";
import { platformReferences } from "../shared/daousha";
import * as db from "./db";
import { configureTelegramCommandWebhook } from "./telegram";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { generateOriginalScript } from "./contentBrain";
import { TRPCError } from "@trpc/server";
import { generateImage, listImageModels } from "./_core/imageGeneration";
import { discoverLatestTelegramChatId, sendTelegramOperationalNotification, telegramIsConfigured } from "./telegram";
import { evaluatePublishGuard } from "./publishingGuards";
import { resolveDistributionReadiness } from "./publishingDestinations";
import { uploadVettedVideoToYouTube } from "./youtubePublisher";
import { uploadVettedVideoToFacebookPage } from "./facebookPublisher";
import { createHeartbeatJob, updateHeartbeatJob } from "./_core/heartbeat";
import { FACEBOOK_OAUTH_DOMAINS, facebookOAuthDomainIsReady, getFacebookRedirectUri } from "./facebookOAuth";
import { getTikTokRedirectUri, getTikTokSandboxAccessToken } from "./tiktokOAuth";
import { uploadTikTokSandboxDraft } from "./tiktokSandboxPublisher";
import { hasApprovedSafeVideo, isAllowedWorkflowTransition, type WorkflowStatus } from "./workflowGuards";
import { assessAssetIntake } from "./rightsSafetyGate";
import { fetchGoogleTrendSignals } from "./trendRadar";
import { notifyOwnerOperationalEvent } from "./operationalNotifications";
import { executeYouTubeHealthMonitor } from "./youtubeHealthMonitoring";
import { executeInstagramHealthMonitor } from "./instagramHealthMonitoring";
import { derivePerformanceImprovementSuggestion } from "../shared/performanceImprovement";
import { performanceExperimentAdvice, summarizePerformance } from "../shared/performanceSummary";
import { describeUploadFailure } from "./uploadFailureDetail";
import { createNOVASession, getNOVAWorkspace, runNOVATurn } from "./novaAssistant";
import { safeNOVAAttachmentFilename, validateNOVAAttachment } from "./assistantAttachmentGuards";
import { createHash, randomBytes } from "node:crypto";

const url = z.string().url().max(1500);
const projectStatus = z.enum(["idea", "research", "script", "production", "review", "approved", "scheduled", "published", "blocked"]);

function readSessionToken(cookieHeader?: string) {
  const item = cookieHeader?.split(";").map(value => value.trim()).find(value => value.startsWith(`${COOKIE_NAME}=`));
  return item ? decodeURIComponent(item.slice(COOKIE_NAME.length + 1)) : "";
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  nova: router({
    createTelegramPairing: protectedProcedure.mutation(async ({ ctx }) => { const code = randomBytes(12).toString("base64url"); const expiresAt = new Date(Date.now() + 10 * 60 * 1000); await db.upsertTelegramOwnerPairing(ctx.user.id, createHash("sha256").update(code).digest("hex"), expiresAt); await db.createAssistantAuditEvent({ ownerId: ctx.user.id, actor: "user", action: "telegram_pairing_created", decision: "completed", detail: "أُنشئ رمز اقتران Telegram صالح لعشر دقائق." }); return { command: `/start ${code}`, expiresAt }; }),
    telegramPairingStatus: protectedProcedure.query(({ ctx }) => db.getTelegramOwnerBinding(ctx.user.id)),
    attachments: protectedProcedure.input(z.object({ sessionId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const session = await db.getOwnedAssistantSession(ctx.user.id, input.sessionId); if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return db.listAssistantAttachments(ctx.user.id, input.sessionId);
    }),
    uploadAttachment: protectedProcedure.input(z.object({ sessionId: z.number().int().positive(), filename: z.string().trim().min(1).max(120), mimeType: z.string().trim().max(120), base64: z.string().min(4).max(5_600_000) })).mutation(async ({ ctx, input }) => {
      const session = await db.getOwnedAssistantSession(ctx.user.id, input.sessionId); if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      const bytes = validateNOVAAttachment(input.mimeType, input.base64);
      const safeName = safeNOVAAttachmentFilename(input.filename); const stored = await storagePut(`assistant/${ctx.user.id}/${input.sessionId}/${safeName}`, bytes, input.mimeType);
      const attachment = await db.createAssistantAttachment({ ownerId: ctx.user.id, sessionId: input.sessionId, storageKey: stored.key, url: stored.url, filename: input.filename, mimeType: input.mimeType, sizeBytes: bytes.length });
      await db.createAssistantAuditEvent({ ownerId: ctx.user.id, sessionId: input.sessionId, actor: "user", action: "attachment_uploaded", target: input.filename, decision: "completed", detail: "رُفع مرفق إلى تخزين الجلسة دون حفظ محتواه في قاعدة البيانات." }); return attachment;
    }),
    addKnowledge: protectedProcedure.input(z.object({ category: z.enum(["identity", "rights", "safety", "workflow", "distribution"]), title: z.string().trim().min(2).max(255), content: z.string().trim().min(5).max(12_000), sourceUrl: z.string().url().max(700).optional() })).mutation(async ({ ctx, input }) => {
      const item = await db.createAssistantKnowledgeItem({ ownerId: ctx.user.id, ...input }); await db.createAssistantAuditEvent({ ownerId: ctx.user.id, actor: "user", action: "knowledge_added", target: item.title, decision: "completed", detail: `أضيفت معرفة ضمن ${input.category}.` }); return item;
    }),
    searchKnowledge: protectedProcedure.input(z.object({ query: z.string().trim().min(1).max(120) })).query(({ ctx, input }) => db.searchAssistantKnowledge(ctx.user.id, input.query)),
    configureTelegramWebhook: protectedProcedure.input(z.object({ publicBaseUrl: z.string().url() })).mutation(async ({ ctx, input }) => {
      const result = await configureTelegramCommandWebhook(input.publicBaseUrl);
      await db.createAssistantAuditEvent({ ownerId: ctx.user.id, actor: "user", action: "telegram_webhook_configured", target: "telegram", decision: "completed", detail: "تم تفعيل Webhook أوامر Telegram للمالك." });
      return result;
    }),
    sessions: protectedProcedure.query(({ ctx }) => db.listAssistantSessions(ctx.user.id)),
    memories: protectedProcedure.query(({ ctx }) => db.listAssistantMemories(ctx.user.id)),
    addMemory: protectedProcedure
      .input(z.object({ kind: z.enum(["preference", "project", "rule", "decision"]), title: z.string().trim().min(2).max(255), content: z.string().trim().min(2).max(8_000) }))
      .mutation(({ ctx, input }) => db.createAssistantMemory({ ownerId: ctx.user.id, ...input })),
    playbooks: protectedProcedure.query(async ({ ctx }) => {
      const playbooks = await db.listContentPlaybooks(ctx.user.id);
      return Promise.all(playbooks.map(async playbook => ({ ...playbook, steps: await db.listContentPlaybookSteps(playbook.id) })));
    }),
    createPlaybook: protectedProcedure
      .input(z.object({ title: z.string().trim().min(3).max(255), description: z.string().trim().min(5).max(8_000), impact: z.enum(["read", "draft", "guarded", "high"]), steps: z.array(z.object({ title: z.string().trim().min(2).max(255), toolName: z.enum(["get_operational_overview", "create_project_draft", "propose_source", "register_asset_draft"]), inputTemplate: z.string().trim().max(4_000).optional() })).min(1).max(12) }))
      .mutation(async ({ ctx, input }) => {
        const playbook = await db.createContentPlaybook({ ownerId: ctx.user.id, ...input });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "workflow", summary: `NOVA: إنشاء Playbook «${playbook.title}»`, details: `عدد الخطوات: ${input.steps.length} | الأثر: ${input.impact}`, actorType: "user" });
        return playbook;
      }),
    workspace: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive().optional() }).optional())
      .query(({ ctx, input }) => getNOVAWorkspace(ctx.user.id, input?.sessionId)),
    createSession: protectedProcedure
      .input(z.object({ title: z.string().trim().min(1).max(180).optional() }).optional())
      .mutation(({ ctx, input }) => createNOVASession(ctx.user.id, input?.title)),
    archiveSession: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.archiveAssistantSession(ctx.user.id, input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "جلسة NOVA غير موجودة." });
        return session;
      }),
    sendMessage: protectedProcedure
      .input(z.object({ sessionId: z.number().int().positive().optional(), content: z.string().trim().min(1).max(8_000) }))
      .mutation(({ ctx, input }) => runNOVATurn({ ownerId: ctx.user.id, sessionId: input.sessionId, content: input.content, origin: "web" })),
  }),
  daousha: router({
    references: publicProcedure.query(() => platformReferences),
    trendSignals: protectedProcedure
      .input(z.object({ geo: z.enum(["EG", "US"]) }))
      .query(async ({ input }) => ({ signals: await fetchGoogleTrendSignals(input.geo), fetchedAt: new Date() })),
    dashboard: protectedProcedure.query(({ ctx }) => db.getDashboardData(ctx.user.id)),
    projects: protectedProcedure
      .input(z.object({ status: projectStatus.optional() }).optional())
      .query(async ({ ctx, input }) => {
        const projects = await db.listProjects(ctx.user.id);
        return input?.status ? projects.filter(project => project.status === input.status) : projects;
      }),
    operationalProjects: protectedProcedure.query(({ ctx }) => db.listOperationalProjects(ctx.user.id)),
    createProject: protectedProcedure
      .input(z.object({ title: z.string().trim().min(3).max(255), brief: z.string().trim().max(12000).optional(), targetLanguage: z.enum(["ar", "en", "both"]).default("both"), contentFormat: z.enum(["short", "long"]).default("short"), parentProjectId: z.number().int().positive().optional() }))
      .mutation(({ ctx, input }) => db.createProject({ ownerId: ctx.user.id, ...input })),
    createTwoFormatProjectPackage: protectedProcedure
      .input(z.object({ title: z.string().trim().min(3).max(220), brief: z.string().trim().max(12000).optional(), targetLanguage: z.enum(["ar", "en", "both"]).default("both") }))
      .mutation(async ({ ctx, input }) => {
        const bundle = await db.createTwoFormatProjectPackage({ ownerId: ctx.user.id, ...input });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "workflow", summary: "إنشاء حزمة إنتاج قصيرة وطويلة", details: `الفكرة الأم: ${bundle.parent.id} | النسخ: ${bundle.variants.map(item => item.id).join(", ")}`, actorType: "user" });
        return bundle;
      }),
    transitionProject: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), status: z.enum(["idea", "research", "script", "production", "review", "approved", "blocked"]) }))
      .mutation(async ({ ctx, input }) => {
        const current = await db.getOwnedProject(ctx.user.id, input.projectId);
        if (!current || current.projectKind === "package_parent") throw new TRPCError({ code: "NOT_FOUND", message: "اختر نسخة تشغيلية من الحزمة بدل الفكرة الأم." });
        if (!isAllowedWorkflowTransition(current.status as WorkflowStatus, input.status as WorkflowStatus)) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: `لا يمكن نقل المشروع من ${current.status} إلى ${input.status} قبل إكمال المرحلة السابقة.` });
        }
        if (input.status === "approved") {
          const linkedVideos = (await db.listOwnedProjectVideoAssets(ctx.user.id)).filter(item => item.project.id === input.projectId);
          if (!hasApprovedSafeVideo(linkedVideos)) {
            throw new TRPCError({ code: "PRECONDITION_FAILED", message: "يلزم ربط فيديو بالمشروع واعتماد حقوقه وسلامته قبل الاعتماد البشري." });
          }
        }
        const project = await db.updateProjectStatus(ctx.user.id, input.projectId, input.status);
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "workflow", summary: `تغيير حالة المشروع: ${project.title}`, details: `الحالة الجديدة: ${input.status}`, actorType: "user" });
        if (input.status === "review" || input.status === "blocked") {
          await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, eventType: input.status === "review" ? "project_review_required" : "project_blocked", title: input.status === "review" ? "مشروع بانتظار مراجعة" : "مشروع متوقف", detail: `المشروع «${project.title}» أصبح في حالة ${input.status}.` });
        }
        return project;
      }),
    generateScript: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getOwnedProject(ctx.user.id, input.projectId);
        if (!project || project.projectKind === "package_parent") throw new TRPCError({ code: "NOT_FOUND", message: "اختر نسخة تشغيلية من الحزمة لتوليد السكربت." });
        const draft = await generateOriginalScript(project);
        await db.saveProjectScripts(ctx.user.id, input.projectId, draft);
        return { draft };
      }),
    generateVisual: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), prompt: z.string().trim().min(12).max(1800), outputRole: z.enum(["primary_scene", "broll", "cover"]).default("primary_scene") }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getOwnedProject(ctx.user.id, input.projectId);
        if (!project || project.projectKind === "package_parent") throw new TRPCError({ code: "NOT_FOUND", message: "اختر نسخة تشغيلية من الحزمة لتوليد المشهد." });
        const { models } = await listImageModels();
        const outputLabel = { primary_scene: "مشهد أصلي رئيسي", broll: "مادة B-roll أصلية", cover: "غلاف أصلي" }[input.outputRole];
        const generated = await generateImage({ model: models[0]?.model, prompt: `Create a fully original production still for this video project. Output role: ${outputLabel}. No logos, watermarks, copyrighted characters, real identifiable people, or text. Project: ${project.title}. Creative brief: ${input.prompt}` });
        const assetInput = { title: `${outputLabel} — ${project.title}`, assetKind: "image" as const, storageUrl: generated.url, licenseType: "مشهد مولّد أصليًا بواسطة دعوشة", attribution: "Daousha ImageService" };
        const asset = await db.createAsset({ ownerId: ctx.user.id, ...assetInput, ...assessAssetIntake(assetInput) });
        await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, eventType: "review_required", title: "مادة أصلية تحتاج مراجعة", detail: `المخرج «${asset.title}» ينتظر قرار الحقوق والسلامة.` });
        return { assetId: asset.id, url: generated.url };
      }),
    assets: protectedProcedure.query(({ ctx }) => db.listAssets(ctx.user.id)),
    registerAsset: protectedProcedure
      .input(z.object({ title: z.string().trim().min(2).max(255), assetKind: z.enum(["video", "audio", "image", "document", "other"]), licenseType: z.string().trim().min(2).max(160), sourceUrl: url.optional(), licenseUrl: url.optional(), attribution: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const asset = await db.createAsset({ ownerId: ctx.user.id, ...input, ...assessAssetIntake(input) });
        await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, eventType: "review_required", title: "مادة تحتاج مراجعة", detail: `المادة «${asset.title}» أضيفت إلى بوابة الحقوق والسلامة.` });
        return asset;
      }),
    uploadAsset: protectedProcedure
      .input(z.object({ title: z.string().trim().min(2).max(255), fileName: z.string().trim().min(1).max(255), contentType: z.string().trim().min(3).max(160), base64: z.string().min(4).max(14_000_000), assetKind: z.enum(["video", "audio", "image", "other"]), licenseType: z.string().trim().min(2).max(160), sourceUrl: url.optional(), attribution: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const bytes = Buffer.from(input.base64, "base64");
        if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error("الملف غير صالح أو أكبر من الحد الأولي للرفع.");
        const uploaded = await storagePut(`daousha/${ctx.user.id}/raw/${safeName}`, bytes, input.contentType);
        const assetInput = { title: input.title, assetKind: input.assetKind, storageKey: uploaded.key, storageUrl: uploaded.url, sourceUrl: input.sourceUrl, licenseType: input.licenseType, attribution: input.attribution };
        const asset = await db.createAsset({ ownerId: ctx.user.id, ...assetInput, ...assessAssetIntake(assetInput) });
        await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, eventType: "review_required", title: "ملف يحتاج مراجعة", detail: `الملف «${asset.title}» رُفع وينتظر قرار الحقوق والسلامة.` });
        return asset;
      }),
    reviewAsset: protectedProcedure
      .input(z.object({ assetId: z.number().int().positive(), licenseStatus: z.enum(["approved", "held", "rejected"]), safetyStatus: z.enum(["clear", "review", "blocked"]) }))
      .mutation(async ({ ctx, input }) => {
        const asset = await db.reviewAsset(ctx.user.id, input.assetId, { licenseStatus: input.licenseStatus, safetyStatus: input.safetyStatus, reviewNotes: `قرار مراجعة بشري: الحقوق ${input.licenseStatus}، السلامة ${input.safetyStatus}.` });
        if (!asset) throw new TRPCError({ code: "NOT_FOUND", message: "المادة غير موجودة." });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "safety_rule", summary: `قرار مراجعة للمادة: ${asset.title}`, details: `الحقوق: ${input.licenseStatus} | السلامة: ${input.safetyStatus}`, actorType: "user" });
        return asset;
      }),
    sources: protectedProcedure.query(({ ctx }) => db.listSources(ctx.user.id)),
    addSource: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(180), url, sourceKind: z.enum(["trend", "asset", "audio", "reference"]), language: z.enum(["ar", "en", "both"]).default("both"), notes: z.string().trim().max(4000).optional() }))
      .mutation(({ ctx, input }) => db.createSource({ ownerId: ctx.user.id, ...input, trustStatus: "proposed" })),
    reviewSource: protectedProcedure
      .input(z.object({ sourceId: z.number().int().positive(), trustStatus: z.enum(["approved", "held", "rejected"]) }))
      .mutation(async ({ ctx, input }) => {
        const source = await db.reviewSource(ctx.user.id, input.sourceId, input.trustStatus);
        if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "المصدر غير موجود." });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "source", summary: `قرار مصدر: ${source.name}`, details: `الحالة الجديدة: ${input.trustStatus}`, actorType: "user" });
        return source;
      }),
    proposals: protectedProcedure.query(({ ctx }) => db.listProposals(ctx.user.id)),
    proposeDevelopment: protectedProcedure
      .input(z.object({ proposalKind: z.enum(["source", "workflow", "integration", "model", "safety_rule"]), title: z.string().trim().min(3).max(255), rationale: z.string().trim().min(10).max(8000), referenceUrl: url.optional() }))
      .mutation(({ ctx, input }) => db.createProposal({ ownerId: ctx.user.id, ...input, state: "proposed" })),
    performanceImprovementSuggestions: protectedProcedure.query(async ({ ctx }) => {
      const dashboard = await db.getDashboardData(ctx.user.id);
      const suggestion = derivePerformanceImprovementSuggestion(dashboard.snapshots);
      const recordedTitles = new Set(dashboard.proposals.filter(proposal => proposal.state === "proposed").map(proposal => proposal.title));
      return { message: performanceExperimentAdvice(summarizePerformance(dashboard.snapshots)), suggestions: suggestion ? [{ ...suggestion, recorded: recordedTitles.has(suggestion.title) }] : [] };
    }),
    recordPerformanceImprovement: protectedProcedure
      .input(z.object({ suggestionId: z.enum(["retention_hook", "engagement_cta", "single_variable_experiment"]) }))
      .mutation(async ({ ctx, input }) => {
        const dashboard = await db.getDashboardData(ctx.user.id);
        const suggestion = derivePerformanceImprovementSuggestion(dashboard.snapshots);
        if (!suggestion || suggestion.id !== input.suggestionId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا توجد لقطة أداء موثقة تدعم هذا الاقتراح حاليًا." });
        const existing = dashboard.proposals.find(proposal => proposal.state === "proposed" && proposal.title === suggestion.title);
        if (existing) return { created: false, proposal: existing };
        const proposal = await db.createProposal({ ownerId: ctx.user.id, proposalKind: "workflow", title: suggestion.title, rationale: suggestion.rationale, state: "proposed" });
        return { created: true, proposal };
      }),
    schedules: protectedProcedure.query(({ ctx }) => db.listSchedules(ctx.user.id)),
    createScheduleDraft: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), platform: z.enum(["youtube", "instagram", "facebook"]), cronExpression: z.string().trim().regex(/^\S+(\s+\S+){5}$/, "يجب أن يكون التعبير الزمني من 6 حقول"), timeZone: z.string().trim().min(2).max(80).default("UTC") }))
      .mutation(async ({ ctx, input }) => {
        const [project, connections] = await Promise.all([db.getOwnedProject(ctx.user.id, input.projectId), db.listChannelConnections(ctx.user.id)]);
        if (!project || project.projectKind === "package_parent") throw new TRPCError({ code: "NOT_FOUND", message: "لا يمكن جدولة الفكرة الأم؛ اختر نسخة قصيرة أو طويلة." });
        const youtube = connections.find(connection => connection.platform === "youtube" && connection.status === "authorized" && connection.credentialCiphertext);
        const instagram = connections.find(connection => connection.platform === "instagram" && connection.status === "authorized" && connection.credentialCiphertext && connection.scopeSummary?.includes("instagram_business_content_publish"));
        const facebook = connections.find(connection => connection.platform === "facebook" && connection.status === "authorized" && connection.credentialCiphertext && connection.externalAccountRef);
        if (!((input.platform === "youtube" && youtube) || (input.platform === "instagram" && instagram) || (input.platform === "facebook" && facebook))) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن جدولة النشر إلا لقناة YouTube أو Instagram API أو صفحة Facebook المفوضة رسميًا." });
        return db.createSchedule({ ownerId: ctx.user.id, ...input, status: "draft" });
      }),
    activateSchedule: protectedProcedure
      .input(z.object({ scheduleId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const schedule = await db.getOwnedSchedule(ctx.user.id, input.scheduleId);
        if (!schedule) throw new TRPCError({ code: "NOT_FOUND", message: "مسودة الجدولة غير موجودة." });
        if (schedule.status === "active" && schedule.scheduleCronTaskUid) return schedule;
        const connections = await db.listChannelConnections(ctx.user.id);
        const platform = schedule.platform.toLowerCase();
        const youtube = connections.find(connection => connection.platform === "youtube" && connection.status === "authorized" && connection.credentialCiphertext);
        const instagram = connections.find(connection => connection.platform === "instagram" && connection.status === "authorized" && connection.credentialCiphertext && connection.scopeSummary?.includes("instagram_business_content_publish"));
        const facebook = connections.find(connection => connection.platform === "facebook" && connection.status === "authorized" && connection.credentialCiphertext && connection.externalAccountRef);
        if (!((platform === "youtube" && youtube) || (platform === "instagram" && instagram) || (platform === "facebook" && facebook))) {
          await db.setScheduleStatus(ctx.user.id, schedule.id, "needs_approval");
          await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, eventType: "schedule_needs_review", title: "لا يمكن تفعيل الجدولة", detail: "الوجهة ليست قناة مفوضة قابلة للنشر الدوري." });
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "لا يمكن تفعيل الجدولة إلا لوجهة YouTube أو Instagram API أو صفحة Facebook مفوضة رسميًا." });
        }
        const task = await createHeartbeatJob({
          name: `xdaw-publish-${ctx.user.id}-${schedule.id}`,
          cron: schedule.cronExpression,
          path: "/api/scheduled/publish",
          payload: { scheduleId: schedule.id },
          description: `XDAW NOVA scheduled publication for project ${schedule.projectId}`,
        }, readSessionToken(ctx.req.headers.cookie));
        const active = await db.activateSchedule(ctx.user.id, schedule.id, task.taskUid, task.nextExecutionAt);
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "schedule", summary: "تفعيل دورة نشر دورية", details: `المشروع ${schedule.projectId} | ${schedule.platform} | ${schedule.cronExpression}`, actorType: "user" });
        return active;
      }),
    pauseSchedule: protectedProcedure
      .input(z.object({ scheduleId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const schedule = await db.getOwnedSchedule(ctx.user.id, input.scheduleId);
        if (!schedule) throw new TRPCError({ code: "NOT_FOUND", message: "مسودة الجدولة غير موجودة." });
        if (!schedule.scheduleCronTaskUid) return db.setScheduleStatus(ctx.user.id, schedule.id, "paused");
        const task = await updateHeartbeatJob(schedule.scheduleCronTaskUid, { enable: false }, readSessionToken(ctx.req.headers.cookie));
        const paused = await db.setScheduleStatus(ctx.user.id, schedule.id, "paused", task.nextExecutionAt);
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "schedule", summary: "إيقاف دورة نشر دورية", details: `المشروع ${schedule.projectId} | ${schedule.platform}`, actorType: "user" });
        return paused;
      }),
    youtubeHealthMonitor: protectedProcedure.query(({ ctx }) => db.getConnectionHealthMonitor(ctx.user.id, "youtube")),
    activateYouTubeHealthMonitor: protectedProcedure.mutation(async ({ ctx }) => {
      const connection = await db.getChannelConnection(ctx.user.id, "youtube");
      if (!connection || connection.status !== "authorized" || !connection.credentialCiphertext) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط قناة YouTube رسميًا قبل تفعيل مراقبة الاتصال." });
      const monitor = await db.getConnectionHealthMonitor(ctx.user.id, "youtube");
      let taskUid = monitor?.scheduleCronTaskUid;
      let nextExecutionAt: string | null | undefined;
      if (taskUid) {
        const task = await updateHeartbeatJob(taskUid, { enable: true }, readSessionToken(ctx.req.headers.cookie));
        nextExecutionAt = task.nextExecutionAt;
      } else {
        const task = await createHeartbeatJob({ name: `xdaw-youtube-health-${ctx.user.id}`, cron: "0 0 */6 * * *", path: "/api/scheduled/youtube-health-monitor", description: "XDAW NOVA non-publishing YouTube OAuth health monitor" }, readSessionToken(ctx.req.headers.cookie));
        taskUid = task.taskUid;
        nextExecutionAt = task.nextExecutionAt;
      }
      const saved = await db.upsertConnectionHealthMonitor({ ownerId: ctx.user.id, platform: "youtube", scheduleCronTaskUid: taskUid });
      await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "integration", summary: "تفعيل مراقبة اتصال YouTube", details: "فحص صحة كل 6 ساعات وتجديد قراءة فقط؛ لا رفع ولا نشر.", actorType: "user" });
      return { monitor: saved, nextExecutionAt };
    }),
    instagramHealthMonitor: protectedProcedure.query(({ ctx }) => db.getConnectionHealthMonitor(ctx.user.id, "instagram")),
    activateInstagramHealthMonitor: protectedProcedure.mutation(async ({ ctx }) => {
      const connection = await db.getChannelConnection(ctx.user.id, "instagram");
      if (!connection || connection.status !== "authorized" || !connection.credentialCiphertext || !connection.scopeSummary?.includes("instagram_business_content_publish")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط Instagram API رسميًا بصلاحية نشر المحتوى قبل تفعيل مراقبة الاتصال." });
      const monitor = await db.getConnectionHealthMonitor(ctx.user.id, "instagram");
      let taskUid = monitor?.scheduleCronTaskUid;
      let nextExecutionAt: string | null | undefined;
      if (taskUid) {
        const task = await updateHeartbeatJob(taskUid, { enable: true }, readSessionToken(ctx.req.headers.cookie));
        nextExecutionAt = task.nextExecutionAt;
      } else {
        const task = await createHeartbeatJob({ name: `xdaw-instagram-health-${ctx.user.id}`, cron: "0 15 */6 * * *", path: "/api/scheduled/instagram-health-monitor", description: "XDAW NOVA non-publishing Instagram token health monitor" }, readSessionToken(ctx.req.headers.cookie));
        taskUid = task.taskUid;
        nextExecutionAt = task.nextExecutionAt;
      }
      const saved = await db.upsertConnectionHealthMonitor({ ownerId: ctx.user.id, platform: "instagram", scheduleCronTaskUid: taskUid });
      await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "integration", summary: "تفعيل مراقبة اتصال Instagram", details: "فحص هوية وتجديد رمز Instagram كل 6 ساعات؛ لا ينشئ أو ينشر أي Reel.", actorType: "user" });
      return { monitor: saved, nextExecutionAt };
    }),
    integrations: protectedProcedure.query(async ({ ctx }) => {
      const [connections, assets, youtubeHealthMonitor, instagramHealthMonitor] = await Promise.all([db.listChannelConnections(ctx.user.id), db.listAssets(ctx.user.id), db.getConnectionHealthMonitor(ctx.user.id, "youtube"), db.getConnectionHealthMonitor(ctx.user.id, "instagram")]);
      return {
        connections,
        youtubeHealthMonitor,
        instagramHealthMonitor,
        distributionReadiness: resolveDistributionReadiness(connections),
        telegramConfigured: telegramIsConfigured(),
        youtubeClientConfigured: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
        youtubeRedirectUri: `${ctx.req.header("x-forwarded-proto")?.split(",")[0] ?? ctx.req.protocol}://${ctx.req.header("x-forwarded-host") ?? ctx.req.header("host")}/api/integrations/youtube/callback`,
        instagramClientConfigured: Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET),
        instagramRedirectUri: `${ctx.req.header("x-forwarded-proto")?.split(",")[0] ?? ctx.req.protocol}://${ctx.req.header("x-forwarded-host") ?? ctx.req.header("host")}/api/integrations/instagram/callback`,
        facebookClientConfigured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET),
        facebookRedirectUri: getFacebookRedirectUri(ctx.req),
        facebookExpectedDomains: FACEBOOK_OAUTH_DOMAINS,
        facebookDomainReady: facebookOAuthDomainIsReady(ctx.req),
        tiktokClientConfigured: Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET),
        tiktokSandboxClientConfigured: Boolean(process.env.TIKTOK_SANDBOX_CLIENT_KEY && process.env.TIKTOK_SANDBOX_CLIENT_SECRET),
        tiktokSandboxSessionActive: Boolean(getTikTokSandboxAccessToken(ctx.req)),
        tiktokSandboxCandidates: assets.filter(asset => asset.assetKind === "video" && asset.licenseStatus === "approved" && asset.safetyStatus === "clear" && asset.storageKey).map(asset => ({ id: asset.id, title: asset.title })),
        tiktokRedirectUri: getTikTokRedirectUri(ctx.req),
      };
    }),
    uploadTikTokSandboxDraft: protectedProcedure
      .input(z.object({ assetId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const accessToken = getTikTokSandboxAccessToken(ctx.req);
        if (!accessToken) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "أعد تفويض TikTok Sandbox قبل إنشاء المسودة التجريبية." });
        const asset = await db.getOwnedAsset(ctx.user.id, input.assetId);
        if (!asset || asset.assetKind !== "video" || asset.licenseStatus !== "approved" || asset.safetyStatus !== "clear" || !asset.storageKey) {
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اختر أصل فيديو مملوكًا ومعتمد الحقوق وواضح السلامة فقط." });
        }
        try {
          const result = await uploadTikTokSandboxDraft({ accessToken, storageKey: asset.storageKey });
          await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "integration", summary: "إنشاء مسودة TikTok Sandbox", details: `الأصل: ${asset.id} | publish_id: ${result.publishId} | الحجم: ${result.sizeBytes} بايت. لم يُنفذ نشر مباشر.`, actorType: "user" });
          return result;
        } catch (error) {
          const message = error instanceof Error ? error.message : "فشل غير معروف في مسودة TikTok Sandbox.";
          await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "integration", summary: "فشل مسودة TikTok Sandbox", details: message, actorType: "user" });
          await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, eventType: "tiktok_sandbox_draft_failed", title: "تعثر مسودة TikTok Sandbox", detail: "تعذر إنشاء المسودة التجريبية. راجع سجل التكامل ثم أعد المحاولة يدويًا." });
          throw new TRPCError({ code: "BAD_GATEWAY", message });
        }
      }),
    claimTelegramChat: protectedProcedure.mutation(async ({ ctx }) => {
      const chatId = await discoverLatestTelegramChatId();
      if (!chatId) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "أرسل start إلى البوت أولًا ثم أعد المحاولة." });
      const connection = await db.upsertChannelConnection({
        ownerId: ctx.user.id,
        platform: "telegram",
        label: "XDAW NOVA Telegram Alerts",
        externalAccountRef: chatId,
        status: "authorized",
        scopeSummary: "Operational status notifications only",
        lastVerifiedAt: new Date(),
      });
      await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "integration", summary: "ربط إشعارات Telegram", details: "تم اعتماد محادثة إشعارات للمحرك.", actorType: "user" });
      return connection;
    }),
    sendTelegramTest: protectedProcedure.mutation(async ({ ctx }) => {
      const connection = (await db.listChannelConnections(ctx.user.id)).find(item => item.platform === "telegram" && item.status === "authorized");
      if (!connection?.externalAccountRef) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط محادثة Telegram أولًا." });
      const result = await sendTelegramOperationalNotification({ chatId: connection.externalAccountRef, title: "اختبار الاتصال", detail: "تم ربط إشعارات XDAW NOVA بنجاح." });
      await db.recordNotificationEvent({ ownerId: ctx.user.id, channel: "telegram", eventType: "connection_test", deliveryStatus: result.delivered ? "sent" : "failed", detail: result.reason });
      return result;
    }),
    configureConnection: protectedProcedure
      .input(z.object({ platform: z.enum(["youtube", "tiktok", "instagram", "facebook", "telegram"]), label: z.string().trim().min(2).max(160), externalAccountRef: z.string().trim().max(320).optional(), status: z.enum(["disconnected", "configured", "authorized", "error"]), scopeSummary: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const connection = await db.upsertChannelConnection({ ownerId: ctx.user.id, ...input, lastVerifiedAt: input.status === "authorized" ? new Date() : undefined });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "integration", summary: `تحديث اتصال ${input.platform}`, details: `الحالة: ${input.status}`, actorType: "user" });
        return connection;
      }),
    publishingPolicy: protectedProcedure.query(({ ctx }) => db.getPublishingPolicy(ctx.user.id)),
    contentMixStatus: protectedProcedure.query(({ ctx }) => db.getContentMixStatus(ctx.user.id)),
    updatePublishingPolicy: protectedProcedure
      .input(z.object({ mode: z.enum(["human_review", "guarded_auto"]), publicPublishingEnabled: z.boolean(), killSwitchEnabled: z.boolean(), requirePrivateCanary: z.boolean(), minIntervalMinutes: z.number().int().min(10).max(1440), maxPublicationsPerDay: z.number().int().min(1).max(144), dailyShortTarget: z.number().int().min(0).max(100), dailyLongTarget: z.number().int().min(0).max(20) }))
      .mutation(async ({ ctx, input }) => {
        const policy = await db.updatePublishingPolicy(ctx.user.id, input);
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "safety_rule", summary: "تحديث سياسة النشر", details: `الوضع: ${input.mode} | علني: ${input.publicPublishingEnabled ? "نعم" : "لا"} | الإيقاف: ${input.killSwitchEnabled ? "مفعّل" : "غير مفعّل"} | القصير: ${input.dailyShortTarget} | الطويل: ${input.dailyLongTarget}`, actorType: "user" });
        return policy;
      }),
    publishingRuns: protectedProcedure.query(({ ctx }) => db.listPublishingRuns(ctx.user.id)),
    notificationEvents: protectedProcedure.query(({ ctx }) => db.listNotificationEvents(ctx.user.id)),
    projectVideoAssets: protectedProcedure.query(({ ctx }) => db.listOwnedProjectVideoAssets(ctx.user.id)),
    uploadMetadataDraft: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive() }))
      .query(({ ctx, input }) => db.getUploadMetadataDraft(ctx.user.id, input.projectId, input.assetId)),
    savePrivateUploadMetadataDraft: protectedProcedure
      .input(z.object({
        projectId: z.number().int().positive(),
        assetId: z.number().int().positive(),
        title: z.string().trim().min(3).max(100),
        description: z.string().trim().min(10).max(5000),
        tags: z.array(z.string().trim().min(1).max(80)).max(15),
      }))
      .mutation(async ({ ctx, input }) => {
        const linked = await db.getOwnedProjectVideoAsset(ctx.user.id, input.projectId, input.assetId);
        if (!linked) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط ملف الفيديو بالمشروع نفسه قبل حفظ مسودة الرفع." });
        const draft = await db.upsertPrivateUploadMetadataDraft({ ownerId: ctx.user.id, ...input });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "workflow", summary: "حفظ مسودة رفع خاصة", details: `YouTube خاص — ${linked.project.title} — لا يوجد رفع أو نشر.`, actorType: "user" });
        return draft;
      }),
    linkProjectAsset: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive(), clipRole: z.enum(["primary", "broll", "audio", "reference"]).default("primary") }))
      .mutation(async ({ ctx, input }) => {
        const link = await db.linkOwnedAssetToProject(ctx.user.id, input.projectId, input.assetId, input.clipRole);
        if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "لا يمكن ربط مشروع أو مادة غير مملوكة للحساب." });
        return link;
      }),
    acknowledgeProjectPreview: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.acknowledgeProjectPreview(ctx.user.id, input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود." });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "workflow", summary: "إقرار معاينة الفيديو", details: `تمت معاينة النسخة النهائية للمشروع: ${project.title}`, actorType: "user" });
        return project;
      }),
    preflightVettedYouTubeVideo: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const [linked, policy, runs] = await Promise.all([db.getOwnedProjectVideoAsset(ctx.user.id, input.projectId, input.assetId), db.getPublishingPolicy(ctx.user.id), db.listPublishingRuns(ctx.user.id)]);
        if (!linked) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط ملف الفيديو بالمشروع نفسه قبل فحص النشر." });
        const { project, asset } = linked;
        const decision = evaluatePublishGuard(policy, {
          originalContent: /أصلي|original/i.test(asset.licenseType),
          rightsClear: asset.licenseStatus === "approved",
          safetyClear: asset.safetyStatus === "clear",
          previewAcknowledged: Boolean(project.previewAcknowledgedAt),
          hasPrivateCanary: runs.some(run => run.projectId === project.id && run.platform === "youtube" && run.status === "private_uploaded"),
          publicationsInLast24Hours: runs.filter(run => run.status === "public_uploaded" && run.createdAt.getTime() >= Date.now() - 24 * 60 * 60 * 1000).length,
        });
        return { decision, previewAcknowledgedAt: project.previewAcknowledgedAt };
      }),
    uploadVettedYouTubeVideo: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive(), title: z.string().trim().min(3).max(100), description: z.string().trim().min(10).max(5000), tags: z.array(z.string().trim().min(1).max(80)).max(15) }))
      .mutation(async ({ ctx, input }) => {
        const [linked, policy, connections, runs] = await Promise.all([
          db.getOwnedProjectVideoAsset(ctx.user.id, input.projectId, input.assetId),
          db.getPublishingPolicy(ctx.user.id),
          db.listChannelConnections(ctx.user.id),
          db.listPublishingRuns(ctx.user.id),
        ]);
        if (!linked) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط ملف الفيديو بالمشروع نفسه قبل طلب الرفع." });
        const { project, asset } = linked;
        const youtube = connections.find(connection => connection.platform === "youtube" && connection.status === "authorized");
        if (!youtube?.credentialCiphertext) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط قناة YouTube رسميًا قبل الرفع." });
        if (!asset.storageKey || asset.assetKind !== "video") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "أضف ملف فيديو محفوظًا في التخزين الآمن أولًا." });

        const originalContent = /أصلي|original/i.test(asset.licenseType);
        const hasPrivateCanary = runs.some(run => run.projectId === project.id && run.platform === "youtube" && run.status === "private_uploaded");
        const publicationsInLast24Hours = runs.filter(run => run.status === "public_uploaded" && run.createdAt.getTime() >= Date.now() - 24 * 60 * 60 * 1000).length;
        const decision = evaluatePublishGuard(policy, { originalContent, rightsClear: asset.licenseStatus === "approved", safetyClear: asset.safetyStatus === "clear", previewAcknowledged: Boolean(project.previewAcknowledgedAt), hasPrivateCanary, publicationsInLast24Hours });
        if (!decision.allowed) {
          const blockedRun = await db.createPublishingRun({ ownerId: ctx.user.id, projectId: project.id, platform: "youtube", status: "blocked", visibility: "private", decisionReason: decision.reason, initiatedBy: "user" });
          return { published: false, requiresPublicConfirmation: false, run: blockedRun, reason: decision.reason };
        }
        const run = await db.createPublishingRun({ ownerId: ctx.user.id, projectId: project.id, platform: "youtube", status: "queued", visibility: decision.visibility, decisionReason: decision.reason, initiatedBy: "user" });
        try {
          const uploaded = await uploadVettedVideoToYouTube(youtube, { storageKey: asset.storageKey, title: input.title, description: input.description, tags: input.tags, visibility: decision.visibility });
          const status = decision.visibility === "public" ? "public_uploaded" : "private_uploaded";
          const completedRun = await db.updatePublishingRun(ctx.user.id, run.id, { status, externalVideoId: uploaded.videoId, externalUrl: uploaded.url });
          if (decision.visibility === "public") await db.markPolicyPublished(ctx.user.id);
          const telegram = connections.find(connection => connection.platform === "telegram" && connection.status === "authorized");
          if (telegram?.externalAccountRef) {
            const delivered = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title: `تم رفع فيديو ${decision.visibility === "public" ? "عام" : "خاص"}`, detail: `${input.title}\n${uploaded.url}` });
            await db.recordNotificationEvent({ ownerId: ctx.user.id, publishingRunId: run.id, channel: "telegram", eventType: "youtube_upload", deliveryStatus: delivered.delivered ? "sent" : "failed", detail: delivered.reason });
          }
          return { published: true, requiresPublicConfirmation: false, run: completedRun, url: uploaded.url, visibility: decision.visibility };
        } catch (error) {
          const failedRun = await db.updatePublishingRun(ctx.user.id, run.id, { status: "failed" });
          await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, publishingRunId: run.id, eventType: "youtube_upload_failed", title: "تعثر رفع YouTube", detail: `تعذر رفع «${input.title}». سبب التعثر: ${describeUploadFailure(error)}. سُجل الفشل ولم تبدأ إعادة محاولة تلقائية.` });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذّر رفع الفيديو إلى YouTube. سُجّل الفشل ولم تتم إعادة المحاولة تلقائيًا.", cause: failedRun });
        }
      }),
    uploadVettedFacebookVideo: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive(), title: z.string().trim().min(3).max(100), description: z.string().trim().min(10).max(5000) }))
      .mutation(async ({ ctx, input }) => {
        const [linked, policy, connections, runs] = await Promise.all([
          db.getOwnedProjectVideoAsset(ctx.user.id, input.projectId, input.assetId),
          db.getPublishingPolicy(ctx.user.id),
          db.listChannelConnections(ctx.user.id),
          db.listPublishingRuns(ctx.user.id),
        ]);
        if (!linked) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط ملف الفيديو بالمشروع نفسه قبل طلب رفع Facebook." });
        const { project, asset } = linked;
        const facebook = connections.find(connection => connection.platform === "facebook" && connection.status === "authorized");
        if (!facebook?.externalAccountRef) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "اربط صفحة Facebook رسميًا قبل الرفع." });
        if (!asset.storageKey || asset.assetKind !== "video") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "أضف ملف فيديو محفوظًا في التخزين الآمن أولًا." });

        const hasPrivateCanary = runs.some(run => run.projectId === project.id && run.platform === "facebook" && run.status === "private_uploaded");
        const publicationsInLast24Hours = runs.filter(run => run.platform === "facebook" && run.status === "public_uploaded" && run.createdAt.getTime() >= Date.now() - 24 * 60 * 60 * 1000).length;
        const decision = evaluatePublishGuard(policy, {
          originalContent: /أصلي|original/i.test(asset.licenseType),
          rightsClear: asset.licenseStatus === "approved",
          safetyClear: asset.safetyStatus === "clear",
          previewAcknowledged: Boolean(project.previewAcknowledgedAt),
          hasPrivateCanary,
          publicationsInLast24Hours,
        });
        if (!decision.allowed) {
          const blockedRun = await db.createPublishingRun({ ownerId: ctx.user.id, projectId: project.id, platform: "facebook", status: "blocked", visibility: "private", decisionReason: decision.reason, initiatedBy: "user" });
          return { published: false, requiresPublicConfirmation: false, run: blockedRun, reason: decision.reason };
        }
        const run = await db.createPublishingRun({ ownerId: ctx.user.id, projectId: project.id, platform: "facebook", status: "queued", visibility: decision.visibility, decisionReason: decision.reason, initiatedBy: "user" });
        try {
          const uploaded = await uploadVettedVideoToFacebookPage(facebook, { storageKey: asset.storageKey, title: input.title, description: input.description, visibility: decision.visibility });
          const status = decision.visibility === "public" ? "public_uploaded" : "private_uploaded";
          const completedRun = await db.updatePublishingRun(ctx.user.id, run.id, { status, externalVideoId: uploaded.videoId, externalUrl: uploaded.url });
          if (decision.visibility === "public") await db.markPolicyPublished(ctx.user.id);
          const telegram = connections.find(connection => connection.platform === "telegram" && connection.status === "authorized");
          if (telegram?.externalAccountRef) {
            const delivered = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title: `تم رفع فيديو Facebook ${decision.visibility === "public" ? "عام" : "خاص"}`, detail: `${input.title}\n${uploaded.url}` });
            await db.recordNotificationEvent({ ownerId: ctx.user.id, publishingRunId: run.id, channel: "telegram", eventType: "facebook_upload", deliveryStatus: delivered.delivered ? "sent" : "failed", detail: delivered.reason });
          }
          return { published: true, requiresPublicConfirmation: false, run: completedRun, url: uploaded.url, visibility: decision.visibility };
        } catch (error) {
          const failedRun = await db.updatePublishingRun(ctx.user.id, run.id, { status: "failed" });
          await notifyOwnerOperationalEvent({ ownerId: ctx.user.id, publishingRunId: run.id, eventType: "facebook_upload_failed", title: "تعثر رفع Facebook", detail: `تعذر رفع «${input.title}». سبب التعثر: ${describeUploadFailure(error)}. سُجل الفشل ولم تبدأ إعادة محاولة تلقائية.` });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذّر رفع الفيديو إلى Facebook. سُجّل الفشل ولم تتم إعادة المحاولة تلقائيًا.", cause: failedRun });
        }
      }),
    changeLog: protectedProcedure.query(({ ctx }) => db.listChangeLog(ctx.user.id)),
    recordAnalytics: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive().optional(), platform: z.string().trim().min(2).max(80), contentVariant: z.enum(["ar", "en", "both", "none"]).default("none"), views: z.number().int().min(0), engagements: z.number().int().min(0), retentionRate: z.number().int().min(0).max(100) }))
      .mutation(async ({ ctx, input }) => {
        if (input.projectId) {
          const project = await db.getOwnedProject(ctx.user.id, input.projectId);
          if (!project || project.projectKind === "package_parent") throw new TRPCError({ code: "NOT_FOUND", message: "سجّل اللقطة على نسخة تشغيلية من الحزمة، لا على الفكرة الأم." });
        }
        return db.recordAnalyticsSnapshot({ ownerId: ctx.user.id, ...input });
      }),
  }),
});

export type AppRouter = typeof appRouter;
