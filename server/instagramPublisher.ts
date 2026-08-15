import { storageGetSignedUrl } from "./storage";
import { getAuthenticatedInstagramProfile, type AuthorizedInstagramConnection } from "./instagramOAuth";

type InstagramReelInput = { storageKey: string; caption: string };
type MediaContainerPayload = { id?: string; error?: { message?: string } };
type MediaStatusPayload = { status_code?: "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED"; error?: { message?: string } };
type PublishPayload = { id?: string; error?: { message?: string } };
type PermalinkPayload = { permalink?: string };

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

/** Publishes one vetted Reel only after caller-side rights, safety, preview, policy, and canary guards. */
export async function publishVettedInstagramReel(connection: AuthorizedInstagramConnection & { externalAccountRef?: string | null }, input: InstagramReelInput) {
  const profile = await getAuthenticatedInstagramProfile(connection);
  if (connection.externalAccountRef && connection.externalAccountRef !== profile.id) throw new Error("الحساب المفوض لا يطابق حساب Instagram المسجل.");
  const videoUrl = await storageGetSignedUrl(input.storageKey);
  const createUrl = new URL(`https://graph.instagram.com/v24.0/${profile.id}/media`);
  const createResponse = await fetch(createUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ media_type: "REELS", video_url: videoUrl, caption: input.caption.slice(0, 2200), share_to_feed: "true", access_token: profile.accessToken }),
    signal: AbortSignal.timeout(30_000),
  });
  const container = await createResponse.json() as MediaContainerPayload;
  if (!createResponse.ok || !container.id) throw new Error(container.error?.message ?? "تعذّر إنشاء حاوية Reel في Instagram.");

  const statusUrl = new URL(`https://graph.instagram.com/v24.0/${container.id}`);
  statusUrl.search = new URLSearchParams({ fields: "status_code", access_token: profile.accessToken }).toString();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const statusResponse = await fetch(statusUrl, { signal: AbortSignal.timeout(20_000) });
    const status = await statusResponse.json() as MediaStatusPayload;
    if (!statusResponse.ok || status.status_code === "ERROR" || status.status_code === "EXPIRED") throw new Error(status.error?.message ?? "رفض Instagram معالجة Reel.");
    if (status.status_code === "FINISHED" || status.status_code === "PUBLISHED") break;
    if (attempt === 7) throw new Error("لم تكتمل معالجة Reel في Instagram ضمن مهلة النشر المحكومة.");
    await wait(15_000);
  }

  const publishUrl = new URL(`https://graph.instagram.com/v24.0/${profile.id}/media_publish`);
  const publishResponse = await fetch(publishUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ creation_id: container.id, access_token: profile.accessToken }),
    signal: AbortSignal.timeout(30_000),
  });
  const published = await publishResponse.json() as PublishPayload;
  if (!publishResponse.ok || !published.id) throw new Error(published.error?.message ?? "رفض Instagram نشر Reel.");
  const permalinkUrl = new URL(`https://graph.instagram.com/v24.0/${published.id}`);
  permalinkUrl.search = new URLSearchParams({ fields: "permalink", access_token: profile.accessToken }).toString();
  const permalinkResponse = await fetch(permalinkUrl, { signal: AbortSignal.timeout(20_000) });
  const permalink = permalinkResponse.ok ? await permalinkResponse.json() as PermalinkPayload : {};
  return { reelId: published.id, url: permalink.permalink };
}
