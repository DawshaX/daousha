import * as db from "./db";
import { sendTelegramOperationalNotification } from "./telegram";
import { getAuthenticatedInstagramProfile } from "./instagramOAuth";

type HealthStatus = "healthy" | "degraded" | "disconnected";

/** Idempotent, non-publishing Instagram token refresh and account identity check. */
export async function executeInstagramHealthMonitor(taskUid: string) {
  const monitor = await db.getConnectionHealthMonitorByTaskUid(taskUid);
  if (!monitor || monitor.platform !== "instagram") return { ok: true, skipped: "orphan" as const };
  const connection = await db.getChannelConnection(monitor.ownerId, "instagram");
  let status: HealthStatus = "disconnected";
  let detail = "لا يوجد تفويض Instagram صالح لمراقبته.";
  try {
    if (!connection || connection.status !== "authorized" || !connection.credentialCiphertext) throw new Error("missing_connection");
    const profile = await getAuthenticatedInstagramProfile(connection);
    if (connection.externalAccountRef && connection.externalAccountRef !== profile.id) throw new Error("account_mismatch");
    status = "healthy";
    detail = `اتصال Instagram سليم للحساب @${profile.username}. فُحص الرمز والحساب فقط؛ لم يُنشأ أو يُنشر أي Reel.`;
    await db.upsertChannelConnection({ ...connection, label: `@${profile.username}`.slice(0, 160), status: "authorized", credentialCiphertext: profile.credentialCiphertext, credentialExpiresAt: profile.credentialExpiresAt, lastVerifiedAt: new Date(), lastError: null });
  } catch (error) {
    status = connection?.credentialCiphertext ? "degraded" : "disconnected";
    detail = status === "degraded" ? `تعذّر تجديد أو التحقق من تفويض Instagram. أعد OAuth الرسمي إذا استمر التعثر. ${error instanceof Error ? error.message : ""}`.slice(0, 1000) : detail;
    if (connection) await db.upsertChannelConnection({ ...connection, status: "error", lastError: detail, lastVerifiedAt: new Date() });
  }
  await db.updateConnectionHealthMonitorCheck(monitor.id, { status, detail });
  if (monitor.lastNotifiedStatus === status) return { ok: true, status, notified: false, detail };
  const telegram = (await db.listChannelConnections(monitor.ownerId)).find(item => item.platform === "telegram" && item.status === "authorized");
  if (!telegram?.externalAccountRef) return { ok: true, status, notified: false, skipped: "telegram_not_connected" as const, detail };
  const title = status === "healthy" ? "اتصال Instagram سليم" : "تنبيه اتصال Instagram";
  const delivered = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title, detail });
  await db.recordNotificationEvent({ ownerId: monitor.ownerId, channel: "telegram", eventType: `instagram_health_${status}`, deliveryStatus: delivered.delivered ? "sent" : "failed", detail: delivered.reason });
  if (delivered.delivered) await db.markConnectionHealthMonitorNotified(monitor.id, status);
  return { ok: true, status, notified: delivered.delivered, detail };
}
