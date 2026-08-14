import * as db from "./db";
import { evaluatePublishGuard } from "./publishingGuards";
import { notifyOwnerOperationalEvent } from "./operationalNotifications";
import { uploadVettedVideoToYouTube } from "./youtubePublisher";

function automaticMetadata(project: { title: string; brief: string | null; scriptArabic: string | null; scriptEnglish: string | null; contentFormat: "short" | "long" }) {
  const summary = project.brief || project.scriptArabic || project.scriptEnglish || "Original bilingual content by XDAW NOVA.";
  return {
    title: project.title.slice(0, 100),
    description: `${summary.slice(0, 4500)}\n\nXDAW NOVA — original bilingual content.`,
    tags: project.contentFormat === "short" ? ["XDAWNOVA", "Shorts", "OriginalContent", "نور", "Knowledge"] : ["XDAWNOVA", "OriginalContent", "Knowledge"],
  };
}

/** Idempotent execution: one active schedule may upload a vetted project once, then becomes locally paused. */
export async function executeScheduledPublish(taskUid: string) {
  const schedule = await db.getScheduleByTaskUid(taskUid);
  if (!schedule) return { ok: true, skipped: "orphan" as const };
  if (schedule.status !== "active") return { ok: true, skipped: "inactive" as const, scheduleId: schedule.id };
  await db.markScheduleExecuted(schedule.ownerId, schedule.id);
  if (schedule.platform.toLowerCase() !== "youtube") {
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "needs_approval");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, eventType: "schedule_needs_review", title: "جدولة تحتاج مراجعة", detail: `المنصة ${schedule.platform} غير مفعلة للنشر الدوري. أوقفت الجدولة حتى مراجعتها.` });
    return { ok: true, skipped: "platform_not_connected" as const, scheduleId: schedule.id };
  }

  const [policy, runs, connections, assets] = await Promise.all([
    db.getPublishingPolicy(schedule.ownerId),
    db.listPublishingRuns(schedule.ownerId),
    db.listChannelConnections(schedule.ownerId),
    db.listOwnedProjectVideoAssets(schedule.ownerId),
  ]);
  const linked = assets.find(item => item.project.id === schedule.projectId && item.link.clipRole === "primary") ?? assets.find(item => item.project.id === schedule.projectId);
  if (!linked) {
    await db.createPublishingRun({ ownerId: schedule.ownerId, projectId: schedule.projectId, platform: "youtube", status: "blocked", visibility: "private", decisionReason: "لا توجد مادة فيديو مرتبطة بالمشروع المجدول.", initiatedBy: "scheduled_job" });
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "needs_approval");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, eventType: "schedule_needs_review", title: "جدولة تحتاج مادة", detail: "أوقفت الجدولة لأن المشروع لا يملك فيديو مرتبطًا ومعتمدًا." });
    return { ok: true, skipped: "missing_video" as const, scheduleId: schedule.id };
  }
  if (runs.some(run => run.projectId === schedule.projectId && run.platform === "youtube" && run.status === "public_uploaded")) {
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "paused");
    return { ok: true, skipped: "already_published" as const, scheduleId: schedule.id };
  }
  const youtube = connections.find(connection => connection.platform === "youtube" && connection.status === "authorized");
  const privateCanary = runs.some(run => run.projectId === linked.project.id && run.platform === "youtube" && run.status === "private_uploaded");
  const decision = evaluatePublishGuard(policy, {
    originalContent: /أصلي|original/i.test(linked.asset.licenseType),
    rightsClear: linked.asset.licenseStatus === "approved",
    safetyClear: linked.asset.safetyStatus === "clear",
    previewAcknowledged: Boolean(linked.project.previewAcknowledgedAt),
    hasPrivateCanary: privateCanary,
    publicationsInLast24Hours: runs.filter(run => run.status === "public_uploaded" && run.createdAt.getTime() >= Date.now() - 24 * 60 * 60 * 1000).length,
  });
  if (!decision.allowed || !youtube?.credentialCiphertext || !linked.asset.storageKey) {
    const reason = !decision.allowed ? decision.reason : !youtube?.credentialCiphertext ? "قناة YouTube غير مرتبطة رسميًا." : "ملف الفيديو غير محفوظ داخل التخزين الآمن.";
    await db.createPublishingRun({ ownerId: schedule.ownerId, projectId: linked.project.id, platform: "youtube", status: "blocked", visibility: "private", decisionReason: reason, initiatedBy: "scheduled_job" });
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "needs_approval");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, eventType: "schedule_needs_review", title: "حاجز النشر أوقف الجدولة", detail: reason });
    return { ok: true, skipped: "guard_blocked" as const, scheduleId: schedule.id, reason };
  }

  const run = await db.createPublishingRun({ ownerId: schedule.ownerId, projectId: linked.project.id, platform: "youtube", status: "queued", visibility: decision.visibility, decisionReason: decision.reason, initiatedBy: "scheduled_job" });
  try {
    const uploaded = await uploadVettedVideoToYouTube(youtube, { storageKey: linked.asset.storageKey, ...automaticMetadata(linked.project), visibility: decision.visibility });
    const status = decision.visibility === "public" ? "public_uploaded" : "private_uploaded";
    const completed = await db.updatePublishingRun(schedule.ownerId, run.id, { status, externalVideoId: uploaded.videoId, externalUrl: uploaded.url });
    if (decision.visibility === "public") {
      await Promise.all([db.markPolicyPublished(schedule.ownerId), db.markProjectPublished(schedule.ownerId, linked.project.id), db.setScheduleStatus(schedule.ownerId, schedule.id, "paused")]);
    }
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, publishingRunId: run.id, eventType: "scheduled_youtube_upload", title: `دورة XDAW NOVA: رفع ${decision.visibility === "public" ? "عام" : "خاص"}`, detail: `${linked.project.title}\n${uploaded.url}` });
    return { ok: true, published: true, scheduleId: schedule.id, run: completed, url: uploaded.url, visibility: decision.visibility };
  } catch (error) {
    await db.updatePublishingRun(schedule.ownerId, run.id, { status: "failed" });
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "failed");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, publishingRunId: run.id, eventType: "scheduled_youtube_failed", title: "تعثر نشر مجدول", detail: `تعذر رفع مشروع «${linked.project.title}». أوقفت الجدولة ولم تبدأ إعادة محاولة تلقائية.` });
    throw error;
  }
}
