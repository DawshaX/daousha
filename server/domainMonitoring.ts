import { resolveNs } from "node:dns/promises";
import * as db from "./db";
import { sendTelegramOperationalNotification } from "./telegram";

const EXPECTED_NAMESERVERS = ["adele.ns.cloudflare.com", "vicente.ns.cloudflare.com"];

function describeDns(nameservers: string[]) {
  return `خوادم الاسم الحالية: ${nameservers.sort().join(", ")}`;
}

/** Idempotent, low-frequency check. It sends Telegram only when a monitor state has not yet been delivered. */
export async function executeEuOrgDomainMonitor(taskUid: string) {
  const monitor = await db.getDomainMonitorByTaskUid(taskUid);
  if (!monitor) return { ok: true, skipped: "orphan" as const };

  let status: "pending" | "delegated" = "pending";
  let detail = "لم يُفوض نطاق EU.org بعد في DNS العام.";
  try {
    const nameservers = await resolveNs(monitor.domain);
    const normalized = nameservers.map(name => name.toLowerCase().replace(/\.$/, ""));
    const delegated = EXPECTED_NAMESERVERS.every(expected => normalized.includes(expected));
    status = delegated ? "delegated" : "pending";
    detail = delegated
      ? `تم تفويض ${monitor.domain} إلى Cloudflare. ${describeDns(normalized)}`
      : `${describeDns(normalized)}. ما زال التفويض المتوقع إلى Cloudflare غير مكتمل.`;
  } catch {
    detail = `لم يُفوض ${monitor.domain} في DNS العام بعد؛ ما زال طلب EU.org قيد المراجعة.`;
  }

  const checked = await db.updateDomainMonitorCheck(monitor.id, { status, detail });
  if (monitor.lastNotifiedStatus === status) return { ok: true, status, notified: false, detail };

  const telegram = (await db.listChannelConnections(monitor.ownerId)).find(connection => connection.platform === "telegram" && connection.status === "authorized");
  if (!telegram?.externalAccountRef) return { ok: true, status, notified: false, skipped: "telegram_not_connected" as const, detail };

  const title = status === "delegated" ? "نطاق EU.org أصبح جاهزًا" : "مراقبة نطاق EU.org بدأت";
  const nextStep = status === "delegated"
    ? "الخطوة التالية: ربط CNAME بالاستضافة ثم تحديث نطاق وإعادة توجيه Meta."
    : "لا يلزم إجراء الآن؛ ستصل رسالة جديدة عند اكتمال التفويض.";
  const delivered = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title, detail: `${detail}\n${nextStep}` });
  await db.recordNotificationEvent({ ownerId: monitor.ownerId, channel: "telegram", eventType: `euorg_domain_${status}`, deliveryStatus: delivered.delivered ? "sent" : "failed", detail: delivered.reason });
  if (delivered.delivered) await db.markDomainMonitorNotified(monitor.id, status);
  return { ok: true, status, notified: delivered.delivered, detail };
}
