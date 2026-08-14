import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = { listChannelConnections: vi.fn(), recordNotificationEvent: vi.fn() };
const telegramMock = { sendTelegramOperationalNotification: vi.fn() };
vi.mock("./db", () => dbMock);
vi.mock("./telegram", () => telegramMock);
const { notifyOwnerOperationalEvent } = await import("./operationalNotifications");

describe("operational notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.recordNotificationEvent.mockResolvedValue({ id: 1 });
  });

  it("delivers to an authorized Telegram connection and records the attempt", async () => {
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "telegram", status: "authorized", externalAccountRef: "123" }]);
    telegramMock.sendTelegramOperationalNotification.mockResolvedValue({ delivered: true, reason: "تم إرسال إشعار Telegram." });
    const result = await notifyOwnerOperationalEvent({ ownerId: 7, eventType: "review_required", title: "مراجعة", detail: "مادة" });
    expect(result.delivered).toBe(true);
    expect(dbMock.recordNotificationEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, deliveryStatus: "sent", eventType: "review_required" }));
  });

  it("records an undelivered event when Telegram is not authorized without throwing", async () => {
    dbMock.listChannelConnections.mockResolvedValue([]);
    const result = await notifyOwnerOperationalEvent({ ownerId: 7, eventType: "publish_failed", title: "تعثر", detail: "رفع" });
    expect(result.delivered).toBe(false);
    expect(telegramMock.sendTelegramOperationalNotification).not.toHaveBeenCalled();
    expect(dbMock.recordNotificationEvent).toHaveBeenCalledWith(expect.objectContaining({ deliveryStatus: "failed", eventType: "publish_failed" }));
  });
});
