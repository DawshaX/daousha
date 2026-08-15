import { describe, expect, it } from "vitest";
import { getTikTokAuthorizeUrl, getTikTokCredentialExpiryAt, getTikTokOAuthScopes, resolveTikTokOAuthEnvironment } from "./tiktokOAuth";

describe("TikTok OAuth authorization URL", () => {
  it("requests the production identity, upload, and direct-post scopes only for production", () => {
    const url = new URL(getTikTokAuthorizeUrl({ clientKey: "client-key", redirectUri: "https://xdawnova.example/api/integrations/tiktok/callback", state: "csrf-state" }));

    expect(url.origin).toBe("https://www.tiktok.com");
    expect(url.pathname).toBe("/v2/auth/authorize/");
    expect(url.searchParams.get("client_key")).toBe("client-key");
    expect(url.searchParams.get("state")).toBe("csrf-state");
    expect(url.searchParams.get("scope")).toBe("user.info.basic,video.upload,video.publish");
    expect(url.searchParams.get("redirect_uri")).toBe("https://xdawnova.example/api/integrations/tiktok/callback");
  });

  it("keeps Sandbox selection explicit and defaults all other values to production", () => {
    expect(resolveTikTokOAuthEnvironment("sandbox")).toBe("sandbox");
    expect(resolveTikTokOAuthEnvironment("production")).toBe("production");
    expect(resolveTikTokOAuthEnvironment(undefined)).toBe("production");
  });

  it("omits the direct-post scope from the Sandbox authorization request", () => {
    const url = new URL(getTikTokAuthorizeUrl({
      clientKey: "sandbox-client-key",
      redirectUri: "https://xdawnova.example/api/integrations/tiktok/callback",
      state: "sandbox-csrf-state",
      scopes: getTikTokOAuthScopes("sandbox"),
    }));

    expect(url.searchParams.get("scope")).toBe("user.info.basic,video.upload");
    expect(url.searchParams.get("scope")).not.toContain("video.publish");
  });

  it("records production-token expiry from the provider lifetime without relying on a browser session", () => {
    const now = new Date("2026-08-14T10:00:00.000Z");
    expect(getTikTokCredentialExpiryAt(7_200, now).toISOString()).toBe("2026-08-14T12:00:00.000Z");
    expect(getTikTokCredentialExpiryAt(-5, now).toISOString()).toBe(now.toISOString());
  });
});
