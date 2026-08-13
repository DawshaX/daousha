import { readFile } from "node:fs/promises";
import * as db from "../server/db.ts";
import { storagePut } from "../server/storage.ts";

const ownerId = 1;

const parent = await db.createProject({
  ownerId,
  title: "Reel 02 — Verify Before You Share | تحقق قبل المشاركة",
  brief: "فكرة أصلية ثنائية المسار عن التحقق من المعلومات قبل مشاركتها، لإنتاج نسختين كاملتين منفصلتين بالعربية والإنجليزية.",
  targetLanguage: "both",
  contentFormat: "short",
  status: "production",
});

const variants = [
  {
    language: "ar",
    title: "تحقق قبل ما تشارك | Verify Before You Share — Arabic",
    brief: "Reel عربي أصلي: عشر ثوانٍ للتحقق قبل مشاركة أي معلومة.",
    scriptArabic: "قبل ما تشارك أي معلومة، خُد عشر ثواني. اسأل: مين قالها؟ فين الدليل؟ وهل ممكن تضر حد؟ التحقق مش بطء. التحقق قوة. خلّي نورك واعي.",
    scriptEnglish: null,
    localPath: "/home/ubuntu/webdev-static-assets/xdaw-nova-reel02-ar.mp4",
    storageName: "xdaw-nova-reel02-ar.mp4",
    assetTitle: "Reel 02 Arabic — Verify Before You Share",
  },
  {
    language: "en",
    title: "Verify Before You Share — English",
    brief: "Original English Reel: take ten seconds to verify before you share a claim.",
    scriptArabic: null,
    scriptEnglish: "Before you share any claim, take ten seconds. Ask: Who said it? Where is the evidence? Could it harm someone? Verification is not slow. Verification is strength. Let your light be informed.",
    localPath: "/home/ubuntu/webdev-static-assets/xdaw-nova-reel02-en.mp4",
    storageName: "xdaw-nova-reel02-en.mp4",
    assetTitle: "Reel 02 English — Verify Before You Share",
  },
];

const registered = [];
for (const variant of variants) {
  const bytes = await readFile(variant.localPath);
  const stored = await storagePut(`daousha/${ownerId}/reels/reel02/${variant.storageName}`, bytes, "video/mp4");
  const project = await db.createProject({
    ownerId,
    parentProjectId: parent.id,
    title: variant.title,
    brief: variant.brief,
    targetLanguage: variant.language,
    contentFormat: "short",
    status: "approved",
    humanApprovedAt: new Date(),
    scriptArabic: variant.scriptArabic,
    scriptEnglish: variant.scriptEnglish,
  });
  const asset = await db.createAsset({
    ownerId,
    title: variant.assetTitle,
    assetKind: "video",
    storageKey: stored.key,
    storageUrl: stored.url,
    licenseType: "محتوى أصلي XDAW NOVA — original visual, narration, music, and subtitles",
    attribution: "XDAW NOVA original production",
    licenseStatus: "approved",
    safetyStatus: "clear",
  });
  await db.linkOwnedAssetToProject(ownerId, project.id, asset.id, "primary");
  await db.acknowledgeProjectPreview(ownerId, project.id);
  registered.push({ language: variant.language, projectId: project.id, assetId: asset.id, storageKey: stored.key });
}

await db.updatePublishingPolicy(ownerId, {
  mode: "guarded_auto",
  publicPublishingEnabled: true,
  killSwitchEnabled: false,
  requirePrivateCanary: true,
  minIntervalMinutes: 10,
  maxPublicationsPerDay: 144,
  dailyShortTarget: 4,
  dailyLongTarget: 2,
});

await db.createChangeLogEntry({
  ownerId,
  category: "workflow",
  summary: "تسجيل حزمة Reel 02 المنفصلة",
  details: `مشروع أب ${parent.id} ونسختان معتمدتان منفصلتان: ${registered.map(item => `${item.language}:${item.projectId}`).join(" | ")}.`,
  actorType: "user",
});

console.log(JSON.stringify({ parentProjectId: parent.id, variants: registered }));
