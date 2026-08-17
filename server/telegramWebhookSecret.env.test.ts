import { describe, expect, it, vi } from "vitest";

const dbMock = { getUserByOpenId: vi.fn().mockResolvedValue({ id: 7170001 }), recordTelegramWebhookUpdate: vi.fn().mockResolvedValue({ created: true }), updateTelegramWebhookUpdate: vi.fn() };
vi.mock("./db", () => dbMock);
vi.mock("./novaAssistant", () => ({ runNOVATurn: vi.fn().mockResolvedValue({ status: "completed", reply: "تم." }) }));
vi.mock("./telegram", () => ({ sendTelegramOperationalNotification: vi.fn().mockResolvedValue({ delivered: true }) }));

const { handleTelegramCommandWebhook } = await import("./telegramCommands");

describe("سر Telegram Webhook المحفوظ", () => {
  it("يقبل طلبًا موقّعًا بالسر المحفوظ في البيئة", async () => {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";
    expect(secret.length).toBeGreaterThanOrEqual(32);
    const state: { status?: number } = {};
    const res = { status: vi.fn(code => { state.status = code; return res; }), json: vi.fn(() => res) };
    await handleTelegramCommandWebhook({ header: vi.fn(() => secret), body: { update_id: 9482, message: { chat: { id: process.env.TELEGRAM_CHAT_ID }, text: "اعرض الحالة" } } } as any, res as any);
    expect(state.status).toBe(200);
  });
});
