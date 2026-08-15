import { decryptYouTubeCredential } from "./youtubeOAuth";
import { storageGetSignedUrl } from "./storage";

type AuthorizedYouTubeConnection = {
  credentialCiphertext: string | null;
};

type YouTubeUploadInput = {
  storageKey: string;
  title: string;
  description: string;
  tags: string[];
  visibility: "private" | "public";
};

type GoogleRefreshResponse = { access_token?: string; expires_in?: number };
type YouTubeUploadResponse = { id?: string; error?: unknown };
type YouTubeChannelResponse = { items?: Array<{ id?: string; snippet?: { title?: string } }> };

export async function refreshYouTubeAccessToken(connection: AuthorizedYouTubeConnection) {
  if (!connection.credentialCiphertext || !process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
    throw new Error("تفويض YouTube غير مكتمل.");
  }
  const refreshToken = decryptYouTubeCredential(connection.credentialCiphertext);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json()) as GoogleRefreshResponse;
  if (!response.ok || !payload.access_token) throw new Error("تعذّر تجديد تفويض YouTube.");
  return payload.access_token;
}

export async function getAuthenticatedYouTubeChannel(connection: AuthorizedYouTubeConnection) {
  const accessToken = await refreshYouTubeAccessToken(connection);
  const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(20_000),
  });
  const payload = (await response.json()) as YouTubeChannelResponse;
  const channel = payload.items?.[0];
  if (!response.ok || !channel?.id) throw new Error("تعذّر التحقق من قناة YouTube المفوضة.");
  return { id: channel.id, title: channel.snippet?.title || "YouTube Channel" };
}

function createMultipartRelatedBody(input: YouTubeUploadInput, videoBytes: Uint8Array, contentType: string) {
  const boundary = `xdaw-${crypto.randomUUID()}`;
  const metadata = JSON.stringify({
    snippet: { title: input.title, description: input.description, tags: input.tags, categoryId: "27" },
    status: { privacyStatus: input.visibility, selfDeclaredMadeForKids: false },
  });
  const prefix = Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`);
  const suffix = Buffer.from(`\r\n--${boundary}--\r\n`);
  return { boundary, body: Buffer.concat([prefix, Buffer.from(videoBytes), suffix]) };
}

/** Uploads exactly one vetted video. Callers must run publishing guards before invoking this function. */
export async function uploadVettedVideoToYouTube(connection: AuthorizedYouTubeConnection, input: YouTubeUploadInput) {
  const accessToken = await refreshYouTubeAccessToken(connection);
  const signedUrl = await storageGetSignedUrl(input.storageKey);
  const videoResponse = await fetch(signedUrl, { signal: AbortSignal.timeout(90_000) });
  if (!videoResponse.ok) throw new Error("تعذّر قراءة ملف الفيديو من التخزين الآمن.");
  const contentType = videoResponse.headers.get("content-type") || "video/mp4";
  const bytes = new Uint8Array(await videoResponse.arrayBuffer());
  const { boundary, body } = createMultipartRelatedBody(input, bytes, contentType);
  const uploadResponse = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": `multipart/related; boundary=${boundary}` },
    body,
    signal: AbortSignal.timeout(120_000),
  });
  const result = (await uploadResponse.json()) as YouTubeUploadResponse;
  if (!uploadResponse.ok || !result.id) throw new Error("رفض YouTube رفع الفيديو. راجع حالة التفويض أو الحصة.");
  return { videoId: result.id, url: `https://www.youtube.com/watch?v=${result.id}` };
}
