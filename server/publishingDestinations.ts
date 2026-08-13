export type DistributionPlatform = "youtube" | "instagram" | "facebook" | "tiktok";

export type DistributionConnection = {
  platform: string;
  status: "disconnected" | "configured" | "authorized" | "error";
  credentialCiphertext?: string | null;
  scopeSummary?: string | null;
};

export type DistributionReadiness = {
  platform: DistributionPlatform;
  mode: "automatic_api" | "confirmation_required" | "not_authorized";
  eligible: boolean;
  reason: string;
};

const supportedPlatforms: DistributionPlatform[] = ["youtube", "instagram", "facebook", "tiktok"];

/**
 * Resolves publishing readiness without consulting a browser session.
 * A configured social account never becomes an automatic destination merely because it exists.
 */
export function resolveDistributionReadiness(connections: DistributionConnection[]): DistributionReadiness[] {
  return supportedPlatforms.map(platform => {
    const connection = connections.find(candidate => candidate.platform === platform);

    if (platform === "youtube" && connection?.status === "authorized" && connection.credentialCiphertext) {
      return {
        platform,
        mode: "automatic_api",
        eligible: true,
        reason: "YouTube OAuth مفوض، ويمكن للمهمة الدورية استخدام واجهة النشر الرسمية.",
      };
    }

    if (platform === "instagram" && connection?.status === "authorized") {
      return {
        platform,
        mode: "confirmation_required",
        eligible: true,
        reason: "حساب Instagram مفوض، لكن موصل النشر يطلب تأكيدًا خاصًا بكل Reel قبل الإرسال العام.",
      };
    }

    if (connection?.status === "authorized") {
      return {
        platform,
        mode: "confirmation_required",
        eligible: true,
        reason: "الحساب مفوض، لكن لا يوجد ناشر آلي مدمج لهذه المنصة بعد.",
      };
    }

    return {
      platform,
      mode: "not_authorized",
      eligible: false,
      reason: connection ? "الحساب مهيأ فقط؛ يلزم تفويض نشر رسمي قبل إدخاله في طابور التوزيع." : "لا يوجد حساب مسجل لهذه المنصة.",
    };
  });
}
