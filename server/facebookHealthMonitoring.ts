import * as db from "./db";
import { sendTelegramOperationalNotification } from "./telegram";
import { verifyAuthorizedFacebookPage } from "./facebookPublisher";

type HealthStatus = "healthy" | "degraded" | "disconnected";

/** Idempotent, non-publishing Facebook Page identity check for an authorized connection. */
export async function executeFacebookHealthMonitor(taskUid: string) {
  const monitor = await db.getConnectionHealthMonitorByTaskUid(taskUid);
  if (!monitor || monitor.platform !== "facebook") return { ok: true, skipped: "orphan" as const };

  const connection = await db.getChannelConnection(monitor.ownerId, "facebook");
  let status: HealthStatus = "disconnected";
  let detail = "لا يوجد تفويض Facebook صالح لمراقبته.";

  try {
    if (!connection || connection.status !== "authorized" || !connection.externalAccountRef) throw new Error("missing_connection");
    const page = await verifyAuthorizedFacebookPage(connection);
    status = "healthy";
    detail = `اتصال Facebook سليم للصفحة ${page.name || connection.label}. فُحص الرمز والهوية فقط؛ لم يُرفع أو يُنشر أي فيديو.`;
    await db.upsertChannelConnection({ ...connection, label: (page.name || connection.label).slice(0, 160), status: "authorized", lastVerifiedAt: new Date(), lastError: null });
  } catch (error) {
    status = connection?.credentialCiphertext ? "degraded" : "disconnected";
    detail = status === "degraded"
      ? `تعذّر التحقق من تفويض Facebook. حدّث OAuth أو رمز الصفحة الرسمي إذا استمر التعثر. ${error instanceof Error ? error.message : ""}`.slice(0, 1000)
      : detail;
    if (connection) await db.upsertChannelConnection({ ...connection, status: "error", lastError: detail, lastVerifiedAt: new Date() });
  }

  await db.updateConnectionHealthMonitorCheck(monitor.id, { status, detail });
  if (monitor.lastNotifiedStatus === status) return { ok: true, status, notified: false, detail };

  const telegram = (await db.listChannelConnections(monitor.ownerId)).find(item => item.platform === "telegram" && item.status === "authorized");
  if (!telegram?.externalAccountRef) return { ok: true, status, notified: false, skipped: "telegram_not_connected" as const, detail };
  const title = status === "healthy" ? "اتصال Facebook سليم" : "تنبيه اتصال Facebook";
  const delivered = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title, detail });
  await db.recordNotificationEvent({ ownerId: monitor.ownerId, channel: "telegram", eventType: `facebook_health_${status}`, deliveryStatus: delivered.delivered ? "sent" : "failed", detail: delivered.reason });
  if (delivered.delivered) await db.markConnectionHealthMonitorNotified(monitor.id, status);
  return { ok: true, status, notified: delivered.delivered, detail };
}
