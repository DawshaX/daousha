export type RenewalConnection = {
  platform: string;
  status: string;
  credentialExpiresAt?: Date | string | null;
  lastError?: string | null;
};

export type ChannelRenewalGuidance = {
  platform: string;
  mode: "server_refresh" | "reauthorize" | "persistent" | "excluded" | "not_configured";
  title: string;
  detail: string;
};

export function buildChannelRenewalGuidance(connections: RenewalConnection[]): ChannelRenewalGuidance[] {
  const byPlatform = new Map(connections.map(connection => [connection.platform, connection]));
  const usable = (platform: string) => byPlatform.get(platform)?.status === "authorized";

  return [
    {
      platform: "youtube",
      mode: usable("youtube") ? "server_refresh" : "reauthorize",
      title: usable("youtube") ? "تجديد YouTube الخادمي" : "إعادة تفويض YouTube",
      detail: usable("youtube") ? "يفحص NOVA الرمز دورياً ويجدده من الخادم عند سماح Google بذلك؛ عند الإلغاء يظهر تنبيه ومسار OAuth الرسمي." : "يحتاج YouTube إلى OAuth رسمي صالح قبل أي مراقبة أو جدولة.",
    },
    {
      platform: "instagram",
      mode: usable("instagram") ? "server_refresh" : "reauthorize",
      title: usable("instagram") ? "تجديد Instagram الخادمي" : "إعادة تفويض Instagram",
      detail: usable("instagram") ? "يفحص NOVA الرمز والحساب دورياً ويجدد الوصول عند سماح Instagram API؛ التعثر يرسل تنبيهاً فقط." : "يحتاج Instagram API إلى OAuth رسمي صالح قبل أي تشغيل خلفي.",
    },
    {
      platform: "facebook",
      mode: usable("facebook") ? "reauthorize" : "not_configured",
      title: usable("facebook") ? "تنبيه إعادة تفويض Facebook" : "تفويض Facebook غير مكتمل",
      detail: usable("facebook") ? "يفحص NOVA هوية الصفحة والرمز دورياً. إذا ألغت Meta الرمز أو انتهى، يُحجب النشر ويطلب إعادة OAuth الرسمية؛ لا يوجد تجديد صامت مفترض." : "اربط صفحة Facebook برمز صفحة رسمي ثم فعّل مراقبة الصحة.",
    },
    {
      platform: "telegram",
      mode: usable("telegram") ? "persistent" : "not_configured",
      title: usable("telegram") ? "اقتران Telegram دائم" : "Telegram غير مرتبط",
      detail: usable("telegram") ? "يبقى Webhook مقيداً بالمحادثة الموثقة؛ لا يحتاج رمز قناة لتجديده، ويُعاد الربط فقط عند فصل المالك صراحةً." : "أنشئ رمز اقتران من NOVA ثم أرسله عبر /start في البوت.",
    },
    {
      platform: "tiktok",
      mode: "excluded",
      title: "TikTok خارج التشغيل الإنتاجي",
      detail: "لا تُنشأ مراقبة تجديد أو جدولة إنتاجية قبل قبول TikTok الرسمي وتفويض الإنتاج المستقل.",
    },
  ];
}
