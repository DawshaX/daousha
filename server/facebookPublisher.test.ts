import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./storage", () => ({ storageGetSignedUrl: vi.fn(async () => "https://storage.example.test/video.mp4") }));

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  vi.resetModules();
});

describe("Facebook Page publisher", () => {
  it("publishes only through the verified Page identity and honors private visibility", async () => {
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "secret-token";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "1265727539958933", name: "XDAW NOVA" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "video/mp4" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "video-123" }), { status: 200 }));
    globalThis.fetch = fetchMock as typeof fetch;
    const { uploadVettedVideoToFacebookPage } = await import("./facebookPublisher");

    const result = await uploadVettedVideoToFacebookPage(
      { externalAccountRef: "1265727539958933", status: "authorized" },
      { storageKey: "assets/reel.mp4", title: "XDAW NOVA", description: "Original bilingual content", visibility: "private" },
    );

    expect(result).toEqual({ videoId: "video-123", url: "https://www.facebook.com/watch/?v=video-123" });
    const request = fetchMock.mock.calls[2];
    expect(String(request?.[0])).toContain("/1265727539958933/videos");
    const form = request?.[1]?.body as FormData;
    expect(form.get("published")).toBe("false");
  });

  it("refuses to upload when the page token identity does not match the selected page", async () => {
    process.env.FACEBOOK_PAGE_ACCESS_TOKEN = "secret-token";
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "other-page", name: "Other" }), { status: 200 })) as typeof fetch;
    const { uploadVettedVideoToFacebookPage } = await import("./facebookPublisher");

    await expect(uploadVettedVideoToFacebookPage(
      { externalAccountRef: "1265727539958933", status: "authorized" },
      { storageKey: "assets/reel.mp4", title: "XDAW NOVA", description: "Original bilingual content", visibility: "private" },
    )).rejects.toThrow("لا يطابق صفحة XDAW NOVA");
  });
});
