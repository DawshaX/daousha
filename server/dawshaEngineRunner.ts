import * as db from "./db";
import { fetchGoogleTrendSignals, type TrendSignal } from "./trendRadar";

const MIN_INTAKE_INTERVAL_MS = 20 * 60 * 60 * 1_000;

function normalizedTitle(value: string) {
  return value.trim().toLocaleLowerCase();
}

function selectNewSignal(signals: TrendSignal[], existingTitles: Set<string>) {
  return signals.find(signal => !existingTitles.has(normalizedTitle(signal.title)));
}

/**
 * Idempotent Heartbeat executor. It may create at most one research project in
 * a 20-hour window and never generates media, fetches third-party assets, or publishes.
 */
export async function executeDawshaEngine(taskUid: string) {
  const monitor = await db.getDawshaEngineMonitorByTaskUid(taskUid);
  if (!monitor || monitor.status === "paused") return { ok: true, skipped: "orphan_or_paused" as const };
  const now = Date.now();
  if (monitor.lastRunAt && now - monitor.lastRunAt.getTime() < MIN_INTAKE_INTERVAL_MS) {
    return { ok: true, skipped: "intake_interval" as const, summary: "محرك DAWSHA يعمل بحد إنشاء مشروع واحد خلال 20 ساعة؛ لم يبدأ دورة جديدة." };
  }

  const [egyptResult, usResult, projects] = await Promise.allSettled([fetchGoogleTrendSignals("EG"), fetchGoogleTrendSignals("US"), db.listProjects(monitor.ownerId)]);
  const signals = [egyptResult, usResult].flatMap(result => result.status === "fulfilled" ? result.value : []);
  if (!signals.length) {
    const summary = "لم تصل إشارة Google Trends قابلة للاستخدام في هذه الدورة؛ لم يُنشأ مشروع أو سكربت أو وسائط أو نشر.";
    await db.updateDawshaEngineMonitorRun(monitor.id, { status: "error", summary });
    return { ok: true, status: "error" as const, summary };
  }
  if (projects.status !== "fulfilled") throw projects.reason;
  const existingTitles = new Set(projects.value.map(project => normalizedTitle(project.title.replace(/^إشارة ترند قابلة للمراجعة —\s*/, ""))));
  const signal = selectNewSignal(signals, existingTitles);
  if (!signal) {
    const summary = "كل إشارات الدورة الحالية مسجلة سابقًا؛ لم يُنشأ مشروع مكرر أو سكربت أو وسائط أو نشر.";
    await db.updateDawshaEngineMonitorRun(monitor.id, { status: "active", summary });
    return { ok: true, status: "active" as const, skipped: "duplicate_signal" as const, summary };
  }

  const title = `إشارة ترند قابلة للمراجعة — ${signal.title}`.slice(0, 255);
  const pipeline = await db.createDawshaPipeline({
    ownerId: monitor.ownerId,
    title,
    targetLanguage: "both",
    trendSourceUrl: signal.sourceUrl,
    brief: `إشارة من ${signal.sourceName}. تقدير الاهتمام: ${signal.approximateTraffic ?? "غير متاح"}. تُستخدم كفكرة بحث فقط؛ لا تُعد تصريحًا لنسخ محتوى أو ادعاءات أو إنتاج أو نشر.`,
  });
  const summary = `سُجلت إشارة «${signal.title}» كمشروع #${pipeline.project.id} في مرحلة البحث. السكربت ينتظر دورة مقيدة لاحقة، والحقوق والسلامة والإنتاج والنشر ما زالت محجوبة.`;
  await db.updateDawshaEngineMonitorRun(monitor.id, { status: "active", summary, projectId: pipeline.project.id, signalTitle: signal.title });
  await db.createChangeLogEntry({ ownerId: monitor.ownerId, category: "workflow", summary: "DAWSHA Heartbeat: إدخال إشارة ترند", details: summary, actorType: "scheduled_job" });
  return { ok: true, status: "active" as const, projectId: pipeline.project.id, taskCount: pipeline.tasks.length, summary };
}
