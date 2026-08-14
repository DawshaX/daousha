import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("manual upload failure notifications", () => {
  it("uses the safe provider-error detail for YouTube and Facebook failure events", async () => {
    const source = await readFile(new URL("./routers.ts", import.meta.url), "utf8");
    expect(source).toContain('eventType: "youtube_upload_failed"');
    expect(source).toContain('eventType: "facebook_upload_failed"');
    expect(source.match(/describeUploadFailure\(error\)/g)).toHaveLength(2);
  });
});
