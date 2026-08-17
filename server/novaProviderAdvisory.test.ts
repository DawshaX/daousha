import { describe, expect, it } from "vitest";
import { getNOVAAdvisorProviderStatuses } from "./novaProviderAdvisory";

describe("سجل مزودي الاستشارة في NOVA", () => {
  it("يعرض Gemini وOpenAI دون كشف القيم السرية ويعطل Perplexity API", () => {
    const providers = getNOVAAdvisorProviderStatuses();
    expect(providers.map(provider => provider.id)).toEqual(["gemini", "openai", "perplexity"]);
    expect(providers.find(provider => provider.id === "perplexity")).toMatchObject({ status: "disabled", mode: "disabled" });
    expect(JSON.stringify(providers)).not.toMatch(/AIza|sk-/i);
  });
});
