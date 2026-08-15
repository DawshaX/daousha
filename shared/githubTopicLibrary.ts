export type GitHubTopicIdea = {
  id: string;
  topic: string;
  angle: string;
  sourceStatus: "pending-narration" | "queued";
};

/**
 * Snapshot reviewed from DawshaX/daousha/scripts/topic_library.json on 2026-08-15.
 * It is intentionally a curated idea queue, not a remote execution source.
 */
export const githubTopicLibrarySource = "https://github.com/DawshaX/daousha/blob/main/scripts/topic_library.json";

export const githubTopicIdeas: readonly GitHubTopicIdea[] = [
  { id: "ep5-pending", topic: "أسرار النوم", angle: "3 اكتشافات عن دماغك النائم", sourceStatus: "pending-narration" },
  { id: "ep6", topic: "النوم والأحلام", angle: "لماذا نحلم؟ 3 أسرار علمية", sourceStatus: "queued" },
  { id: "ep7", topic: "الجاذبية الأرضية", angle: "3 أشياء لا تعرفها عن الجاذبية", sourceStatus: "queued" },
  { id: "ep8", topic: "المحيطات", angle: "3 أسرار لم يكتشفها البشر في أعماق المحيطات", sourceStatus: "queued" },
  { id: "ep9", topic: "الفضاء والشمس", angle: "3 حقائق صادمة عن شمسنا", sourceStatus: "queued" },
  { id: "ep10", topic: "DNA", angle: "3 أسرار في حمضك النووي ستدهشك", sourceStatus: "queued" },
  { id: "ep11", topic: "النمل", angle: "3 حقائق مذهلة عن عالم النمل", sourceStatus: "queued" },
  { id: "ep12", topic: "الوقت", angle: "3 مفارقات غريبة عن الوقت", sourceStatus: "queued" },
  { id: "ep13", topic: "اللغة العربية", angle: "3 حقائق عن أقوى لغة في التاريخ", sourceStatus: "queued" },
  { id: "ep14", topic: "القطط", angle: "3 أسرار عن أذكى حيوان أليف", sourceStatus: "queued" },
  { id: "ep15", topic: "التاريخ الإسلامي", angle: "3 اختراعات إسلامية غيّرت العالم", sourceStatus: "queued" },
  { id: "ep16", topic: "الماء", angle: "3 حقائق غريبة عن الماء لا تعرفها", sourceStatus: "queued" },
  { id: "ep17", topic: "النحل", angle: "3 أسرار عن نحل العسل ستدهشك", sourceStatus: "queued" },
  { id: "ep18", topic: "الحديد في جسمك", angle: "3 حقائق صادمة عن جسمك", sourceStatus: "queued" },
  { id: "ep19", topic: "القمر", angle: "3 أسرار عن القمر لم تسمعها", sourceStatus: "queued" },
  { id: "ep20", topic: "الصوت", angle: "3 حقائق عن الصوت ستندهش لها", sourceStatus: "queued" },
  { id: "ep21", topic: "البرق", angle: "3 حقائق صادمة عن البرق", sourceStatus: "queued" },
  { id: "ep22", topic: "العين المجردة", angle: "3 أشياء لا تراها عينك لكنها حولك", sourceStatus: "queued" },
  { id: "ep23", topic: "الجاذبية والصفر", angle: "3 حقائق عن الفضاء والفراغ", sourceStatus: "queued" },
  { id: "ep24", topic: "الدماغ والتعلم", angle: "3 أسرار عن التعلم السريع", sourceStatus: "queued" },
  { id: "ep25", topic: "الطاقة الشمسية", angle: "3 حقائق عن طاقة الشمس الهائلة", sourceStatus: "queued" },
];

export function topicIdeaBrief(idea: GitHubTopicIdea): string {
  return `فكرة مستوردة للمراجعة من مكتبة موضوعات XDAW NOVA: «${idea.angle}». يلزم التحقق من الحقائق والمصادر، وبناء معالجة أصلية قبل إنشاء مشروع أو نشر.`;
}
