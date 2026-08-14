import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Express, Request } from "express";
import { parse as parseCookie } from "cookie";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import * as db from "./db";

const OAUTH_STATE_COOKIE = "xdaw_tiktok_oauth_state";
const OAUTH_ENVIRONMENT_COOKIE = "xdaw_tiktok_oauth_environment";
const TIKTOK_SCOPES = ["user.info.basic", "video.upload", "video.publish"];

export type TikTokOAuthEnvironment = "production" | "sandbox";

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

export function resolveTikTokOAuthEnvironment(value: unknown): TikTokOAuthEnvironment {
  return value === "sandbox" ? "sandbox" : "production";
}

export function getTikTokOAuthCredentials(environment: TikTokOAuthEnvironment) {
  if (environment === "sandbox") {
    return {
      clientKey: ENV.tiktokSandboxClientKey,
      clientSecret: ENV.tiktokSandboxClientSecret,
    };
  }
  return {
    clientKey: ENV.tiktokClientKey,
    clientSecret: ENV.tiktokClientSecret,
  };
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
    const environment = resolveTikTokOAuthEnvironment(req.query.environment);
    const credentials = getTikTokOAuthCredentials(environment);
    if (!credentials.clientKey || !credentials.clientSecret) return res.status(503).send(environment === "sandbox" ? "بيانات TikTok Sandbox غير مهيأة بعد." : "بيانات تطبيق TikTok غير مهيأة بعد.");

    const state = randomBytes(32).toString("base64url");
    res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions(req));
    res.cookie(OAUTH_ENVIRONMENT_COOKIE, environment, cookieOptions(req));
    return res.redirect(getTikTokAuthorizeUrl({ clientKey: credentials.clientKey, redirectUri: getTikTokRedirectUri(req), state }));
  });

  app.get("/api/integrations/tiktok/callback", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const cookies = parseCookie(req.headers.cookie ?? "");
    const cookieState = cookies[OAUTH_STATE_COOKIE];
    const environment = resolveTikTokOAuthEnvironment(cookies[OAUTH_ENVIRONMENT_COOKIE]);
    res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions(req));
    res.clearCookie(OAUTH_ENVIRONMENT_COOKIE, cookieOptions(req));
    if (!user || !state || !code || state !== cookieState) return res.redirect("/settings?tiktok=invalid_state");
    const credentials = getTikTokOAuthCredentials(environment);
    if (!credentials.clientKey || !credentials.clientSecret) return res.redirect(environment === "sandbox" ? "/settings?tiktok=sandbox_not_configured" : "/settings?tiktok=not_configured");

    try {
      const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ client_key: credentials.clientKey, client_secret: credentials.clientSecret, code, grant_type: "authorization_code", redirect_uri: getTikTokRedirectUri(req) }),
        signal: AbortSignal.timeout(20_000),
      });
      const tokenPayload = (await tokenResponse.json()) as TikTokTokenResponse;
      if (!tokenResponse.ok || !tokenPayload.access_token || !tokenPayload.open_id) throw new Error(tokenPayload.error_description || tokenPayload.error || "TOKEN_EXCHANGE_FAILED");

      if (environment === "sandbox") {
        await db.createChangeLogEntry({ ownerId: user.id, category: "integration", summary: "نجح TikTok Sandbox OAuth", details: `حساب Sandbox: ${tokenPayload.open_id} | النطاقات: ${tokenPayload.scope ?? TIKTOK_SCOPES.join(", ")}. لم يُحفظ أي رمز ولم يُفعّل نشر الإنتاج.`, actorType: "user" });
        return res.redirect("/settings?tiktok=sandbox_connected");
      }

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
      if (environment === "sandbox") {
        await db.createChangeLogEntry({ ownerId: user.id, category: "integration", summary: "تعذّر TikTok Sandbox OAuth", details: "راجع مفاتيح Sandbox والصلاحيات والحساب المستهدف، ثم أعد الاختبار. لم يتأثر اتصال الإنتاج.", actorType: "user" });
        return res.redirect("/settings?tiktok=sandbox_connection_failed");
      }
      await db.upsertChannelConnection({ ownerId: user.id, platform: "tiktok", label: "XDAW NOVA TikTok", status: "error", lastError: "تعذّر تفويض TikTok. راجع صلاحيات التطبيق ثم أعد المحاولة." });
      return res.redirect("/settings?tiktok=connection_failed");
    }
  });
}
