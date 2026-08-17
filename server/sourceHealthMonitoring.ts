import * as db from "./db";
import { sendTelegramOperationalNotification } from "./telegram";

type SourceProbe = { name: string; ok: boolean; detail: string };

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

async function probeApprovedSource(source: { name: string; url: string }): Promise<SourceProbe> {
  if (!isPublicHttpUrl(source.url)) return { name: source.name, ok: false, detail: "رابط غير صالح للفحص الخارجي" };
  try {
    const response = await fetch(source.url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(12_000) });
    if (response.ok || response.status === 405) return { name: source.name, ok: true, detail: `HTTP ${response.status}` };
    return { name: source.name, ok: false, detail: `HTTP ${response.status}` };
  } catch {
    return { name: source.name, ok: false, detail: "تعذر الاتصال" };
  }
}

/** Idempotent, read-only availability check for up to six owner-approved sources. */
export async function executeSourceHealthMonitor(taskUid: string) {
  const monitor = await db.getSourceHealthMonitorByTaskUid(taskUid);
  if (!monitor) return { ok: true, skipped: "orphan" as const };
  const sources = (await db.listSources(monitor.ownerId)).filter(source => source.trustStatus === "approved").slice(0, 6);
  const probes = await Promise.all(sources.map(probeApprovedSource));
  const failed = probes.filter(probe => !probe.ok);
  const status = failed.length ? "degraded" as const : "healthy" as const;
  const summary = sources.length
    ? `فُحصت ${sources.length} مصادر معتمدة: المتاح ${probes.length - failed.length}، المتعثر ${failed.length}${failed.length ? ` (${failed.map(item => `${item.name}: ${item.detail}`).join("، ")})` : ""}. لم يُجلب محتوى ولم تُضف معرفة تلقائيًا.`
    : "لا توجد مصادر معتمدة للفحص. لم يُجلب محتوى ولم تُضف معرفة تلقائيًا.";
  await db.updateSourceHealthMonitorCheck(monitor.id, { status, summary });
  if (monitor.lastNotifiedStatus === status) return { ok: true, status, notified: false, summary };
  const telegram = (await db.listChannelConnections(monitor.ownerId)).find(item => item.platform === "telegram" && item.status === "authorized");
  if (!telegram?.externalAccountRef) return { ok: true, status, notified: false, skipped: "telegram_not_connected" as const, summary };
  const delivered = await sendTelegramOperationalNotification({ chatId: telegram.externalAccountRef, title: status === "healthy" ? "مراقبة مصادر NOVA سليمة" : "تنبيه مراقبة مصادر NOVA", detail: summary });
  await db.recordNotificationEvent({ ownerId: monitor.ownerId, channel: "telegram", eventType: `source_health_${status}`, deliveryStatus: delivered.delivered ? "sent" : "failed", detail: delivered.reason });
  if (delivered.delivered) await db.markSourceHealthMonitorNotified(monitor.id, status);
  return { ok: true, status, notified: delivered.delivered, summary };
}
