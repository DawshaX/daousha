export const platformReferences = [
  { name: "Pexels", kind: "لقطات مرخّصة", url: "https://www.pexels.com" },
  { name: "Pixabay", kind: "لقطات وصور", url: "https://pixabay.com" },
  { name: "Freesound", kind: "مؤثرات صوتية", url: "https://freesound.org" },
  { name: "ccMixter", kind: "موسيقى مرخّصة", url: "https://ccmixter.org" },
  { name: "YouTube Audio Library", kind: "صوتيات للقناة", url: "https://studio.youtube.com" },
  { name: "Archive.org", kind: "مواد أرشيفية", url: "https://archive.org" },
  { name: "Google Trends", kind: "رصد موضوعات", url: "https://trends.google.com" },
] as const;

export const workflowStages = [
  "الفكرة",
  "البحث",
  "السكربت",
  "الإنتاج",
  "المراجعة",
  "جاهز للنشر",
] as const;

export const guardedProposalStates = ["مقترح", "معتمد", "مرفوض"] as const;

export function needsHumanReview(input: {
  licenseStatus: "approved" | "pending" | "held" | "rejected";
  safetyStatus: "clear" | "review" | "blocked";
}) {
  return input.licenseStatus !== "approved" || input.safetyStatus !== "clear";
}
