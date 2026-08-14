import { describe, expect, it } from "vitest";
import { describeUploadFailure } from "./uploadFailureDetail";

describe("upload failure detail", () => {
  it("keeps a useful provider error while redacting apparent secrets", () => {
    const detail = describeUploadFailure(new Error("provider unavailable; access_token=super-secret; Bearer abc.def.ghi"));
    expect(detail).toContain("provider unavailable");
    expect(detail).toContain("access_token=[محجوب]");
    expect(detail).not.toContain("super-secret");
    expect(detail).not.toContain("abc.def.ghi");
  });
});
