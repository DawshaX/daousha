export const publicPublishConfirmationPhrase = "أوافق على النشر العام";

export function canConfirmPublicPublish(input: { previewAcknowledged: boolean; preflightVisibility: "public" | "private" | null; confirmation: string }) {
  return input.previewAcknowledged && input.preflightVisibility === "public" && input.confirmation.trim() === publicPublishConfirmationPhrase;
}
