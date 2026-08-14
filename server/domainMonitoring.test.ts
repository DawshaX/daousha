import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  getDomainMonitorByTaskUid: vi.fn(),
  updateDomainMonitorCheck: vi.fn(),
  listChannelConnections: vi.fn(),
  recordNotificationEvent: vi.fn(),
  markDomainMonitorNotified: vi.fn(),
};
const dnsMock = { resolveNs: vi.fn() };
const telegramMock = { sendTelegramOperationalNotification: vi.fn() };

vi.mock("./db", () => dbMock);
vi.mock("node:dns/promises", () => dnsMock);
vi.mock("./telegram", () => telegramMock);

const { executeEuOrgDomainMonitor } = await import("./domainMonitoring");

describe("EU.org domain monitor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getDomainMonitorByTaskUid.mockResolvedValue({ id: 9, ownerId: 1, domain: "xdawnova.int.eu.org", status: "pending", lastNotifiedStatus: "pending" });
    dbMock.updateDomainMonitorCheck.mockResolvedValue(undefined);
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "telegram", status: "authorized", externalAccountRef: "1890579200" }]);
    telegramMock.sendTelegramOperationalNotification.mockResolvedValue({ delivered: true, reason: "تم إرسال إشعار Telegram." });
  });

  it("marks the domain delegated and notifies once when both Cloudflare nameservers are visible", async () => {
    dnsMock.resolveNs.mockResolvedValue(["adele.ns.cloudflare.com.", "vicente.ns.cloudflare.com."]);

    const result = await executeEuOrgDomainMonitor("cron_euorg");

    expect(dbMock.updateDomainMonitorCheck).toHaveBeenCalledWith(9, expect.objectContaining({ status: "delegated" }));
    expect(telegramMock.sendTelegramOperationalNotification).toHaveBeenCalledWith(expect.objectContaining({ title: "نطاق EU.org أصبح جاهزًا" }));
    expect(dbMock.markDomainMonitorNotified).toHaveBeenCalledWith(9, "delegated");
    expect(result).toMatchObject({ ok: true, status: "delegated", notified: true });
  });
});
