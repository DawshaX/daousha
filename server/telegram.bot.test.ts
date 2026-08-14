import { describe, expect, it } from "vitest";

describe("Telegram bot credentials", () => {
  it("authenticates the configured bot without sending a message", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    expect(token, "TELEGRAM_BOT_TOKEN must be configured").toBeTruthy();

    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      signal: AbortSignal.timeout(15_000),
    });

    expect(response.ok).toBe(true);
    const payload = (await response.json()) as {
      ok: boolean;
      result?: { is_bot?: boolean; username?: string };
    };

    expect(payload.ok).toBe(true);
    expect(payload.result?.is_bot).toBe(true);
    expect(payload.result?.username?.toLowerCase()).toBe("xdaw_nova_bot");
  }, 20_000);
});
