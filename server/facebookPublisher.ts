import { ENV } from "./_core/env";
import { classifyFacebookTokenFailure, facebookTokenStateMessage } from "./facebookTokenStatus";
import { storageGetSignedUrl } from "./storage";
import { decryptFacebookPageAccessToken } from "./facebookOAuth";

type AuthorizedFacebookConnection = {
  externalAccountRef: string | null;
  status: string;
  credentialCiphertext?: string | null;
};

type FacebookUploadInput = {
  storageKey: string;
  title: string;
  description: string;
  visibility: "private" | "public";
};

type MetaIdentity = { id?: string; name?: string; error?: { message?: string; code?: number; error_subcode?: number } };
type MetaVideoResponse = { id?: string; error?: { message?: string } };

function selectedPageToken(connection: AuthorizedFacebookConnection) {
  if (connection.credentialCiphertext) return decryptFacebookPageAccessToken(connection.credentialCiphertext);
  if (ENV.facebookPageAccessToken) return ENV.facebookPageAccessToken;
  throw new Error("رمز وصول صفحة Facebook غير مهيأ.");
}

async function verifyPageIdentity(pageId: string, accessToken: string) {
  const response = await fetch(`https://graph.facebook.com/v26.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`, {
    signal: AbortSignal.timeout(15_000),
  });
  const payload = await response.json() as MetaIdentity;
  if (!response.ok) {
    const state = classifyFacebookTokenFailure({ httpStatus: response.status, errorCode: payload.error?.code, errorSubcode: payload.error?.error_subcode });
    throw new Error(facebookTokenStateMessage(state));
  }
  if (!payload.id || payload.id !== pageId) {
    throw new Error(facebookTokenStateMessage("mismatch"));
  }
  return payload;
}

/** Read-only identity verification for the authorized Facebook Page. Never uploads or publishes content. */
export async function verifyAuthorizedFacebookPage(connection: AuthorizedFacebookConnection) {
  if (connection.status !== "authorized" || !connection.externalAccountRef) {
    throw new Error("صفحة Facebook غير مفوضة للمراقبة.");
  }
  return verifyPageIdentity(connection.externalAccountRef, selectedPageToken(connection));
}

/**
 * Uploads one vetted video to the selected Facebook Page.
 * The caller must complete rights, safety, preview, and pre-schedule approval guards first.
 */
export async function uploadVettedVideoToFacebookPage(connection: AuthorizedFacebookConnection, input: FacebookUploadInput) {
  if (connection.status !== "authorized" || !connection.externalAccountRef) {
    throw new Error("صفحة Facebook غير مفوضة للنشر.");
  }

  const accessToken = selectedPageToken(connection);
  await verifyAuthorizedFacebookPage(connection);
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
  form.set("access_token", accessToken);

  const uploadResponse = await fetch(`https://graph.facebook.com/v26.0/${encodeURIComponent(connection.externalAccountRef)}/videos`, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(120_000),
  });
  const payload = await uploadResponse.json() as MetaVideoResponse;
  if (!uploadResponse.ok || !payload.id) throw new Error(payload.error?.message || "رفض Facebook رفع الفيديو.");
  return { videoId: payload.id, url: `https://www.facebook.com/watch/?v=${payload.id}` };
}
