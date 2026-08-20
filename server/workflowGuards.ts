export type WorkflowStatus = "idea" | "research" | "script" | "production" | "review" | "approved" | "scheduled" | "published" | "blocked";

const allowedTransitions: Record<WorkflowStatus, WorkflowStatus[]> = {
  idea: ["research", "script", "blocked"],
  research: ["script", "blocked"],
  script: ["production", "blocked"],
  production: ["review", "blocked"],
  review: ["approved", "production", "blocked"],
  approved: ["scheduled", "production", "blocked"],
  scheduled: ["published", "approved", "blocked"],
  published: [],
  blocked: ["research", "script", "production"],
};

export function isAllowedWorkflowTransition(from: WorkflowStatus, to: WorkflowStatus) {
  return allowedTransitions[from].includes(to);
}

export function hasApprovedSafeVideo(items: Array<{ asset: { assetKind: string; licenseStatus: string; safetyStatus: string } }>) {
  return items.some(item => item.asset.assetKind === "video" && item.asset.licenseStatus === "approved" && item.asset.safetyStatus === "clear");
}
