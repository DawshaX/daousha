export function isOwnedLinkedVideo(input: { projectId: number; assetId: number; assetKind?: string; link?: { projectId: number; assetId: number } | null }) {
  return input.assetKind === "video" && input.link?.projectId === input.projectId && input.link?.assetId === input.assetId;
}
