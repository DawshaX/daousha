import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Express, Request } from "express";
import { parse as parseCookie } from "cookie";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import * as db from "./db";

const OAUTH_STATE_COOKIE = "xdaw_tiktok_oauth_state";
const TIKTOK_SCOPES = ["user.info.basic", "video.upload", "video.publish"];

type TikTokTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  open_id?: string;
  scope?: string;
  error?: string;
  error_description?: string;
};

function cookieOptions(req: Request) {
  const forwardedProtocol = req.header("x-forwarded-proto")?.split(",")[0];
  return { httpOnly: true, sameSite: "lax" as const, secure: req.secure || forwardedProtocol === "https", maxAge: 10 * 60 * 1000, path: "/" };
}

function credentialKey() {
  if (!ENV.cookieSecret) throw new Error("مفتاح حماية الخادم غير متاح.");
  return createHash("sha256").update(ENV.cookieSecret).digest();
}

function encryptCredential(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", credentialKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

async function getAuthenticatedUser(req: Request) {
  try {
    return await sdk.authenticateRequest(req);
  } catch {
    return null;
  }
}

export function getTikTokRedirectUri(req: Pick<Request, "header" | "protocol">) {
  const protocol = req.header("x-forwarded-proto")?.split(",")[0] ?? req.protocol;
  const host = req.header("x-forwarded-host") ?? req.header("host");
  if (!host) throw new Error("تعذّر تحديد عنوان إعادة التوجيه لـ TikTok.");
  return `${protocol}://${host}/api/integrations/tiktok/callback`;
}

export function getTikTokAuthorizeUrl({ clientKey, redirectUri, state }: { clientKey: string; redirectUri: string; state: string }) {
  const authorizationUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authorizationUrl.search = new URLSearchParams({
    client_key: clientKey,
    response_type: "code",
    scope: TIKTOK_SCOPES.join(","),
    redirect_uri: redirectUri,
    state,
  }).toString();
  return authorizationUrl.toString();
}

export function registerTikTokOAuthRoutes(app: Express) {
  app.get("/api/integrations/tiktok/authorize", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).send("سجّل الدخول إلى XDAW NOVA أولًا ثم أعد محاولة ربط TikTok.");
    if (!ENV.tiktokClientKey || !ENV.tiktokClientSecret) return res.status(503).send("بيانات تطبيق TikTok غير مهيأة بعد.");

    const state = randomBytes(32).toString("base64url");
    res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions(req));
    return res.redirect(getTikTokAuthorizeUrl({ clientKey: ENV.tiktokClientKey, redirectUri: getTikTokRedirectUri(req), state }));
  });

  app.get("/api/integrations/tiktok/callback", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const cookieState = parseCookie(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions(req));
    if (!user || !state || !code || state !== cookieState) return res.redirect("/settings?tiktok=invalid_state");
    if (!ENV.tiktokClientKey || !ENV.tiktokClientSecret) return res.redirect("/settings?tiktok=not_configured");

    try {
      const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_key: ENV.tiktokClientKey, client_secret: ENV.tiktokClientSecret, code, grant_type: "authorization_code", redirect_uri: getTikTokRedirectUri(req) }),
        signal: AbortSignal.timeout(20_000),
      });
      const tokenPayload = (await tokenResponse.json()) as TikTokTokenResponse;
      if (!tokenResponse.ok || !tokenPayload.access_token || !tokenPayload.open_id) throw new Error(tokenPayload.error_description || tokenPayload.error || "TOKEN_EXCHANGE_FAILED");

      const encryptedTokenBundle = encryptCredential(JSON.stringify({
        accessToken: tokenPayload.access_token,
        refreshToken: tokenPayload.refresh_token ?? "",
        expiresIn: tokenPayload.expires_in ?? 0,
        refreshExpiresIn: tokenPayload.refresh_expires_in ?? 0,
        openId: tokenPayload.open_id,
        scope: tokenPayload.scope ?? TIKTOK_SCOPES.join(","),
      }));
      await db.upsertChannelConnection({
        ownerId: user.id,
        platform: "tiktok",
        label: "XDAW NOVA TikTok",
        externalAccountRef: tokenPayload.open_id,
        status: "authorized",
        scopeSummary: tokenPayload.scope ?? TIKTOK_SCOPES.join(", "),
        credentialCiphertext: encryptedTokenBundle,
        lastVerifiedAt: new Date(),
      });
      await db.createChangeLogEntry({ ownerId: user.id, category: "integration", summary: "تم تفويض TikTok", details: `النطاقات: ${tokenPayload.scope ?? TIKTOK_SCOPES.join(", ")}`, actorType: "user" });
      return res.redirect("/settings?tiktok=connected");
    } catch {
      await db.upsertChannelConnection({ ownerId: user.id, platform: "tiktok", label: "XDAW NOVA TikTok", status: "error", lastError: "تعذّر تفويض TikTok. راجع صلاحيات التطبيق ثم أعد المحاولة." });
      return res.redirect("/settings?tiktok=connection_failed");
    }
  });
}
