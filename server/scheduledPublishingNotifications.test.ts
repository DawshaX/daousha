import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  getScheduleByTaskUid: vi.fn(), markScheduleExecuted: vi.fn(), getPublishingPolicy: vi.fn(), listPublishingRuns: vi.fn(), listChannelConnections: vi.fn(), listOwnedProjectVideoAssets: vi.fn(), createPublishingRun: vi.fn(), updatePublishingRun: vi.fn(), markPolicyPublished: vi.fn(), markProjectPublished: vi.fn(), setScheduleStatus: vi.fn(),
};
const guardMock = { evaluatePublishGuard: vi.fn() };
const notifierMock = { notifyOwnerOperationalEvent: vi.fn() };
const publisherMock = { uploadVettedVideoToYouTube: vi.fn() };
vi.mock("./db", () => dbMock);
vi.mock("./publishingGuards", () => guardMock);
vi.mock("./operationalNotifications", () => notifierMock);
vi.mock("./youtubePublisher", () => publisherMock);
const { executeScheduledPublish } = await import("./scheduledPublishing");

describe("scheduled publishing notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getScheduleByTaskUid.mockResolvedValue({ id: 3, ownerId: 9, projectId: 4, platform: "youtube", status: "active" });
    dbMock.markScheduleExecuted.mockResolvedValue(undefined);
    dbMock.getPublishingPolicy.mockResolvedValue({});
    dbMock.listPublishingRuns.mockResolvedValue([]);
    dbMock.listChannelConnections.mockResolvedValue([]);
    dbMock.listOwnedProjectVideoAssets.mockResolvedValue([{ project: { id: 4, title: "مشروع" }, asset: { licenseType: "original", licenseStatus: "approved", safetyStatus: "clear", storageKey: "video.mp4" }, link: { clipRole: "primary" } }]);
    dbMock.createPublishingRun.mockResolvedValue({ id: 77 });
    dbMock.updatePublishingRun.mockResolvedValue({ id: 77 });
    dbMock.setScheduleStatus.mockResolvedValue(undefined);
    notifierMock.notifyOwnerOperationalEvent.mockResolvedValue({ delivered: false });
  });

  it("pauses a guard-blocked schedule for review and sends one recorded operational notification", async () => {
    guardMock.evaluatePublishGuard.mockReturnValue({ allowed: false, reason: "المعاينة غير مؤكدة" });
    const result = await executeScheduledPublish("cron_3");
    expect(result).toMatchObject({ ok: true, skipped: "guard_blocked", scheduleId: 3 });
    expect(dbMock.setScheduleStatus).toHaveBeenCalledWith(9, 3, "needs_approval");
    expect(notifierMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 9, eventType: "schedule_needs_review" }));
  });

  it("records the scheduled upload result with the video identifier and URL", async () => {
    guardMock.evaluatePublishGuard.mockReturnValue({ allowed: true, visibility: "public", reason: "جاهز" });
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "youtube", status: "authorized", credentialCiphertext: "cipher" }]);
    publisherMock.uploadVettedVideoToYouTube.mockResolvedValue({ videoId: "yt-77", url: "https://youtube.example/yt-77" });

    const result = await executeScheduledPublish("cron_3");
    expect(result).toMatchObject({ ok: true, published: true, url: "https://youtube.example/yt-77" });
    expect(notifierMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ publishingRunId: 77, eventType: "scheduled_youtube_upload", detail: expect.stringContaining("معرّف الفيديو: yt-77") }));
    expect(notifierMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ detail: expect.stringContaining("https://youtube.example/yt-77") }));
  });

  it("records a failure notification and pauses the schedule when the upload provider errors", async () => {
    guardMock.evaluatePublishGuard.mockReturnValue({ allowed: true, visibility: "private", reason: "جاهز" });
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "youtube", status: "authorized", credentialCiphertext: "cipher" }]);
    publisherMock.uploadVettedVideoToYouTube.mockRejectedValue(new Error("provider unavailable"));

    await expect(executeScheduledPublish("cron_3")).rejects.toThrow("provider unavailable");
    expect(dbMock.updatePublishingRun).toHaveBeenCalledWith(9, 77, { status: "failed" });
    expect(dbMock.setScheduleStatus).toHaveBeenCalledWith(9, 3, "failed");
    expect(notifierMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ publishingRunId: 77, eventType: "scheduled_youtube_failed", detail: expect.stringContaining("provider unavailable") }));
  });
});
