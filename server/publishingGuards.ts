export type PublishPolicyInput = {
  mode: "human_review" | "guarded_auto";
  publicPublishingEnabled: boolean;
  ownerAutoApprovalEnabled: boolean;
  killSwitchEnabled: boolean;
  requirePrivateCanary: boolean;
  minIntervalMinutes: number;
  maxPublicationsPerDay: number;
  lastPublishedAt: Date | null;
};

export type PublishReadiness = {
  originalContent: boolean;
  rightsClear: boolean;
  safetyClear: boolean;
  previewAcknowledged: boolean;
  hasPrivateCanary: boolean;
  publicationsInLast24Hours: number;
};

export type PublishDecision = {
  allowed: boolean;
  visibility: "private" | "public";
  reason: string;
};

/**
 * Central, deterministic gate for public publishing. External upload code must
 * always invoke this function before it makes a YouTube API request.
 */
export function evaluatePublishGuard(
  policy: PublishPolicyInput,
  readiness: PublishReadiness,
  now = new Date(),
): PublishDecision {
  if (policy.killSwitchEnabled) {
    return { allowed: false, visibility: "private", reason: "مفتاح الإيقاف مفعّل." };
  }

  if (!readiness.originalContent || !readiness.rightsClear || !readiness.safetyClear) {
    return { allowed: false, visibility: "private", reason: "لم تكتمل فحوص الأصالة أو الحقوق أو السلامة." };
  }

  const ownerApprovalApplies = policy.ownerAutoApprovalEnabled
    && readiness.originalContent
    && readiness.rightsClear
    && readiness.safetyClear;

  if (!readiness.previewAcknowledged && !ownerApprovalApplies) {
    return { allowed: false, visibility: "private", reason: "لم يُسجّل إقرار معاينة النسخة النهائية بعد." };
  }

  if (readiness.publicationsInLast24Hours >= policy.maxPublicationsPerDay) {
    return { allowed: false, visibility: "private", reason: "تم بلوغ سقف النشر اليومي." };
  }

  if (policy.lastPublishedAt) {
    const elapsedMinutes = (now.getTime() - policy.lastPublishedAt.getTime()) / 60_000;
    if (elapsedMinutes < policy.minIntervalMinutes) {
      return { allowed: false, visibility: "private", reason: "لم ينقضِ الفاصل الأدنى بين المنشورات." };
    }
  }

  if (policy.requirePrivateCanary && !readiness.hasPrivateCanary) {
    return { allowed: true, visibility: "private", reason: "نسخة اختبار خاصة مطلوبة قبل النشر العام." };
  }

  if (policy.mode !== "guarded_auto" || !policy.publicPublishingEnabled) {
    return { allowed: false, visibility: "private", reason: "النشر العام الآلي غير مفعّل في السياسة الحالية." };
  }

  return {
    allowed: true,
    visibility: "public",
    reason: ownerApprovalApplies && !readiness.previewAcknowledged
      ? "موافقة المالك الدائمة فعّالة للمحتوى الأصلي الآمن بعد اجتياز الحواجز."
      : "اجتاز المشروع حواجز النشر العام.",
  };
}
