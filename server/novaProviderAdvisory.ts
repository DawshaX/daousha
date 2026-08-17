import { ENV } from "./_core/env";

export const NOVA_ADVISOR_PROVIDERS = ["gemini", "openai"] as const;
export type NOVAAdvisorProvider = typeof NOVA_ADVISOR_PROVIDERS[number];

type ProviderStatus = {
  id: NOVAAdvisorProvider | "perplexity";
  title: string;
  status: "ready" | "not_configured" | "disabled";
  mode: "manual_draft" | "disabled";
  detail: string;
};

const MAX_ADVISORY_PROMPT_LENGTH = 6_000;
const sensitiveInputPattern = /(password|secret|api[_ -]?key|access[_ -]?token|bearer\s+|otp|رمز\s*(?:تحقق|دخول)|كلمة\s*مرور)/i;

function requireSafePrompt(prompt: string) {
  const normalized = prompt.trim();
  if (normalized.length < 3 || normalized.length > MAX_ADVISORY_PROMPT_LENGTH) {
    throw new Error("يجب أن تكون رسالة الاستشارة بين 3 و6000 حرف.");
  }
  if (sensitiveInputPattern.test(normalized)) {
    throw new Error("لا ترسل كلمات مرور أو رموزًا أو مفاتيح وصول إلى أي مزود. اطلب مسودة غير حساسة فقط.");
  }
  return normalized;
}

function providerSystemInstruction(language: "ar" | "en" | "both") {
  const languageInstruction = language === "en" ? "Respond in English." : language === "ar" ? "أجب بالعربية الواضحة." : "أجب بالعربية والإنجليزية عند الحاجة.";
  return `You are an advisory drafting assistant inside XDAW NOVA. ${languageInstruction}
Your output is a non-binding content draft only. Do not claim to publish, schedule, authorize, change policy, access accounts, download third-party media, remove watermarks, bypass controls, or use confidential credentials. Respect copyright and require licensed or original materials. Keep the answer concise and practical.`;
}

export function getNOVAAdvisorProviderStatuses(): ProviderStatus[] {
  return [
    {
      id: "gemini",
      title: "Google Gemini",
      status: ENV.geminiApiKey ? "ready" : "not_configured",
      mode: "manual_draft",
      detail: ENV.geminiApiKey ? "مفتاح متاح؛ لا تُرسل أي مطالبة إلا عند طلب مسودة صريح من المالك. قد يخضع الاستدعاء لحصة أو رصيد الحساب لدى المزود." : "لم يُضف مفتاح Gemini للخادم.",
    },
    {
      id: "openai",
      title: "OpenAI",
      status: ENV.openaiApiKey ? "ready" : "not_configured",
      mode: "manual_draft",
      detail: ENV.openaiApiKey ? "مفتاح متاح؛ لا تُرسل أي مطالبة إلا عند طلب مسودة صريح من المالك. قد يخضع الاستدعاء لحصة أو رصيد الحساب لدى المزود." : "لم يُضف مفتاح OpenAI للخادم.",
    },
    {
      id: "perplexity",
      title: "Perplexity",
      status: "disabled",
      mode: "disabled",
      detail: "واجهة API متوقفة بقرار المالك لعدم تفعيل رصيد مدفوع؛ يبقى البحث اليدوي الموثق هو البديل.",
    },
  ];
}

function extractOpenAIText(payload: unknown) {
  const content = (payload as { choices?: Array<{ message?: { content?: unknown } }> })?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content.trim() : "";
}

function extractGeminiText(payload: unknown) {
  const parts = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }> })?.candidates?.[0]?.content?.parts ?? [];
  return parts.map(part => typeof part.text === "string" ? part.text : "").join("\n").trim();
}

async function requestOpenAI(prompt: string, language: "ar" | "en" | "both") {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ENV.openaiApiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.4, max_tokens: 900, messages: [{ role: "system", content: providerSystemInstruction(language) }, { role: "user", content: prompt }] }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`تعذر استدعاء OpenAI (${response.status}).`);
  const content = extractOpenAIText(await response.json());
  if (!content) throw new Error("أعاد OpenAI استجابة بلا نص.");
  return { content, model: "gpt-4o-mini" };
}

async function requestGemini(prompt: string, language: "ar" | "en" | "both") {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system_instruction: { parts: [{ text: providerSystemInstruction(language) }] }, contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 900 } }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) throw new Error(`تعذر استدعاء Gemini (${response.status}).`);
  const content = extractGeminiText(await response.json());
  if (!content) throw new Error("أعاد Gemini استجابة بلا نص.");
  return { content, model: "gemini-2.0-flash" };
}

export async function createNOVAAdvisorDraft(input: { provider: NOVAAdvisorProvider; prompt: string; language: "ar" | "en" | "both" }) {
  const prompt = requireSafePrompt(input.prompt);
  const available = getNOVAAdvisorProviderStatuses().find(provider => provider.id === input.provider);
  if (!available || available.status !== "ready") throw new Error("هذا المزود غير متاح حاليًا لمسودات NOVA.");

  const response = input.provider === "openai" ? await requestOpenAI(prompt, input.language) : await requestGemini(prompt, input.language);
  return { provider: input.provider, ...response, mode: "manual_draft" as const, safetyNote: "هذه مسودة إرشادية فقط. لا تنشئ نشرًا أو جدولًا أو اعتمادًا ولا تتجاوز بوابة الحقوق والسلامة." };
}
