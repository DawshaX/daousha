import { describe, expect, it } from "vitest";
import { evaluatePublishGuard } from "./publishingGuards";

const basePolicy = {
  mode: "guarded_auto" as const,
  publicPublishingEnabled: true,
  killSwitchEnabled: false,
  requirePrivateCanary: false,
  minIntervalMinutes: 10,
  maxPublicationsPerDay: 6,
  lastPublishedAt: null,
};

const readyContent = {
  originalContent: true,
  rightsClear: true,
  safetyClear: true,
  previewAcknowledged: true,
  hasPrivateCanary: true,
  publicationsInLast24Hours: 0,
};

describe("evaluatePublishGuard", () => {
  it("blocks immediately when the kill switch is enabled", () => {
    const decision = evaluatePublishGuard({ ...basePolicy, killSwitchEnabled: true }, readyContent);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("الإيقاف");
  });

  it("requires a private canary before public publishing when configured", () => {
    const decision = evaluatePublishGuard({ ...basePolicy, requirePrivateCanary: true }, { ...readyContent, hasPrivateCanary: false });
    expect(decision).toEqual({ allowed: true, visibility: "private", reason: "نسخة اختبار خاصة مطلوبة قبل النشر العام." });
  });

  it("blocks public publishing when the daily cap is reached", () => {
    const decision = evaluatePublishGuard(basePolicy, { ...readyContent, publicationsInLast24Hours: 6 });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("سقف النشر اليومي");
  });

  it("blocks publishing again before the configurable minimum interval has elapsed", () => {
    const decision = evaluatePublishGuard({ ...basePolicy, minIntervalMinutes: 10, lastPublishedAt: new Date(Date.now() - 9 * 60_000) }, readyContent);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("الفاصل الأدنى");
  });

  it("blocks all upload paths until the final preview acknowledgement is stored", () => {
    const decision = evaluatePublishGuard(basePolicy, { ...readyContent, previewAcknowledged: false });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain("معاينة");
  });

  it("uses the standing owner approval only for original content that has passed rights and safety", () => {
    const decision = evaluatePublishGuard({ ...basePolicy, ownerAutoApprovalEnabled: true }, { ...readyContent, previewAcknowledged: false });
    expect(decision).toEqual({ allowed: true, visibility: "public", reason: "موافقة المالك الدائمة فعّالة للمحتوى الأصلي الآمن بعد اجتياز الحواجز." });

    const blocked = evaluatePublishGuard({ ...basePolicy, ownerAutoApprovalEnabled: true }, { ...readyContent, previewAcknowledged: false, rightsClear: false });
    expect(blocked.allowed).toBe(false);
    expect(blocked.reason).toContain("الحقوق");
  });

  it("allows public publishing only after all safeguards pass", () => {
    const decision = evaluatePublishGuard(basePolicy, readyContent);
    expect(decision).toEqual({ allowed: true, visibility: "public", reason: "اجتاز المشروع حواجز النشر العام." });
  });
});
