import { ENV } from "./_core/env";

type TelegramApiResponse = {
  ok: boolean;
  description?: string;
};

type TelegramUpdatesResponse = TelegramApiResponse & {
  result?: Array<{ message?: { chat?: { id?: number } } }>;
};

export function telegramIsConfigured(chatId?: string | null) {
  return Boolean(ENV.telegramBotToken && (chatId ?? ENV.telegramChatId));
}

/** Finds the most recent private chat that explicitly started the bot without exposing message contents. */
export async function discoverLatestTelegramChatId() {
  if (!ENV.telegramBotToken) return null;
  try {
    const response = await fetch(`https://api.telegram.org/bot${ENV.telegramBotToken}/getUpdates?limit=20&timeout=0`, {
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await response.json()) as TelegramUpdatesResponse;
    const latest = payload.result?.slice().reverse().find(update => update.message?.chat?.id);
    return latest?.message?.chat?.id ? String(latest.message.chat.id) : null;
  } catch {
    return null;
  }
}

/** Sends a short operational update. Secrets and remote response details are never logged. */
export async function sendTelegramOperationalNotification(input: { chatId?: string | null; title: string; detail: string }) {
  const chatId = input.chatId ?? ENV.telegramChatId;
  if (!telegramIsConfigured(chatId)) {
    return { delivered: false, reason: "Telegram غير مهيأ بعد." } as const;
  }

  const text = `XDAW NOVA — ${input.title}\n${input.detail}`.slice(0, 4000);
  try {
    const response = await fetch(`https://api.telegram.org/bot${ENV.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(15_000),
    });
    const payload = (await response.json()) as TelegramApiResponse;
    return payload.ok
      ? ({ delivered: true, reason: "تم إرسال إشعار Telegram." } as const)
      : ({ delivered: false, reason: "تعذّر تسليم إشعار Telegram." } as const);
  } catch {
    return { delivered: false, reason: "تعذّر الاتصال بـ Telegram." } as const;
  }
}

export async function configureTelegramCommandWebhook(publicBaseUrl: string) {
  if (!ENV.telegramBotToken || !ENV.telegramWebhookSecret) throw new Error("لم تُهيأ بيانات Webhook Telegram بعد.");
  const base = new URL(publicBaseUrl);
  if (base.protocol !== "https:" || !base.hostname.endsWith(".manus.space")) throw new Error("يجب ضبط Webhook على نطاق XDAW NOVA المنشور عبر HTTPS.");
  const response = await fetch(`https://api.telegram.org/bot${ENV.telegramBotToken}/setWebhook`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: `${base.origin}/api/webhooks/telegram`, secret_token: ENV.telegramWebhookSecret, allowed_updates: ["message"] }),
    signal: AbortSignal.timeout(15_000),
  });
  const payload = (await response.json()) as TelegramApiResponse;
  if (!response.ok || !payload.ok) throw new Error("تعذر تفعيل Webhook Telegram.");
  return { configured: true, url: `${base.origin}/api/webhooks/telegram` };
}
