import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Asset Vault rights evidence", () => {
  it("يجمع رابط الأصل ورابط الترخيص قبل إرسال المادة إلى بوابة الحقوق", async () => {
    const source = await readFile(new URL("./AssetVault.tsx", import.meta.url), "utf8");

    expect(source).toContain('const [sourceUrl, setSourceUrl] = useState("")');
    expect(source).toContain('const [licenseUrl, setLicenseUrl] = useState("")');
    expect(source).toContain("licenseUrl: licenseUrl.trim() || undefined");
    expect(source).toContain('placeholder="رابط الأصل"');
    expect(source).toContain('placeholder="رابط الترخيص"');
    expect(source).toContain("تبقى المادة معلقة حتى اعتماد الحقوق والسلامة");
  });
});
