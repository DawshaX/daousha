import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import type { Express, Request, Response } from "express";
import { parse as parseCookie } from "cookie";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";
import * as db from "./db";

const OAUTH_STATE_COOKIE = "xdaw_facebook_oauth_state";
const PAGE_PICKER_COOKIE = "xdaw_facebook_page_picker";
export const FACEBOOK_OAUTH_DOMAINS = ["xdawnova.int.eu.org", "daousha-vide-nbqlahcj.manus.space"] as const;
const FACEBOOK_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_posts",
  "publish_video",
] as const;

type MetaTokenResponse = { access_token?: string; expires_in?: number; error?: { message?: string } };
type MetaPage = { id?: string; name?: string; access_token?: string };
type MetaPagesResponse = { data?: MetaPage[]; error?: { message?: string } };
type PendingPagePicker = { ownerId: number; pages: Array<{ id: string; name: string; accessToken: string }>; expiresAt: number };

function cookieOptions(req: Request) {
  const forwardedProtocol = req.header("x-forwarded-proto")?.split(",")[0];
  return { httpOnly: true, sameSite: "lax" as const, secure: req.secure || forwardedProtocol === "https", maxAge: 10 * 60 * 1000, path: "/" };
}

function encryptionKey() {
  if (!ENV.cookieSecret) throw new Error("مفتاح حماية الخادم غير متاح.");
  return createHash("sha256").update(ENV.cookieSecret).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decrypt(value: string) {
  const [ivRaw, tagRaw, ciphertextRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !ciphertextRaw) throw new Error("رمز Facebook المشفر غير صالح.");
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

export function getFacebookRedirectUri(req: Pick<Request, "header" | "protocol">) {
  const protocol = req.header("x-forwarded-proto")?.split(",")[0] ?? req.protocol;
  const host = req.header("x-forwarded-host") ?? req.header("host");
  if (!host) throw new Error("تعذّر تحديد عنوان إعادة التوجيه لـ Facebook.");
  return `${protocol}://${host}/api/integrations/facebook/callback`;
}

export function getFacebookAppDomain(req: Pick<Request, "header">) {
  const host = req.header("x-forwarded-host") ?? req.header("host");
  if (!host) throw new Error("تعذّر تحديد نطاق تطبيق Facebook.");
  return host.split(":")[0];
}

export function facebookOAuthDomainIsReady(req: Pick<Request, "header">) {
  return FACEBOOK_OAUTH_DOMAINS.includes(getFacebookAppDomain(req) as typeof FACEBOOK_OAUTH_DOMAINS[number]);
}

export function facebookScopes() {
  return [...FACEBOOK_SCOPES];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

function renderPagePicker(pages: PendingPagePicker["pages"]) {
  const options = pages.map(page => `<label><input type="radio" name="pageId" value="${escapeHtml(page.id)}" required> ${escapeHtml(page.name)} <small>(${escapeHtml(page.id)})</small></label>`).join("");
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>اختيار صفحة Facebook — XDAW NOVA</title><style>body{margin:0;background:#09090b;color:#f4f4f5;font-family:Arial,sans-serif}.wrap{max-width:640px;margin:8vh auto;padding:28px}.card{border:1px solid #3f2026;background:#151015;border-radius:16px;padding:24px}h1{font-size:24px;margin:0 0 12px;color:#fecaca}p{color:#d4d4d8;line-height:1.8}label{display:block;margin:12px 0;padding:14px;border:1px solid #343438;border-radius:10px;cursor:pointer}small{color:#a1a1aa}button{margin-top:16px;border:0;border-radius:10px;background:#dc2626;color:white;padding:12px 16px;font-weight:bold;cursor:pointer}</style></head><body><main class="wrap"><section class="card"><h1>اختر صفحة XDAW NOVA الصحيحة</h1><p>اختر الصفحة الجديدة التي تريد تفويضها للنشر. لن يتصل التطبيق بأي صفحة أخرى، ولا يغير حساب Instagram المستقل.</p><form method="post" action="/api/integrations/facebook/complete">${options}<button type="submit">اعتماد هذه الصفحة</button></form></section></main></body></html>`;
}

async function ensureFacebookAppDomain(req: Pick<Request, "header">) {
  const appDomain = getFacebookAppDomain(req);
  const accessToken = `${ENV.metaAppId}|${ENV.metaAppSecret}`;
  const inspectUrl = new URL(`https://graph.facebook.com/v26.0/${ENV.metaAppId}`);
  inspectUrl.search = new URLSearchParams({ fields: "app_domains", access_token: accessToken }).toString();
  const currentResponse = await fetch(inspectUrl, { signal: AbortSignal.timeout(15_000) });
  const currentPayload = (await currentResponse.json()) as { app_domains?: string[] };
  if (!currentResponse.ok) throw new Error("META_DOMAIN_READ_FAILED");
  if ((currentPayload.app_domains ?? []).includes(appDomain)) return;

  const domains = new Set([...(currentPayload.app_domains ?? []), appDomain]);
  const updateResponse = await fetch(`https://graph.facebook.com/v26.0/${ENV.metaAppId}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ app_domains: JSON.stringify(Array.from(domains)), access_token: accessToken }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!updateResponse.ok) throw new Error("META_DOMAIN_UPDATE_FAILED");
}

export function registerFacebookOAuthRoutes(app: Express) {
  app.get("/api/integrations/facebook/authorize", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).send("سجّل الدخول إلى XDAW NOVA أولًا ثم أعد محاولة ربط Facebook.");
    if (!ENV.metaAppId || !ENV.metaAppSecret) return res.status(503).send("بيانات تطبيق Meta غير مهيأة بعد.");
    if (!facebookOAuthDomainIsReady(req)) return res.status(503).send("تفويض Facebook معلّق حتى تستخدم إحدى نطاقات XDAW NOVA المعتمدة والمربوطة بالاستضافة.");

    try {
      await ensureFacebookAppDomain(req);
    } catch {
      return res.status(503).send("تعذّر اعتماد نطاق XDAW NOVA داخل Meta. راجع إعدادات التطبيق ثم أعد المحاولة.");
    }

    const state = randomBytes(32).toString("base64url");
    res.cookie(OAUTH_STATE_COOKIE, state, cookieOptions(req));
    const authorizationUrl = new URL("https://www.facebook.com/v22.0/dialog/oauth");
    authorizationUrl.search = new URLSearchParams({
      client_id: ENV.metaAppId,
      redirect_uri: getFacebookRedirectUri(req),
      response_type: "code",
      scope: FACEBOOK_SCOPES.join(","),
      state,
    }).toString();
    return res.redirect(authorizationUrl.toString());
  });

  app.get("/api/integrations/facebook/callback", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const cookieState = parseCookie(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    res.clearCookie(OAUTH_STATE_COOKIE, cookieOptions(req));
    if (!user || !state || !code || state !== cookieState) return res.redirect("/settings?facebook=invalid_state");

    try {
      const exchangeUrl = new URL("https://graph.facebook.com/v22.0/oauth/access_token");
      exchangeUrl.search = new URLSearchParams({ client_id: ENV.metaAppId, client_secret: ENV.metaAppSecret, redirect_uri: getFacebookRedirectUri(req), code }).toString();
      const tokenResponse = await fetch(exchangeUrl, { signal: AbortSignal.timeout(20_000) });
      const tokenPayload = (await tokenResponse.json()) as MetaTokenResponse;
      if (!tokenResponse.ok || !tokenPayload.access_token) throw new Error(tokenPayload.error?.message || "TOKEN_EXCHANGE_FAILED");

      const pagesUrl = new URL("https://graph.facebook.com/v22.0/me/accounts");
      pagesUrl.search = new URLSearchParams({ fields: "id,name,access_token", access_token: tokenPayload.access_token }).toString();
      const pagesResponse = await fetch(pagesUrl, { signal: AbortSignal.timeout(20_000) });
      const pagesPayload = (await pagesResponse.json()) as MetaPagesResponse;
      const pages = (pagesPayload.data ?? []).flatMap(page => page.id && page.name && page.access_token ? [{ id: page.id, name: page.name, accessToken: page.access_token }] : []);
      if (!pagesResponse.ok || !pages.length) throw new Error(pagesPayload.error?.message || "NO_MANAGED_PAGES");

      const pending: PendingPagePicker = { ownerId: user.id, pages, expiresAt: Date.now() + 10 * 60 * 1000 };
      res.cookie(PAGE_PICKER_COOKIE, encrypt(JSON.stringify(pending)), cookieOptions(req));
      return res.type("html").send(renderPagePicker(pages));
    } catch {
      await db.upsertChannelConnection({ ownerId: user.id, platform: "facebook", label: "Facebook Page", status: "error", lastError: "تعذّر قراءة الصفحات المفوضة. راجع الصلاحيات ثم أعد المحاولة." });
      return res.redirect("/settings?facebook=connection_failed");
    }
  });

  app.post("/api/integrations/facebook/complete", async (req, res) => {
    const user = await getAuthenticatedUser(req);
    const cookiePayload = parseCookie(req.headers.cookie ?? "")[PAGE_PICKER_COOKIE];
    const pageId = typeof req.body?.pageId === "string" ? req.body.pageId : "";
    res.clearCookie(PAGE_PICKER_COOKIE, cookieOptions(req));
    if (!user || !cookiePayload || !pageId) return res.redirect("/settings?facebook=selection_invalid");

    try {
      const pending = JSON.parse(decrypt(cookiePayload)) as PendingPagePicker;
      const page = pending.ownerId === user.id && pending.expiresAt > Date.now() ? pending.pages.find(candidate => candidate.id === pageId) : undefined;
      if (!page) throw new Error("PAGE_SELECTION_INVALID");
      await db.upsertChannelConnection({ ownerId: user.id, platform: "facebook", label: page.name.slice(0, 160), externalAccountRef: page.id, status: "authorized", scopeSummary: FACEBOOK_SCOPES.join(", "), credentialCiphertext: encrypt(page.accessToken), lastVerifiedAt: new Date() });
      await db.createChangeLogEntry({ ownerId: user.id, category: "integration", summary: "تم تفويض صفحة Facebook", details: `الصفحة: ${page.name} | النطاقات: ${FACEBOOK_SCOPES.join(", ")}`, actorType: "user" });
      return res.redirect("/settings?facebook=connected");
    } catch {
      return res.redirect("/settings?facebook=selection_invalid");
    }
  });
}
