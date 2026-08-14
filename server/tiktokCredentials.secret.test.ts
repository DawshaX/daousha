import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("TikTok app credentials", () => {
  it("are accepted by TikTok before the authorization-code step", async () => {
    expect(ENV.tiktokClientKey).toBeTruthy();
    expect(ENV.tiktokClientSecret).toBeTruthy();

    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: ENV.tiktokClientKey,
        client_secret: ENV.tiktokClientSecret,
        grant_type: "authorization_code",
        code: "credential-validation-probe",
        redirect_uri: "https://daousha-vide-nbqlahcj.manus.space/api/integrations/tiktok/callback",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await response.json()) as { error?: string; error_description?: string };
    const detail = `${payload.error ?? ""} ${payload.error_description ?? ""}`.toLowerCase();

    // A deliberately invalid authorization code should be rejected, but never as an invalid application client.
    expect(detail).not.toMatch(/invalid[_ ]?(client|client_key|client_secret)|client.*(invalid|not found|mismatch)/);
  });
});
