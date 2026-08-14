import { ENV } from "./_core/env";
import { storageGetSignedUrl } from "./storage";

type AuthorizedFacebookConnection = {
  externalAccountRef: string | null;
  status: string;
};

type FacebookUploadInput = {
  storageKey: string;
  title: string;
  description: string;
  visibility: "private" | "public";
};

type MetaIdentity = { id?: string; name?: string; error?: { message?: string } };
type MetaVideoResponse = { id?: string; error?: { message?: string } };

async function verifyPageIdentity(pageId: string) {
  if (!ENV.facebookPageAccessToken) throw new Error("رمز وصول صفحة Facebook غير مهيأ.");
  const response = await fetch(`https://graph.facebook.com/v26.0/me?fields=id,name&access_token=${encodeURIComponent(ENV.facebookPageAccessToken)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json() as MetaIdentity;
  if (!response.ok || !payload.id || payload.id !== pageId) {
    throw new Error("رمز Facebook لا يطابق صفحة XDAW NOVA المفوضة.");
  }
  return payload;
}

/**
 * Uploads one vetted video to the selected Facebook Page.
 * The caller must complete rights, safety, preview and public-confirmation guards first.
 */
export async function uploadVettedVideoToFacebookPage(connection: AuthorizedFacebookConnection, input: FacebookUploadInput) {
  if (connection.status !== "authorized" || !connection.externalAccountRef) {
    throw new Error("صفحة Facebook غير مفوضة للنشر.");
  }

  await verifyPageIdentity(connection.externalAccountRef);
  const signedUrl = await storageGetSignedUrl(input.storageKey);
  const videoResponse = await fetch(signedUrl, { signal: AbortSignal.timeout(90_000) });
  if (!videoResponse.ok) throw new Error("تعذّر قراءة ملف الفيديو من التخزين الآمن.");

  const contentType = videoResponse.headers.get("content-type") || "video/mp4";
  const videoBlob = new Blob([await videoResponse.arrayBuffer()], { type: contentType });
  const form = new FormData();
  form.set("source", videoBlob, "xdaw-nova.mp4");
  form.set("title", input.title);
  form.set("description", input.description);
  form.set("published", input.visibility === "public" ? "true" : "false");
  form.set("access_token", ENV.facebookPageAccessToken);

  const uploadResponse = await fetch(`https://graph.facebook.com/v26.0/${encodeURIComponent(connection.externalAccountRef)}/videos`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await uploadResponse.json() as MetaVideoResponse;
  if (!uploadResponse.ok || !payload.id) throw new Error(payload.error?.message || "رفض Facebook رفع الفيديو.");
  return { videoId: payload.id, url: `https://www.facebook.com/watch/?v=${payload.id}` };
}
