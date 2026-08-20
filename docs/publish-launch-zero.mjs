import * as db from "../server/db.ts";
import { evaluatePublishGuard } from "../server/publishingGuards.ts";
import { sendTelegramOperationalNotification } from "../server/telegram.ts";
import { uploadVettedVideoToYouTube } from "../server/youtubePublisher.ts";

const ownerId = 1;
const projectId = 1;
const assetId = 1;
const title = "XDAW NOVA — Signal Zero | إشارة البداية";
const description = `XDAW NOVA — Signal Zero.

بداية قناة تحمل النور والمعرفة والرحمة والقوة المسؤولة.
هنا نحول الإشارات إلى أفكار أصلية، والمعرفة إلى محتوى واضح، والطموح إلى عمل نافع.

XDAW NOVA — Signal Zero.
A new signal for light, knowledge, mercy, and responsible strength.
We turn signals into original ideas, knowledge into clear content, and ambition into useful work.

#XDAWNOVA #SignalZero #Knowledge #نور #معرفة #ResponsiblePower`;
const tags = ["XDAW NOVA", "xDaw Nova", "Signal Zero", "إكس داو نوفا", "إشارة البداية", "knowledge", "نور", "معرفة", "ethical tech", "digital creativity", "original content", "Arabic English content"];

function publishingMessage(status, fields = {}) {
  const heading = { blocked: "تم منع النشر", failed: "فشل رفع الفيديو", public_uploaded: "تم نشر فيديو عام" }[status];
  return {
    title: heading,
    detail: [fields.videoTitle ? `العنوان: ${fields.videoTitle}` : null, fields.videoId ? `معرّف الفيديو: ${fields.videoId}` : null, fields.url ? `الرابط: ${fields.url}` : null, fields.reason ? `السبب: ${fields.reason}` : null].filter(Boolean).join("\n"),
  };
}

const connections = await db.listChannelConnections(ownerId);
const youtube = connections.find(connection => connection.platform === "youtube" && connection.status === "authorized");
const telegram = connections.find(connection => connection.platform === "telegram" && connection.status === "authorized");
const [project, asset, policy, previousRuns] = await Promise.all([db.getOwnedProject(ownerId, projectId), db.getOwnedAsset(ownerId, assetId), db.getPublishingPolicy(ownerId), db.listPublishingRuns(ownerId)]);

if (!youtube?.credentialCiphertext) throw new Error("YouTube channel is not authorized.");
if (!project) throw new Error("Launch Zero project is not available.");
if (!asset?.storageKey || asset.licenseStatus !== "approved" || asset.safetyStatus !== "clear") throw new Error("Launch Zero asset did not pass rights or safety checks.");

const decision = evaluatePublishGuard(policy, {
  originalContent: /أصلي|original/i.test(asset.licenseType),
  rightsClear: asset.licenseStatus === "approved",
  safetyClear: asset.safetyStatus === "clear",
  previewAcknowledged: Boolean(project.previewAcknowledgedAt),
  hasPrivateCanary: previousRuns.some(run => run.projectId === projectId && run.platform === "youtube" && run.status === "private_uploaded"),
  publicationsInLast24Hours: previousRuns.filter(run => run.status === "public_uploaded" && run.createdAt.getTime() >= Date.now() - 24 * 60 * 60 * 1000).length,
});

if (!decision.allowed || decision.visibility !== "public") {
  const run = await db.createPublishingRun({ ownerId, projectId, platform: "youtube", status: "blocked", visibility: "private", decisionReason: decision.reason, initiatedBy: "user" });
  if (telegram?.externalAccountRef) {
    const message = publishingMessage("blocked", { videoTitle: title, reason: decision.reason });
    const delivery = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, ...message });
    await db.recordNotificationEvent({ ownerId, publishingRunId: run.id, channel: "telegram", eventType: "youtube_blocked", deliveryStatus: delivery.delivered ? "sent" : "failed", detail: delivery.delivered ? message.detail : delivery.reason });
  }
  throw new Error(`Publishing guard blocked Launch Zero: ${decision.reason}`);
}

const run = await db.createPublishingRun({ ownerId, projectId, platform: "youtube", status: "queued", visibility: "public", decisionReason: decision.reason, initiatedBy: "user" });
try {
  const uploaded = await uploadVettedVideoToYouTube(youtube, { storageKey: asset.storageKey, title, description, tags, visibility: "public" });
  await db.updatePublishingRun(ownerId, run.id, { status: "public_uploaded", externalVideoId: uploaded.videoId, externalUrl: uploaded.url });
  await db.markPolicyPublished(ownerId);
  if (telegram?.externalAccountRef) {
    const message = publishingMessage("public_uploaded", { videoTitle: title, videoId: uploaded.videoId, url: uploaded.url });
    const delivery = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, ...message });
    await db.recordNotificationEvent({ ownerId, publishingRunId: run.id, channel: "telegram", eventType: "youtube_public_uploaded", deliveryStatus: delivery.delivered ? "sent" : "failed", detail: delivery.delivered ? message.detail : delivery.reason });
  }
  await db.createChangeLogEntry({ ownerId, category: "workflow", summary: "نشر Launch Zero علنًا", details: `تم نشر الفيديو التجريبي على YouTube: ${uploaded.url}`, actorType: "user" });
  console.log(JSON.stringify({ status: "public_uploaded", videoId: uploaded.videoId, url: uploaded.url }));
} catch (error) {
  await db.updatePublishingRun(ownerId, run.id, { status: "failed" });
  if (telegram?.externalAccountRef) {
    const message = publishingMessage("failed", { videoTitle: title, reason: "تعذّر الرفع ولم تُنفذ إعادة محاولة تلقائية." });
    const delivery = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, ...message });
    await db.recordNotificationEvent({ ownerId, publishingRunId: run.id, channel: "telegram", eventType: "youtube_failed", deliveryStatus: delivery.delivered ? "sent" : "failed", detail: delivery.delivered ? message.detail : delivery.reason });
  }
  throw error;
}
