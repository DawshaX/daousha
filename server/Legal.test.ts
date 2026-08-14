import { describe, expect, it } from "vitest";
import { legalPages } from "./Legal";

describe("صفحات الامتثال لتطبيق Meta", () => {
  it("تتضمن الخصوصية والشروط وحذف البيانات ومسار تواصل واضح", () => {
    expect(Object.keys(legalPages)).toEqual(["privacy", "terms", "data-deletion"]);
    expect(legalPages.privacy.sections.map((section) => section.body).join(" ")).toContain("DawshaxLOL@gmail.com");
    expect(legalPages.terms.sections).toHaveLength(4);
    expect(legalPages["data-deletion"].sections.map((section) => section.title)).toContain("الطلب");
  });
});
