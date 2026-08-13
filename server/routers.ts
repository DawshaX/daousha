import { z } from "zod";
import { platformReferences } from "../shared/daousha";
import * as db from "./db";
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
import { uploadVettedVideoToYouTube } from "./youtubePublisher";

const url = z.string().url().max(1500);
const projectStatus = z.enum(["idea", "research", "script", "production", "review", "approved", "scheduled", "published", "blocked"]);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  daousha: router({
    references: publicProcedure.query(() => platformReferences),
    dashboard: protectedProcedure.query(({ ctx }) => db.getDashboardData(ctx.user.id)),
    projects: protectedProcedure
      .input(z.object({ status: projectStatus.optional() }).optional())
      .query(async ({ ctx, input }) => {
        const projects = await db.listProjects(ctx.user.id);
        return input?.status ? projects.filter(project => project.status === input.status) : projects;
      }),
    createProject: protectedProcedure
      .input(z.object({ title: z.string().trim().min(3).max(255), brief: z.string().trim().max(12000).optional(), targetLanguage: z.enum(["ar", "en", "both"]).default("both") }))
      .mutation(({ ctx, input }) => db.createProject({ ownerId: ctx.user.id, ...input })),
    transitionProject: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), status: z.enum(["idea", "research", "script", "production", "review", "approved", "blocked"]) }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.updateProjectStatus(ctx.user.id, input.projectId, input.status);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود." });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "workflow", summary: `تغيير حالة المشروع: ${project.title}`, details: `الحالة الجديدة: ${input.status}`, actorType: "user" });
        return project;
      }),
    generateScript: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getOwnedProject(ctx.user.id, input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود أو لا تملك صلاحية الوصول إليه." });
        const draft = await generateOriginalScript(project);
        await db.saveProjectScripts(ctx.user.id, input.projectId, draft);
        return { draft };
      }),
    generateVisual: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), prompt: z.string().trim().min(12).max(1800) }))
      .mutation(async ({ ctx, input }) => {
        const project = await db.getOwnedProject(ctx.user.id, input.projectId);
        if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "المشروع غير موجود أو لا تملك صلاحية الوصول إليه." });
        const { models } = await listImageModels();
        const generated = await generateImage({ model: models[0]?.model, prompt: `Create a fully original production still for this video project. No logos, watermarks, copyrighted characters, real identifiable people, or text. Project: ${project.title}. Creative brief: ${input.prompt}` });
        const asset = await db.createAsset({ ownerId: ctx.user.id, title: `مشهد أصلي — ${project.title}`, assetKind: "image", storageUrl: generated.url, licenseType: "مشهد مولّد أصليًا بواسطة دعوشة", attribution: "Daousha ImageService", licenseStatus: "pending", safetyStatus: "review" });
        return { assetId: asset.id, url: generated.url };
      }),
    assets: protectedProcedure.query(({ ctx }) => db.listAssets(ctx.user.id)),
    registerAsset: protectedProcedure
      .input(z.object({ title: z.string().trim().min(2).max(255), assetKind: z.enum(["video", "audio", "image", "document", "other"]), licenseType: z.string().trim().min(2).max(160), sourceUrl: url.optional(), licenseUrl: url.optional(), attribution: z.string().trim().max(4000).optional() }))
      .mutation(({ ctx, input }) => db.createAsset({ ownerId: ctx.user.id, ...input, licenseStatus: "pending", safetyStatus: "review" })),
    uploadAsset: protectedProcedure
      .input(z.object({ title: z.string().trim().min(2).max(255), fileName: z.string().trim().min(1).max(255), contentType: z.string().trim().min(3).max(160), base64: z.string().min(4).max(14_000_000), assetKind: z.enum(["video", "audio", "image", "other"]), licenseType: z.string().trim().min(2).max(160), sourceUrl: url.optional(), attribution: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const bytes = Buffer.from(input.base64, "base64");
        if (!bytes.length || bytes.length > 10 * 1024 * 1024) throw new Error("الملف غير صالح أو أكبر من الحد الأولي للرفع.");
        const uploaded = await storagePut(`daousha/${ctx.user.id}/raw/${safeName}`, bytes, input.contentType);
        return db.createAsset({ ownerId: ctx.user.id, title: input.title, assetKind: input.assetKind, storageKey: uploaded.key, storageUrl: uploaded.url, sourceUrl: input.sourceUrl, licenseType: input.licenseType, attribution: input.attribution, licenseStatus: "pending", safetyStatus: "review" });
      }),
    reviewAsset: protectedProcedure
      .input(z.object({ assetId: z.number().int().positive(), licenseStatus: z.enum(["approved", "held", "rejected"]), safetyStatus: z.enum(["clear", "review", "blocked"]) }))
      .mutation(async ({ ctx, input }) => {
        const asset = await db.reviewAsset(ctx.user.id, input.assetId, { licenseStatus: input.licenseStatus, safetyStatus: input.safetyStatus });
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
    schedules: protectedProcedure.query(({ ctx }) => db.listSchedules(ctx.user.id)),
    createScheduleDraft: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive(), platform: z.string().trim().min(2).max(80), cronExpression: z.string().trim().regex(/^\S+(\s+\S+){5}$/, "يجب أن يكون التعبير الزمني من 6 حقول"), timeZone: z.string().trim().min(2).max(80).default("UTC") }))
      .mutation(({ ctx, input }) => db.createSchedule({ ownerId: ctx.user.id, ...input, status: "draft" })),
    integrations: protectedProcedure.query(async ({ ctx }) => ({
      connections: await db.listChannelConnections(ctx.user.id),
      telegramConfigured: telegramIsConfigured(),
      youtubeClientConfigured: Boolean(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET),
      youtubeRedirectUri: `${ctx.req.header("x-forwarded-proto")?.split(",")[0] ?? ctx.req.protocol}://${ctx.req.header("x-forwarded-host") ?? ctx.req.header("host")}/api/integrations/youtube/callback`,
    })),
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
      .input(z.object({ platform: z.enum(["youtube", "telegram"]), label: z.string().trim().min(2).max(160), externalAccountRef: z.string().trim().max(320).optional(), status: z.enum(["disconnected", "configured", "authorized", "error"]), scopeSummary: z.string().trim().max(4000).optional() }))
      .mutation(async ({ ctx, input }) => {
        const connection = await db.upsertChannelConnection({ ownerId: ctx.user.id, ...input, lastVerifiedAt: input.status === "authorized" ? new Date() : undefined });
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "integration", summary: `تحديث اتصال ${input.platform}`, details: `الحالة: ${input.status}`, actorType: "user" });
        return connection;
      }),
    publishingPolicy: protectedProcedure.query(({ ctx }) => db.getPublishingPolicy(ctx.user.id)),
    updatePublishingPolicy: protectedProcedure
      .input(z.object({ mode: z.enum(["human_review", "guarded_auto"]), publicPublishingEnabled: z.boolean(), killSwitchEnabled: z.boolean(), requirePrivateCanary: z.boolean(), minIntervalMinutes: z.number().int().min(10).max(1440), maxPublicationsPerDay: z.number().int().min(1).max(144) }))
      .mutation(async ({ ctx, input }) => {
        const policy = await db.updatePublishingPolicy(ctx.user.id, input);
        await db.createChangeLogEntry({ ownerId: ctx.user.id, category: "safety_rule", summary: "تحديث سياسة النشر", details: `الوضع: ${input.mode} | علني: ${input.publicPublishingEnabled ? "نعم" : "لا"} | الإيقاف: ${input.killSwitchEnabled ? "مفعّل" : "غير مفعّل"}`, actorType: "user" });
        return policy;
      }),
    publishingRuns: protectedProcedure.query(({ ctx }) => db.listPublishingRuns(ctx.user.id)),
    notificationEvents: protectedProcedure.query(({ ctx }) => db.listNotificationEvents(ctx.user.id)),
    projectVideoAssets: protectedProcedure.query(({ ctx }) => db.listOwnedProjectVideoAssets(ctx.user.id)),
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
      .input(z.object({ projectId: z.number().int().positive(), assetId: z.number().int().positive(), title: z.string().trim().min(3).max(100), description: z.string().trim().min(10).max(5000), tags: z.array(z.string().trim().min(1).max(80)).max(15), confirmPublic: z.boolean().default(false) }))
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
        if (decision.visibility === "public" && !input.confirmPublic) {
          return { published: false, requiresPublicConfirmation: true, reason: "الفيديو جاهز للنشر العام. أرسل التأكيد العام المحدد لتنفيذ الرفع." };
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
        } catch {
          const failedRun = await db.updatePublishingRun(ctx.user.id, run.id, { status: "failed" });
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "تعذّر رفع الفيديو إلى YouTube. سُجّل الفشل ولم تتم إعادة المحاولة تلقائيًا.", cause: failedRun });
        }
      }),
    changeLog: protectedProcedure.query(({ ctx }) => db.listChangeLog(ctx.user.id)),
    recordAnalytics: protectedProcedure
      .input(z.object({ projectId: z.number().int().positive().optional(), platform: z.string().trim().min(2).max(80), views: z.number().int().min(0), engagements: z.number().int().min(0), retentionRate: z.number().int().min(0).max(100) }))
      .mutation(({ ctx, input }) => db.recordAnalyticsSnapshot({ ownerId: ctx.user.id, ...input })),
  }),
});

export type AppRouter = typeof appRouter;
