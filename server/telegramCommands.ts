import type { Express, Request, Response } from "express";
import { ENV } from "./_core/env";
import * as db from "./db";
import { runNOVATurn } from "./novaAssistant";
import { sendTelegramOperationalNotification } from "./telegram";

const SECRET_HEADER = "x-telegram-bot-api-secret-token";
const SENSITIVE_CONTENT = /(password|passcode|token|otp|verification\s*code|كلمة\s*مرور|رمز\s*(تحقق|دخول|وصول))/i;

type TelegramUpdate = { update_id?: number; message?: { chat?: { id?: number | string }; text?: string } };

export async function handleTelegramCommandWebhook(req: Request, res: Response) {
  const expectedSecret = ENV.telegramWebhookSecret;
  if (!expectedSecret || req.header(SECRET_HEADER) !== expectedSecret) return res.status(401).json({ ok: false });
  const update = req.body as TelegramUpdate;
  const updateId = update.update_id;
  const chatId = update.message?.chat?.id ? String(update.message.chat.id) : "";
  const content = update.message?.text?.trim() ?? "";
  if (!Number.isInteger(updateId) || !chatId) return res.status(200).json({ ok: true, ignored: "non_message" });

  const owner = await db.getUserByOpenId(ENV.ownerOpenId);
  if (!owner || !ENV.telegramChatId || chatId !== ENV.telegramChatId) return res.status(403).json({ ok: false });
  const receipt = await db.recordTelegramWebhookUpdate({ updateId: updateId!, ownerId: owner.id, chatId });
  if (!receipt.created) return res.status(200).json({ ok: true, duplicate: true });
  if (!content || SENSITIVE_CONTENT.test(content)) {
    await db.updateTelegramWebhookUpdate(updateId!, "ignored", "رسالة فارغة أو حساسة؛ لم تُعالج.");
    await sendTelegramOperationalNotification({ chatId, title: "أمر NOVA مرفوض", detail: "لا ترسل كلمات مرور أو رموز أو بيانات وصول إلى المحادثة." });
    return res.status(200).json({ ok: true, ignored: true });
  }
  try {
    const result = await runNOVATurn({ ownerId: owner.id, content, origin: "telegram" });
    await db.updateTelegramWebhookUpdate(updateId!, "completed", `NOVA: ${result.status}`);
    await sendTelegramOperationalNotification({ chatId, title: "NOVA Assistant", detail: result.reply.slice(0, 3400) });
    return res.status(200).json({ ok: true });
  } catch {
    await db.updateTelegramWebhookUpdate(updateId!, "failed", "تعذر تنفيذ أمر NOVA من Telegram.");
    return res.status(200).json({ ok: true });
  }
}

export function registerTelegramCommandWebhook(app: Express) { app.post("/api/webhooks/telegram", (req, res) => { void handleTelegramCommandWebhook(req, res); }); }
