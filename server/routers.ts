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
    changeLog: protectedProcedure.query(({ ctx }) => db.listChangeLog(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
