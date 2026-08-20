import * as db from "./db";
import { sendTelegramOperationalNotification } from "./telegram";

type OperationalEvent = {
  ownerId: number;
  eventType: string;
  title: string;
  detail: string;
  publishingRunId?: number;
};

/** Records each notification attempt once and never lets Telegram availability block a production action. */
export async function notifyOwnerOperationalEvent(input: OperationalEvent) {
  try {
    const telegram = (await db.listChannelConnections(input.ownerId)).find(connection => connection.platform === "telegram" && connection.status === "authorized");
    const result = telegram?.externalAccountRef
      ? await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title: input.title, detail: input.detail })
      : { delivered: false as const, reason: "Telegram غير مفوّض لإشعارات التشغيل." };
    await db.recordNotificationEvent({ ownerId: input.ownerId, publishingRunId: input.publishingRunId, channel: "telegram", eventType: input.eventType, deliveryStatus: result.delivered ? "sent" : "failed", detail: result.reason });
    return result;
  } catch {
    return { delivered: false as const, reason: "تعذّر تسجيل إشعار التشغيل." };
  }
}
