import { describe, expect, it } from "vitest";
import { buildTikTokSandboxDraftInitPayload } from "./tiktokSandboxPublisher";

describe("TikTok Sandbox draft upload payload", () => {
  it("uses FILE_UPLOAD and a single complete chunk for a controlled draft-only transfer", () => {
    expect(buildTikTokSandboxDraftInitPayload(5_650_775)).toEqual({
      source_info: {
        source: "FILE_UPLOAD",
        video_size: 5_650_775,
        chunk_size: 5_650_775,
        total_chunk_count: 1,
      },
    });
  });

  it("rejects empty file metadata before it reaches TikTok", () => {
    expect(() => buildTikTokSandboxDraftInitPayload(0)).toThrow("حجم فيديو Sandbox غير صالح");
  });
});
