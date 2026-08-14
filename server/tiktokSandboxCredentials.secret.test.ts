import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

describe("TikTok Sandbox credentials", () => {
  it("are configured as a separate client before a live Sandbox OAuth test", async () => {
    expect(ENV.tiktokSandboxClientKey).toBeTruthy();
    expect(ENV.tiktokSandboxClientSecret).toBeTruthy();
    expect(ENV.tiktokSandboxClientKey).not.toBe(ENV.tiktokClientKey);

    const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_key: ENV.tiktokSandboxClientKey,
        client_secret: ENV.tiktokSandboxClientSecret,
        grant_type: "authorization_code",
        code: "sandbox-credential-validation-probe",
        redirect_uri: "https://daousha-vide-nbqlahcj.manus.space/api/integrations/tiktok/callback",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await response.json()) as { error?: string; error_description?: string };
    const detail = `${payload.error ?? ""} ${payload.error_description ?? ""}`.toLowerCase();

    expect(detail).not.toMatch(/invalid[_ ]?(client|client_key|client_secret)|client.*(invalid|not found|mismatch)/);
  });
});
