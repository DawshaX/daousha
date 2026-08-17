import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("ChannelControlCenter distribution panel", () => {
  it("renders the parallel destinations panel from server readiness rather than browser-session state", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain("وجهات النشر المتوازي");
    expect(source).toContain("integrations?.distributionReadiness");
    expect(source).toContain("لا تستخدم أي جلسة متصفح شخصية");
    expect(source).toContain('mode === "automatic_api"');
    expect(source).toContain('mode === "confirmation_required"');
  });

  it("links the YouTube banner asset without applying it to the external channel", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain("xdaw-nova-youtube-banner-approved_41a79b1b.png");
    expect(source).toContain("راجع القصاصات داخل YouTube Studio قبل تطبيقه");
  });

  it("distinguishes Meta app setup from an active Facebook Page token", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain('if (status === "error") return "يحتاج مراجعة"');
    expect(source).toContain("تهيئة تطبيق Meta لا تثبت صلاحية رمز الصفحة");
    expect(source).toContain("يظل رفع Facebook محجوبًا");
  });

  it("offers an explicit YouTube health monitor that cannot publish content", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain("activateYouTubeHealthMonitor");
    expect(source).toContain("لا ينفذ هذا الفحص رفعًا أو نشرًا");
  });

  it("offers an explicitly non-publishing Instagram token health monitor", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain("activateInstagramHealthMonitor");
    expect(source).toContain("لا ينفذ هذا الفحص إنشاء أو نشر Reel");
  });

  it("offers an explicitly non-publishing Facebook Page health monitor", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain("activateFacebookHealthMonitor");
    expect(source).toContain("لا يرفع أو ينشر هذا الفحص أي فيديو");
  });

  it("shows Facebook's live authorization state instead of a stale expiry warning", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain('facebook?.status === "authorized"');
    expect(source).toContain("رُبطت صفحة Facebook رسميًا");
    expect(source).not.toContain("أظهر فحص القراءة المحدود في 15 أغسطس");
  });

  it("renders channel renewal guidance rather than implying every provider can refresh silently", async () => {
    const source = await readFile(new URL("./ChannelControlCenter.tsx", import.meta.url), "utf8");
    expect(source).toContain("تجديد التفويضات وحدود الاستمرارية");
    expect(source).toContain("integrations?.renewalGuidance");
  });
});
