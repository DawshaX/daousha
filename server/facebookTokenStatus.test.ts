import { describe, expect, it } from "vitest";
import { classifyFacebookTokenFailure, facebookTokenStateMessage } from "./facebookTokenStatus";

describe("Facebook token status", () => {
  it("maps Meta OAuth invalidation to an actionable, secret-safe state", () => {
    const state = classifyFacebookTokenFailure({ httpStatus: 401, errorCode: 190, errorSubcode: 467 });
    expect(state).toBe("expired_or_revoked");
    expect(facebookTokenStateMessage(state)).toContain("انتهى رمز صفحة Facebook");
  });

  it("separates page permission mismatch and transient provider failures", () => {
    expect(classifyFacebookTokenFailure({ httpStatus: 403 })).toBe("mismatch");
    expect(classifyFacebookTokenFailure({ httpStatus: 503 })).toBe("unreachable");
  });
});
