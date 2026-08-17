import * as db from "./db";
import { evaluatePublishGuard } from "./publishingGuards";
import { notifyOwnerOperationalEvent } from "./operationalNotifications";
import { describeUploadFailure } from "./uploadFailureDetail";
import { uploadVettedVideoToYouTube } from "./youtubePublisher";
import { publishVettedInstagramReel } from "./instagramPublisher";
import { uploadVettedVideoToFacebookPage } from "./facebookPublisher";

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
  const platform = schedule.platform.toLowerCase();
  if (platform !== "youtube" && platform !== "instagram" && platform !== "facebook") {
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "needs_approval");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, eventType: "schedule_needs_review", title: "جدولة تحتاج مراجعة", detail: `المنصة ${schedule.platform} غير مفعلة للنشر الدوري. أوقفت الجدولة حتى مراجعتها.` });
    return { ok: true, skipped: "platform_not_connected" as const, scheduleId: schedule.id };
  }

  const channelHealth = await db.getConnectionHealthMonitor(schedule.ownerId, platform);
  if (!channelHealth?.lastCheckedAt || channelHealth.status !== "healthy") {
    const detail = !channelHealth?.lastCheckedAt
      ? `قناة ${platform} تنتظر فحص الصحة المجدول الأول.`
      : `قناة ${platform} ليست سليمة للنشر الذاتي حاليًا (${channelHealth.status}).`;
    await db.createPublishingRun({ ownerId: schedule.ownerId, projectId: schedule.projectId, platform, status: "skipped", visibility: "private", decisionReason: detail, initiatedBy: "scheduled_job" });
    return { ok: true, skipped: "channel_not_healthy" as const, scheduleId: schedule.id, reason: detail };
  }

  const [policy, runs, connections, assets] = await Promise.all([
    db.getPublishingPolicy(schedule.ownerId),
    db.listPublishingRuns(schedule.ownerId),
    db.listChannelConnections(schedule.ownerId),
    db.listOwnedProjectVideoAssets(schedule.ownerId),
  ]);
  const linked = assets.find(item => item.project.id === schedule.projectId && item.link.clipRole === "primary") ?? assets.find(item => item.project.id === schedule.projectId);
  if (!linked) {
    await db.createPublishingRun({ ownerId: schedule.ownerId, projectId: schedule.projectId, platform: platform as "youtube" | "instagram" | "facebook", status: "blocked", visibility: "private", decisionReason: "لا توجد مادة فيديو مرتبطة بالمشروع المجدول.", initiatedBy: "scheduled_job" });
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "needs_approval");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, eventType: "schedule_needs_review", title: "جدولة تحتاج مادة", detail: "أوقفت الجدولة لأن المشروع لا يملك فيديو مرتبطًا ومعتمدًا." });
    return { ok: true, skipped: "missing_video" as const, scheduleId: schedule.id };
  }
  if (runs.some(run => run.projectId === schedule.projectId && run.platform === platform && run.status === "public_uploaded")) {
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "paused");
    return { ok: true, skipped: "already_published" as const, scheduleId: schedule.id };
  }
  const youtube = connections.find(connection => connection.platform === "youtube" && connection.status === "authorized");
  const instagram = connections.find(connection => connection.platform === "instagram" && connection.status === "authorized" && connection.scopeSummary?.includes("instagram_business_content_publish"));
  const facebook = connections.find(connection => connection.platform === "facebook" && connection.status === "authorized" && connection.externalAccountRef && connection.credentialCiphertext);
  const destination = platform === "youtube" ? youtube : platform === "instagram" ? instagram : facebook;
  const privateCanary = runs.some(run => run.projectId === linked.project.id && run.platform === "youtube" && run.status === "private_uploaded");
  const decision = evaluatePublishGuard(policy, {
    originalContent: /أصلي|original/i.test(linked.asset.licenseType),
    rightsClear: linked.asset.licenseStatus === "approved",
    safetyClear: linked.asset.safetyStatus === "clear",
    previewAcknowledged: Boolean(linked.project.previewAcknowledgedAt),
    hasPrivateCanary: privateCanary,
    publicationsInLast24Hours: runs.filter(run => run.status === "public_uploaded" && run.createdAt.getTime() >= Date.now() - 24 * 60 * 60 * 1000).length,
  });
  if (!decision.allowed || !destination?.credentialCiphertext || !linked.asset.storageKey || (platform === "instagram" && decision.visibility !== "public")) {
    const platformLabel = platform === "instagram" ? "Instagram API" : platform === "facebook" ? "صفحة Facebook" : "YouTube";
    const reason = !decision.allowed ? decision.reason : !destination?.credentialCiphertext ? `حساب ${platformLabel} غير مرتبط رسميًا.` : !linked.asset.storageKey ? "ملف الفيديو غير محفوظ داخل التخزين الآمن." : "Instagram لا يدعم Canary خاصًا؛ أنشئ Canary خاصًا على YouTube أولًا ثم أعد جدولة Reel العام.";
    await db.createPublishingRun({ ownerId: schedule.ownerId, projectId: linked.project.id, platform: platform as "youtube" | "instagram" | "facebook", status: "blocked", visibility: "private", decisionReason: reason, initiatedBy: "scheduled_job" });
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "needs_approval");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, eventType: "schedule_needs_review", title: "حاجز النشر أوقف الجدولة", detail: reason });
    return { ok: true, skipped: "guard_blocked" as const, scheduleId: schedule.id, reason };
  }

  const run = await db.createPublishingRun({ ownerId: schedule.ownerId, projectId: linked.project.id, platform: platform as "youtube" | "instagram" | "facebook", status: "queued", visibility: decision.visibility, decisionReason: decision.reason, initiatedBy: "scheduled_job" });
  try {
    const metadata = automaticMetadata(linked.project);
    const uploaded = platform === "youtube"
      ? await uploadVettedVideoToYouTube(youtube!, { storageKey: linked.asset.storageKey, ...metadata, visibility: decision.visibility })
      : platform === "instagram"
        ? await publishVettedInstagramReel(instagram!, { storageKey: linked.asset.storageKey, caption: `${metadata.title}\n\n${metadata.description}` })
        : await uploadVettedVideoToFacebookPage(facebook!, { storageKey: linked.asset.storageKey, title: metadata.title, description: metadata.description, visibility: decision.visibility });
    const status = decision.visibility === "public" ? "public_uploaded" : "private_uploaded";
    const externalVideoId = "videoId" in uploaded ? uploaded.videoId : uploaded.reelId;
    const completed = await db.updatePublishingRun(schedule.ownerId, run.id, { status, externalVideoId, externalUrl: uploaded.url });
    if (decision.visibility === "public") {
      await Promise.all([db.markPolicyPublished(schedule.ownerId), db.markProjectPublished(schedule.ownerId, linked.project.id), db.setScheduleStatus(schedule.ownerId, schedule.id, "paused")]);
    }
    const identifierLabel = platform === "youtube" ? "معرّف الفيديو" : platform === "instagram" ? "معرّف Reel" : "معرّف فيديو Facebook";
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, publishingRunId: run.id, eventType: `scheduled_${platform}_upload`, title: `دورة XDAW NOVA: رفع ${decision.visibility === "public" ? "عام" : "خاص"}`, detail: `${linked.project.title}\n${identifierLabel}: ${externalVideoId}\n${uploaded.url ?? "تم النشر دون رابط دائم متاح من المزود."}` });
    return { ok: true, published: true, scheduleId: schedule.id, run: completed, url: uploaded.url, visibility: decision.visibility };
  } catch (error) {
    await db.updatePublishingRun(schedule.ownerId, run.id, { status: "failed" });
    await db.setScheduleStatus(schedule.ownerId, schedule.id, "failed");
    await notifyOwnerOperationalEvent({ ownerId: schedule.ownerId, publishingRunId: run.id, eventType: `scheduled_${platform}_failed`, title: "تعثر نشر مجدول", detail: `تعذر رفع مشروع «${linked.project.title}». سبب التعثر: ${describeUploadFailure(error)}. أوقفت الجدولة ولم تبدأ إعادة محاولة تلقائية.` });
    throw error;
  }
}
