import { storageGetSignedUrl } from "./storage";

type TikTokUploadInitResponse = {
  data?: { publish_id?: string; upload_url?: string };
  error?: { code?: string; message?: string; log_id?: string };
};

export function buildTikTokSandboxDraftInitPayload(videoSize: number) {
  if (!Number.isSafeInteger(videoSize) || videoSize < 1) throw new Error("حجم فيديو Sandbox غير صالح.");
  return {
    source_info: {
      source: "FILE_UPLOAD",
      video_size: videoSize,
      chunk_size: videoSize,
      total_chunk_count: 1,
    },
  } as const;
}

export async function uploadTikTokSandboxDraft({ accessToken, storageKey }: { accessToken: string; storageKey: string }) {
  const signedUrl = await storageGetSignedUrl(storageKey);
  const videoResponse = await fetch(signedUrl, { signal: AbortSignal.timeout(60_000) });
  if (!videoResponse.ok) throw new Error("تعذّر تنزيل أصل الفيديو المعتمد لاختبار TikTok Sandbox.");
  const videoBytes = Buffer.from(await videoResponse.arrayBuffer());
  if (videoBytes.length < 1 || videoBytes.length > 64 * 1024 * 1024) throw new Error("فيديو Sandbox يجب أن يكون بين 1 بايت و64 ميجابايت.");

  const initResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify(buildTikTokSandboxDraftInitPayload(videoBytes.length)),
    signal: AbortSignal.timeout(30_000),
  });
  const initPayload = (await initResponse.json()) as TikTokUploadInitResponse;
  const publishId = initPayload.data?.publish_id;
  const uploadUrl = initPayload.data?.upload_url;
  if (!initResponse.ok || initPayload.error?.code !== "ok" || !publishId || !uploadUrl) {
    throw new Error(initPayload.error?.message || initPayload.error?.code || "تعذّرت تهيئة مسودة TikTok Sandbox.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoBytes.length),
      "Content-Range": `bytes 0-${videoBytes.length - 1}/${videoBytes.length}`,
    },
    body: videoBytes,
    signal: AbortSignal.timeout(90_000),
  });
  if (!uploadResponse.ok) throw new Error("تعذّر نقل الفيديو إلى مسودة TikTok Sandbox.");
  return { publishId, sizeBytes: videoBytes.length };
}
