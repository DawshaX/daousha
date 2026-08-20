import { invokeLLM, listLLMModels } from "./_core/llm";

type ProjectBrief = { title: string; brief: string | null; targetLanguage: "ar" | "en" | "both" };

export type ScriptDraft = {
  arabicScript: string;
  englishScript: string;
  hook: string;
  rightsNote: string;
  safetyNote: string;
};

export async function generateOriginalScript(project: ProjectBrief): Promise<ScriptDraft> {
  const { data: models } = await listLLMModels();
  const model = models.find(item => item.id === "gpt-5-mini")?.id ?? models[0]?.id;
  if (!model) throw new Error("لا يوجد نموذج ذكاء اصطناعي متاح حاليًا.");
  const response = await invokeLLM({
    model,
    messages: [
      { role: "system", content: "أنت محرر فيديو عربي دقيق. أنتج نصوصًا أصلية فقط، ولا تنسخ أو تعيد صياغة مصدر محمي. تجنب الادعاءات غير الموثقة، والعنف الضار، وأي محتوى يعرّض الأطفال أو الأشخاص للخطر. المخرج JSON فقط." },
      { role: "user", content: `أنشئ مسودة فيديو قصيرة ثنائية اللغة لمشروع دعوشة التالي. العنوان: ${project.title}\nالموجز: ${project.brief ?? "لا يوجد موجز إضافي"}\nاللغة المستهدفة: ${project.targetLanguage}. اجعل النص العربي والإنجليزي متوازيين في المعنى، مع خطاف واضح، واقتراحات لمرئيات أصلية أو مرخّصة فقط.` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "daousha_script_draft",
        strict: true,
        schema: {
          type: "object",
          properties: {
            arabicScript: { type: "string" },
            englishScript: { type: "string" },
            hook: { type: "string" },
            rightsNote: { type: "string" },
            safetyNote: { type: "string" },
          },
          required: ["arabicScript", "englishScript", "hook", "rightsNote", "safetyNote"],
          additionalProperties: false,
        },
      },
    },
  });
  const content = response.choices[0]?.message.content;
  if (!content || typeof content !== "string") throw new Error("تعذر إنشاء المسودة النصية.");
  return JSON.parse(content) as ScriptDraft;
}
