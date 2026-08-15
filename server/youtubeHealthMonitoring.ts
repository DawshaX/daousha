import * as db from "./db";
import { sendTelegramOperationalNotification } from "./telegram";
import { getAuthenticatedYouTubeChannel } from "./youtubePublisher";

type HealthStatus = "healthy" | "degraded" | "disconnected";

/** Idempotent, non-publishing OAuth health check for one YouTube connection. */
export async function executeYouTubeHealthMonitor(taskUid: string) {
  const monitor = await db.getConnectionHealthMonitorByTaskUid(taskUid);
  if (!monitor || monitor.platform !== "youtube") return { ok: true, skipped: "orphan" as const };

  const connection = await db.getChannelConnection(monitor.ownerId, "youtube");
  let status: HealthStatus = "disconnected";
  let detail = "لا يوجد تفويض YouTube صالح لمراقبته.";
  try {
    if (!connection || connection.status !== "authorized" || !connection.credentialCiphertext) throw new Error("missing_connection");
    const channel = await getAuthenticatedYouTubeChannel(connection);
    if (connection.externalAccountRef && connection.externalAccountRef !== channel.id) throw new Error("channel_mismatch");
    status = "healthy";
    detail = `اتصال YouTube سليم للقناة ${channel.title}. لم يُرفع أو يُنشر أي محتوى.`;
    await db.upsertChannelConnection({ ...connection, label: channel.title.slice(0, 160), status: "authorized", lastVerifiedAt: new Date(), lastError: null });
  } catch {
    status = connection?.credentialCiphertext ? "degraded" : "disconnected";
    detail = status === "degraded" ? "تعذّر تجديد أو التحقق من تفويض YouTube. أعد OAuth الرسمي إذا استمر التعثر." : detail;
    if (connection) await db.upsertChannelConnection({ ...connection, status: "error", lastError: detail, lastVerifiedAt: new Date() });
  }

  await db.updateConnectionHealthMonitorCheck(monitor.id, { status, detail });
  if (monitor.lastNotifiedStatus === status) return { ok: true, status, notified: false, detail };
  const telegram = (await db.listChannelConnections(monitor.ownerId)).find(item => item.platform === "telegram" && item.status === "authorized");
  if (!telegram?.externalAccountRef) return { ok: true, status, notified: false, skipped: "telegram_not_connected" as const, detail };
  const title = status === "healthy" ? "اتصال YouTube سليم" : "تنبيه اتصال YouTube";
  const delivered = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title, detail });
  await db.recordNotificationEvent({ ownerId: monitor.ownerId, channel: "telegram", eventType: `youtube_health_${status}`, deliveryStatus: delivered.delivered ? "sent" : "failed", detail: delivered.reason });
  if (delivered.delivered) await db.markConnectionHealthMonitorNotified(monitor.id, status);
  return { ok: true, status, notified: delivered.delivered, detail };
}
