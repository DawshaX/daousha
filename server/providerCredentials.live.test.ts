import { describe, expect, it } from "vitest";

const unauthorized = new Set([401, 403]);

async function assertUsableCredential(provider: string, response: Response) {
  const body = await response.text();
  expect(unauthorized.has(response.status), `${provider}: credential rejected`).toBe(false);
  expect(response.status, `${provider}: unexpected provider response ${body.slice(0, 180)}`).toBeLessThan(500);
  expect([200, 429], `${provider}: the endpoint did not confirm an authenticated request`).toContain(response.status);
}

describe("official provider credential checks", () => {
  it("validates Gemini and OpenAI using low-impact model-list endpoints", async () => {
    const [gemini, openai] = await Promise.all([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(process.env.GEMINI_API_KEY ?? "")}`),
      fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}` } }),
    ]);

    await assertUsableCredential("Gemini", gemini);
    await assertUsableCredential("OpenAI", openai);
  }, 20_000);
});
