import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  getSourceHealthMonitorByTaskUid: vi.fn(),
  listSources: vi.fn(),
  updateSourceHealthMonitorCheck: vi.fn(),
  listChannelConnections: vi.fn(),
  recordNotificationEvent: vi.fn(),
  markSourceHealthMonitorNotified: vi.fn(),
};
const telegramMock = { sendTelegramOperationalNotification: vi.fn() };

vi.mock("./db", () => dbMock);
vi.mock("./telegram", () => telegramMock);

const { executeSourceHealthMonitor } = await import("./sourceHealthMonitoring");

describe("مراقب مصادر NOVA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getSourceHealthMonitorByTaskUid.mockResolvedValue({ id: 9, ownerId: 7, scheduleCronTaskUid: "source-task", lastNotifiedStatus: null });
    dbMock.listSources.mockResolvedValue([
      { id: 1, name: "UNESCO", url: "https://www.unesco.org", trustStatus: "approved" },
      { id: 2, name: "مصدر غير معتمد", url: "https://example.org", trustStatus: "proposed" },
    ]);
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "telegram", status: "authorized", externalAccountRef: "99" }]);
    telegramMock.sendTelegramOperationalNotification.mockResolvedValue({ delivered: true });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("يتجاهل مهمة Heartbeat اليتيمة دون أي فحص خارجي", async () => {
    dbMock.getSourceHealthMonitorByTaskUid.mockResolvedValue(null);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(executeSourceHealthMonitor("missing-task")).resolves.toMatchObject({ skipped: "orphan" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("يفحص المصادر المعتمدة فقط ولا يضيف معرفة أو محتوى تلقائيًا", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSourceHealthMonitor("source-task");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("https://www.unesco.org", expect.objectContaining({ method: "HEAD" }));
    expect(dbMock.updateSourceHealthMonitorCheck).toHaveBeenCalledWith(9, expect.objectContaining({ status: "healthy", summary: expect.stringContaining("لم يُجلب محتوى") }));
    expect(telegramMock.sendTelegramOperationalNotification).toHaveBeenCalledWith(expect.objectContaining({ chatId: "99" }));
    expect(dbMock.markSourceHealthMonitorNotified).toHaveBeenCalledWith(9, "healthy");
    expect(result).toMatchObject({ status: "healthy", notified: true });
  });

  it("يحوّل رابطًا داخليًا غير صالح إلى حالة متعثرة دون طلبه", async () => {
    dbMock.listSources.mockResolvedValue([{ id: 1, name: "رابط داخلي", url: "http://127.0.0.1/admin", trustStatus: "approved" }]);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await executeSourceHealthMonitor("source-task");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(dbMock.updateSourceHealthMonitorCheck).toHaveBeenCalledWith(9, expect.objectContaining({ status: "degraded" }));
    expect(result).toMatchObject({ status: "degraded" });
  });
});
