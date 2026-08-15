import { randomBytes } from "crypto";
import type { Express, Request } from "express";
import { parse as parseCookie } from "cookie";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import * as db from "./db";
import { decryptYouTubeCredential, encryptYouTubeCredential } from "./youtubeOAuth";

const OAUTH_STATE_COOKIE = "xdaw_instagram_oauth_state";
export const INSTAGRAM_BACKGROUND_SCOPES = ["instagram_business_basic", "instagram_business_content_publish"] as const;

type ShortTokenPayload = {
  data?: Array<{ access_token?: string; user_id?: string; permissions?: string | string[] }>;
  access_token?: string;
  user_id?: string;
  error_message?: string;
};

type LongTokenPayload = { access_token?: string; expires_in?: number; error?: { message?: string } };
type InstagramProfilePayload = { id?: string; username?: string; error?: { message?: string } };

function cookieOptions(req: Request) {
  const forwardedProtocol = req.header("x-forwarded-proto")?.split(",")[0];
  return { httpOnly: true, sameSite: "lax" as const, secure: req.secure || forwardedProtocol === "https", maxAge: 10 * 60 * 1000, path: "/" };
}

export function getInstagramRedirectUri(req: Request) {
  const protocol = req.header("x-forwarded-proto")?.split(",")[0] ?? req.protocol;
  const host = req.header("x-forwarded-host") ?? req.header("host");
  if (!host) throw new Error("تعذّر تحديد عنوان إعادة التوجيه لـ Instagram.");
  return `${protocol}://${host}/api/integrations/instagram/callback`;
}

export function buildInstagramAuthorizationUrl(appId: string, redirectUri: string, state: string) {
  const authorizationUrl = new URL("https://www.instagram.com/oauth/authorize");
  authorizationUrl.search = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: INSTAGRAM_BACKGROUND_SCOPES.join(","),
    enable_fb_login: "false",
    force_reauth: "true",
    state,
  }).toString();
  return authorizationUrl.toString();
}

export type AuthorizedInstagramConnection = {
  credentialCiphertext: string | null;
  credentialExpiresAt?: Date | null;
};

export async function refreshInstagramLongLivedAccessToken(connection: AuthorizedInstagramConnection) {
  if (!connection.credentialCiphertext) throw new Error("تفويض Instagram غير مكتمل.");
  const accessToken = decryptYouTubeCredential(connection.credentialCiphertext);
  const refreshUrl = new URL("https://graph.instagram.com/refresh_access_token");
  refreshUrl.search = new URLSearchParams({ grant_type: "ig_refresh_token", access_token: accessToken }).toString();
  const response = await fetch(refreshUrl, { signal: AbortSignal.timeout(20_000) });
  const payload = await response.json() as LongTokenPayload;
  if (!response.ok || !payload.access_token || !payload.expires_in) throw new Error(payload.error?.message ?? "تعذّر تجديد رمز Instagram طويل الأجل.");
  return { accessToken: payload.access_token, expiresAt: new Date(Date.now() + payload.expires_in * 1000) };
}

export function instagramTokenNeedsRefresh(expiresAt?: Date | null, now = Date.now()) {
  return Boolean(expiresAt && expiresAt.getTime() - now <= 14 * 24 * 60 * 60 * 1000);
}

export async function getAuthenticatedInstagramProfile(connection: AuthorizedInstagramConnection) {
  if (!connection.credentialCiphertext) throw new Error("تفويض Instagram غير مكتمل.");
  if (connection.credentialExpiresAt && connection.credentialExpiresAt.getTime() <= Date.now()) throw new Error("انتهى رمز Instagram ولا يمكن تجديده؛ أعد OAuth الرسمي.");
  let accessToken = decryptYouTubeCredential(connection.credentialCiphertext);
  let credentialCiphertext = connection.credentialCiphertext;
  let credentialExpiresAt = connection.credentialExpiresAt ?? null;
  if (instagramTokenNeedsRefresh(connection.credentialExpiresAt)) {
    const refreshed = await refreshInstagramLongLivedAccessToken(connection);
    accessToken = refreshed.accessToken;
    credentialCiphertext = encryptYouTubeCredential(refreshed.accessToken);
    credentialExpiresAt = refreshed.expiresAt;
  }
  const profileUrl = new URL("https://graph.instagram.com/v24.0/me");
  profileUrl.search = new URLSearchParams({ fields: "id,username", access_token: accessToken }).toString();
  const response = await fetch(profileUrl, { signal: AbortSignal.timeout(20_000) });
  const profile = await response.json() as InstagramProfilePayload;
  if (!response.ok || !profile.id) throw new Error(profile.error?.message ?? "تعذّر التحقق من حساب Instagram المفوض.");
  return { id: profile.id, username: profile.username || "Instagram Professional Account", accessToken, credentialCiphertext, credentialExpiresAt };
}

async function getAuthenticatedUser(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

function tokenData(payload: ShortTokenPayload) {
  return payload.data?.[0] ?? payload;
}

export function registerInstagramOAuthRoutes(app: Express) {
  app.get("/api/integrations/instagram/authorize", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).send("سجّل الدخول إلى XDAW NOVA أولًا ثم أعد محاولة ربط Instagram.");
    if (!ENV.instagramAppId || !ENV.instagramAppSecret) return res.status(503).send("بيانات تطبيق Instagram API غير مهيأة بعد.");

    const state = randomBytes(32).toString("base64url");
    res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions(req));
    return res.redirect(buildInstagramAuthorizationUrl(ENV.instagramAppId, getInstagramRedirectUri(req), state));
  });

  app.get("/api/integrations/instagram/callback", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const authorizationCode = (typeof req.query.code === "string" ? req.query.code : "").replace(/#_$/, "");
    const cookieState = parseCookie(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions(req));

    if (!user || !state || !authorizationCode || state !== cookieState) {
      return res.redirect("/settings?instagram=invalid_state");
    }

    try {
      const redirectUri = getInstagramRedirectUri(req);
      const shortTokenForm = new FormData();
      shortTokenForm.set("client_id", ENV.instagramAppId);
      shortTokenForm.set("client_secret", ENV.instagramAppSecret);
      shortTokenForm.set("grant_type", "authorization_code");
      shortTokenForm.set("redirect_uri", redirectUri);
      shortTokenForm.set("code", authorizationCode);
      const shortTokenResponse = await fetch("https://api.instagram.com/oauth/access_token", {
        method: "POST",
        body: shortTokenForm,
        signal: AbortSignal.timeout(20_000),
      });
      const shortTokenPayload = await shortTokenResponse.json() as ShortTokenPayload;
      const shortToken = tokenData(shortTokenPayload);
      if (!shortTokenResponse.ok || !shortToken.access_token) throw new Error(shortTokenPayload.error_message ?? "SHORT_TOKEN_EXCHANGE_FAILED");

      const longTokenUrl = new URL("https://graph.instagram.com/access_token");
      longTokenUrl.search = new URLSearchParams({
        grant_type: "ig_exchange_token",
        client_secret: ENV.instagramAppSecret,
        access_token: shortToken.access_token,
      }).toString();
      const longTokenResponse = await fetch(longTokenUrl, { signal: AbortSignal.timeout(20_000) });
      const longTokenPayload = await longTokenResponse.json() as LongTokenPayload;
      if (!longTokenResponse.ok || !longTokenPayload.access_token) throw new Error(longTokenPayload.error?.message ?? "LONG_TOKEN_EXCHANGE_FAILED");

      const profileUrl = new URL("https://graph.instagram.com/v24.0/me");
      profileUrl.search = new URLSearchParams({ fields: "id,username", access_token: longTokenPayload.access_token }).toString();
      const profileResponse = await fetch(profileUrl, { signal: AbortSignal.timeout(20_000) });
      const profile = await profileResponse.json() as InstagramProfilePayload;
      if (!profileResponse.ok || !profile.id) throw new Error(profile.error?.message ?? "PROFILE_LOOKUP_FAILED");

      await db.upsertChannelConnection({
        ownerId: user.id,
        platform: "instagram",
        label: profile.username ? `@${profile.username}`.slice(0, 160) : "Instagram Professional Account",
        externalAccountRef: profile.id,
        status: "authorized",
        scopeSummary: INSTAGRAM_BACKGROUND_SCOPES.join(" + "),
        credentialCiphertext: encryptYouTubeCredential(longTokenPayload.access_token),
        credentialExpiresAt: longTokenPayload.expires_in ? new Date(Date.now() + longTokenPayload.expires_in * 1000) : undefined,
        lastVerifiedAt: new Date(),
      });
      await db.createChangeLogEntry({ ownerId: user.id, category: "integration", summary: "تم تفويض Instagram API", details: "فُوّض حساب Instagram الاحترافي للنشر الخلفي المحكوم وتجديد الرمز؛ لا يعني التفويض نشرًا تلقائيًا خارج سياسة النشر.", actorType: "user" });
      return res.redirect("/settings?instagram=connected");
    } catch (error) {
      await db.upsertChannelConnection({ ownerId: user.id, platform: "instagram", label: "Instagram", status: "error", lastError: error instanceof Error ? error.message.slice(0, 1000) : "تعذّر إكمال تفويض Instagram API." });
      return res.redirect("/settings?instagram=connection_failed");
    }
  });
}
