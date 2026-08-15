import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  getScheduleByTaskUid: vi.fn(), markScheduleExecuted: vi.fn(), getPublishingPolicy: vi.fn(), listPublishingRuns: vi.fn(), listChannelConnections: vi.fn(), listOwnedProjectVideoAssets: vi.fn(), createPublishingRun: vi.fn(), updatePublishingRun: vi.fn(), markPolicyPublished: vi.fn(), markProjectPublished: vi.fn(), setScheduleStatus: vi.fn(),
};
const guardMock = { evaluatePublishGuard: vi.fn() };
const notifierMock = { notifyOwnerOperationalEvent: vi.fn() };
const publisherMock = { uploadVettedVideoToYouTube: vi.fn() };
const instagramPublisherMock = { publishVettedInstagramReel: vi.fn() };
const facebookPublisherMock = { uploadVettedVideoToFacebookPage: vi.fn() };
vi.mock("./db", () => dbMock);
vi.mock("./publishingGuards", () => guardMock);
vi.mock("./operationalNotifications", () => notifierMock);
vi.mock("./youtubePublisher", () => publisherMock);
vi.mock("./instagramPublisher", () => instagramPublisherMock);
vi.mock("./facebookPublisher", () => facebookPublisherMock);
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

  it("dry-runs the Instagram route through its official publisher only", async () => {
    dbMock.getScheduleByTaskUid.mockResolvedValue({ id: 4, ownerId: 9, projectId: 4, platform: "instagram", status: "active" });
    guardMock.evaluatePublishGuard.mockReturnValue({ allowed: true, visibility: "public", reason: "جاهز" });
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "instagram", status: "authorized", credentialCiphertext: "cipher", scopeSummary: "instagram_business_content_publish" }]);
    instagramPublisherMock.publishVettedInstagramReel.mockResolvedValue({ reelId: "ig-44", url: "https://instagram.example/reel-44" });

    const result = await executeScheduledPublish("cron_4");

    expect(result).toMatchObject({ ok: true, published: true, url: "https://instagram.example/reel-44" });
    expect(instagramPublisherMock.publishVettedInstagramReel).toHaveBeenCalledTimes(1);
    expect(publisherMock.uploadVettedVideoToYouTube).not.toHaveBeenCalled();
    expect(facebookPublisherMock.uploadVettedVideoToFacebookPage).not.toHaveBeenCalled();
    expect(notifierMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "scheduled_instagram_upload", detail: expect.stringContaining("معرّف Reel: ig-44") }));
  });

  it("dry-runs the Facebook route through its Page publisher only", async () => {
    dbMock.getScheduleByTaskUid.mockResolvedValue({ id: 5, ownerId: 9, projectId: 4, platform: "facebook", status: "active" });
    guardMock.evaluatePublishGuard.mockReturnValue({ allowed: true, visibility: "public", reason: "جاهز" });
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "facebook", status: "authorized", credentialCiphertext: "cipher", externalAccountRef: "page-55" }]);
    facebookPublisherMock.uploadVettedVideoToFacebookPage.mockResolvedValue({ videoId: "fb-55", url: "https://facebook.example/video-55" });

    const result = await executeScheduledPublish("cron_5");

    expect(result).toMatchObject({ ok: true, published: true, url: "https://facebook.example/video-55" });
    expect(facebookPublisherMock.uploadVettedVideoToFacebookPage).toHaveBeenCalledTimes(1);
    expect(publisherMock.uploadVettedVideoToYouTube).not.toHaveBeenCalled();
    expect(instagramPublisherMock.publishVettedInstagramReel).not.toHaveBeenCalled();
    expect(notifierMock.notifyOwnerOperationalEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: "scheduled_facebook_upload", detail: expect.stringContaining("معرّف فيديو Facebook: fb-55") }));
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
