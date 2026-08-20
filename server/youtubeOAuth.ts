import { randomBytes, createCipheriv, createDecipheriv, createHash } from "crypto";
import type { Express, Request, Response } from "express";
import { parse as parseCookie } from "cookie";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import * as db from "./db";

const OAUTH_STATE_COOKIE = "xdaw_youtube_oauth_state";
const YOUTUBE_SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"];

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

type YouTubeChannelResponse = {
  items?: Array<{ id?: string; snippet?: { title?: string } }>;
};

function cookieOptions(req: Request) {
  const forwardedProtocol = req.header("x-forwarded-proto")?.split(",")[0];
  return { httpOnly: true, sameSite: "lax" as const, secure: req.secure || forwardedProtocol === "https", maxAge: 10 * 60 * 1000, path: "/" };
}

export function getYouTubeRedirectUri(req: Request) {
  const protocol = req.header("x-forwarded-proto")?.split(",")[0] ?? req.protocol;
  const host = req.header("x-forwarded-host") ?? req.header("host");
  if (!host) throw new Error("تعذّر تحديد عنوان إعادة التوجيه لـ YouTube.");
  return `${protocol}://${host}/api/integrations/youtube/callback`;
}

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("مفتاح حماية الخادم غير متاح.");
  return createHash("sha256").update(ENV.cookieSecret).digest();
}

export function encryptYouTubeCredential(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptYouTubeCredential(payload: string) {
  const [ivRaw, tagRaw, ciphertextRaw] = payload.split(".");
  if (!ivRaw || !tagRaw || !ciphertextRaw) throw new Error("رمز التفويض المشفر غير صالح.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, "base64url")), decipher.final()]).toString("utf8");
}

async function getAuthenticatedUser(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export function registerYouTubeOAuthRoutes(app: Express) {
  app.get("/api/integrations/youtube/authorize", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).send("سجّل الدخول إلى XDAW NOVA أولًا ثم أعد محاولة ربط YouTube.");
    if (!ENV.youtubeClientId || !ENV.youtubeClientSecret) return res.status(503).send("بيانات تطبيق YouTube OAuth غير مهيأة بعد.");

    const state = randomBytes(32).toString("base64url");
    res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions(req));
    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.search = new URLSearchParams({
      client_id: ENV.youtubeClientId,
      redirect_uri: getYouTubeRedirectUri(req),
      response_type: "code",
      scope: YOUTUBE_SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      state,
    }).toString();
    return res.redirect(authorizationUrl.toString());
  });

  app.get("/api/integrations/youtube/callback", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const authorizationCode = typeof req.query.code === "string" ? req.query.code : "";
    const cookieState = parseCookie(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions(req));

    if (!user || !state || !authorizationCode || state !== cookieState) {
      return res.redirect("/settings?youtube=invalid_state");
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: authorizationCode,
          client_id: ENV.youtubeClientId,
          client_secret: ENV.youtubeClientSecret,
          redirect_uri: getYouTubeRedirectUri(req),
          grant_type: "authorization_code",
        }),
        signal: AbortSignal.timeout(20_000),
      });
      const tokenPayload = (await tokenResponse.json()) as GoogleTokenResponse;
      if (!tokenResponse.ok || !tokenPayload.access_token || !tokenPayload.refresh_token) throw new Error("TOKEN_EXCHANGE_FAILED");

      const channelResponse = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { authorization: `Bearer ${tokenPayload.access_token}` },
        signal: AbortSignal.timeout(20_000),
      });
      const channelPayload = (await channelResponse.json()) as YouTubeChannelResponse;
      const channel = channelPayload.items?.[0];
      if (!channelResponse.ok || !channel?.id) throw new Error("CHANNEL_LOOKUP_FAILED");

      await db.upsertChannelConnection({
        ownerId: user.id,
        platform: "youtube",
        label: channel.snippet?.title?.slice(0, 160) || "YouTube Channel",
        externalAccountRef: channel.id,
        status: "authorized",
        scopeSummary: "youtube.upload + youtube.readonly",
        credentialCiphertext: encryptYouTubeCredential(tokenPayload.refresh_token),
        credentialExpiresAt: tokenPayload.expires_in ? new Date(Date.now() + tokenPayload.expires_in * 1000) : undefined,
        lastVerifiedAt: new Date(),
      });
      await db.createChangeLogEntry({ ownerId: user.id, category: "integration", summary: "تم تفويض قناة YouTube", details: "تم منح نطاق رفع الفيديو وقراءة بيانات القناة فقط.", actorType: "user" });
      return res.redirect("/settings?youtube=connected");
    } catch {
      await db.upsertChannelConnection({ ownerId: user.id, platform: "youtube", label: "YouTube", status: "error", lastError: "تعذّر إكمال تفويض YouTube. راجع إعدادات OAuth وأعد المحاولة." });
      return res.redirect("/settings?youtube=connection_failed");
    }
  });
}
