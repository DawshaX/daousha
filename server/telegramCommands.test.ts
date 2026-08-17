import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = { getUserByOpenId: vi.fn(), getUserById: vi.fn(), getPairedTelegramOwnerByChatId: vi.fn(), pairTelegramOwnerByCode: vi.fn(), recordTelegramWebhookUpdate: vi.fn(), updateTelegramWebhookUpdate: vi.fn() };
const novaMock = { runNOVATurn: vi.fn() };
const telegramMock = { sendTelegramOperationalNotification: vi.fn() };
vi.mock("./_core/env", () => ({ ENV: { telegramWebhookSecret: "safe_secret", telegramChatId: "99", ownerOpenId: "owner" } }));
vi.mock("./db", () => dbMock);
vi.mock("./novaAssistant", () => novaMock);
vi.mock("./telegram", () => telegramMock);
const { handleTelegramCommandWebhook } = await import("./telegramCommands");

function response() { const value: { status?: number; body?: unknown } = {}; const res = { status: vi.fn(code => { value.status = code; return res; }), json: vi.fn(body => { value.body = body; return res; }) }; return { res, value }; }
function request(update: unknown, secret = "safe_secret") { return { body: update, header: vi.fn(() => secret) } as any; }

describe("Telegram NOVA webhook", () => {
  beforeEach(() => { vi.clearAllMocks(); dbMock.getUserById.mockResolvedValue({ id: 7 }); dbMock.getPairedTelegramOwnerByChatId.mockResolvedValue({ ownerId: 7, chatId: "99", status: "paired" }); dbMock.recordTelegramWebhookUpdate.mockResolvedValue({ created: true }); novaMock.runNOVATurn.mockResolvedValue({ status: "completed", reply: "تم عرض الحالة." }); telegramMock.sendTelegramOperationalNotification.mockResolvedValue({ delivered: true }); });
  it("يرفض أي طلب لا يحمل سر Telegram الصحيح", async () => { const { res, value } = response(); await handleTelegramCommandWebhook(request({}, "bad"), res as any); expect(value.status).toBe(401); expect(dbMock.recordTelegramWebhookUpdate).not.toHaveBeenCalled(); });
  it("يتجاهل Chat غير المقترن قبل تمرير أي رسالة إلى NOVA", async () => { dbMock.getPairedTelegramOwnerByChatId.mockResolvedValue(null); const { res, value } = response(); await handleTelegramCommandWebhook(request({ update_id: 1, message: { chat: { id: 4 }, text: "ما الحالة؟" } }), res as any); expect(value.body).toMatchObject({ ignored: "unpaired_chat" }); expect(novaMock.runNOVATurn).not.toHaveBeenCalled(); });
  it("يربط المحادثة فقط عبر أمر start ذي رمز مؤقت صالح", async () => { dbMock.pairTelegramOwnerByCode.mockResolvedValue({ ownerId: 7, chatId: "99", status: "paired" }); const { res, value } = response(); await handleTelegramCommandWebhook(request({ update_id: 8, message: { chat: { id: 99 }, text: "/start vErySecurePairingCode_123" } }), res as any); expect(value.body).toMatchObject({ paired: true }); expect(telegramMock.sendTelegramOperationalNotification).toHaveBeenCalled(); });
  it("يتجاهل التحديث المكرر ولا ينفذ الأمر مرتين", async () => { dbMock.recordTelegramWebhookUpdate.mockResolvedValue({ created: false }); const { res, value } = response(); await handleTelegramCommandWebhook(request({ update_id: 2, message: { chat: { id: 99 }, text: "ما الحالة؟" } }), res as any); expect(value.body).toMatchObject({ duplicate: true }); expect(novaMock.runNOVATurn).not.toHaveBeenCalled(); });
  it("يحجب كلمة مرور أو رمزًا بدل تمريرها للمساعد", async () => { const { res } = response(); await handleTelegramCommandWebhook(request({ update_id: 3, message: { chat: { id: 99 }, text: "كلمة مرور الحساب هي 123" } }), res as any); expect(dbMock.updateTelegramWebhookUpdate).toHaveBeenCalledWith(3, "ignored", expect.any(String)); expect(novaMock.runNOVATurn).not.toHaveBeenCalled(); });
});
