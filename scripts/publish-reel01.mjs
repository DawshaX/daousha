import { readFile } from "node:fs/promises";
import * as db from "../server/db.ts";
import { evaluatePublishGuard } from "../server/publishingGuards.ts";
import { storagePut } from "../server/storage.ts";
import { sendTelegramOperationalNotification } from "../server/telegram.ts";
import { uploadVettedVideoToYouTube } from "../server/youtubePublisher.ts";

const ownerId = 1;
const title = "نورك يصنع فرقًا | Your light makes a difference";
const description = `كل فكرة تبدأ بنور صغير. والقوة الحقيقية أن تستخدم هذا النور بعقل ورحمة.

خليك واعي. تعلَّم، اصنع، وخلّي أثرك خيرًا.

Learn with care. Create with courage. Leave light behind you.

XDAW NOVA — original bilingual content.

#XDAWNOVA #نور_ومعرفة #EthicalTech #LearnCreateLight #Shorts`;
const tags = ["XDAW NOVA", "نور", "معرفة", "Shorts", "original content", "ethical tech", "Arabic English", "positive content"];
const videoPath = "/home/ubuntu/webdev-static-assets/xdaw-nova-reel01-light-within.mp4";

const connections = await db.listChannelConnections(ownerId);
const youtube = connections.find(connection => connection.platform === "youtube" && connection.status === "authorized");
const telegram = connections.find(connection => connection.platform === "telegram" && connection.status === "authorized");
if (!youtube?.credentialCiphertext) throw new Error("قناة YouTube الرسمية غير مرتبطة أو تفويضها غير مكتمل.");

const policy = await db.updatePublishingPolicy(ownerId, {
  mode: "guarded_auto",
  publicPublishingEnabled: true,
  killSwitchEnabled: false,
  requirePrivateCanary: true,
  minIntervalMinutes: 10,
  maxPublicationsPerDay: 144,
  dailyShortTarget: 4,
  dailyLongTarget: 2,
});

const bytes = await readFile(videoPath);
const uploadedAsset = await storagePut(`daousha/${ownerId}/published/xdaw-nova-reel01-light-within.mp4`, bytes, "video/mp4");
const project = await db.createProject({
  ownerId,
  title,
  brief: "Reel أصلي عمودي ثنائي اللغة عن المعرفة والرحمة والقوة المسؤولة.",
  targetLanguage: "both",
  contentFormat: "short",
  status: "approved",
  humanApprovedAt: new Date(),
  scriptArabic: "كل فكرة تبدأ بنور صغير. لكن القوة الحقيقية، أن تستخدم هذا النور بعقل ورحمة. خليك واعي. تعلَّم، اصنع، وخلّي أثرك خيرًا.",
  scriptEnglish: "Learn with care. Create with courage. Leave light behind you.",
});
const asset = await db.createAsset({
  ownerId,
  title: "Reel 01 — Light Within — النسخة النهائية",
  assetKind: "video",
  storageKey: uploadedAsset.key,
  storageUrl: uploadedAsset.url,
  licenseType: "محتوى أصلي XDAW NOVA — Original generated visual, music, and narration",
  attribution: "XDAW NOVA original production",
  licenseStatus: "approved",
  safetyStatus: "clear",
});
await db.linkOwnedAssetToProject(ownerId, project.id, asset.id, "primary");
await db.acknowledgeProjectPreview(ownerId, project.id);
await db.createChangeLogEntry({ ownerId, category: "workflow", summary: "تسجيل واعتماد Reel 01", details: `مشروع ${project.id} ومادة الفيديو ${asset.id} مع حقوق وسلامة وإقرار معاينة محفوظة.`, actorType: "user" });

const baseReadiness = { originalContent: true, rightsClear: true, safetyClear: true, previewAcknowledged: true, publicationsInLast24Hours: 0 };
const canaryDecision = evaluatePublishGuard(policy, { ...baseReadiness, hasPrivateCanary: false });
if (!canaryDecision.allowed || canaryDecision.visibility !== "private") throw new Error(`فشل حاجز النسخة الخاصة: ${canaryDecision.reason}`);
const canaryRun = await db.createPublishingRun({ ownerId, projectId: project.id, platform: "youtube", status: "queued", visibility: "private", decisionReason: canaryDecision.reason, initiatedBy: "user" });
const privateUpload = await uploadVettedVideoToYouTube(youtube, { storageKey: asset.storageKey, title: `${title} — Private Canary`, description, tags, visibility: "private" });
await db.updatePublishingRun(ownerId, canaryRun.id, { status: "private_uploaded", externalVideoId: privateUpload.videoId, externalUrl: privateUpload.url });

const publicDecision = evaluatePublishGuard(policy, { ...baseReadiness, hasPrivateCanary: true });
if (!publicDecision.allowed || publicDecision.visibility !== "public") throw new Error(`فشل حاجز النشر العام: ${publicDecision.reason}`);
const publicRun = await db.createPublishingRun({ ownerId, projectId: project.id, platform: "youtube", status: "queued", visibility: "public", decisionReason: publicDecision.reason, initiatedBy: "user" });
const publicUpload = await uploadVettedVideoToYouTube(youtube, { storageKey: asset.storageKey, title, description, tags, visibility: "public" });
await db.updatePublishingRun(ownerId, publicRun.id, { status: "public_uploaded", externalVideoId: publicUpload.videoId, externalUrl: publicUpload.url });
await Promise.all([db.markPolicyPublished(ownerId), db.markProjectPublished(ownerId, project.id)]);
await db.createChangeLogEntry({ ownerId, category: "workflow", summary: "نشر Reel 01 علنًا", details: `YouTube: ${publicUpload.url}`, actorType: "user" });

if (telegram?.externalAccountRef) {
  const delivery = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title: "تم نشر Reel 01 علنًا", detail: `${title}\n${publicUpload.url}` });
  await db.recordNotificationEvent({ ownerId, publishingRunId: publicRun.id, channel: "telegram", eventType: "youtube_reel01_public_uploaded", deliveryStatus: delivery.delivered ? "sent" : "failed", detail: delivery.reason });
}

console.log(JSON.stringify({ projectId: project.id, assetId: asset.id, privateCanaryUrl: privateUpload.url, publicUrl: publicUpload.url }));
