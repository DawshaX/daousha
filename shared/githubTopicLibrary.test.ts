import { describe, expect, it } from "vitest";
import { githubTopicIdeas, topicIdeaBrief } from "./githubTopicLibrary";

describe("GitHub topic-library snapshot", () => {
  it("keeps only ideas awaiting review and excludes archived published episodes", () => {
    expect(githubTopicIdeas).toHaveLength(21);
    expect(githubTopicIdeas.every(idea => idea.sourceStatus === "queued" || idea.sourceStatus === "pending-narration")).toBe(true);
    expect(githubTopicIdeas.some(idea => idea.id.endsWith("-done"))).toBe(false);
  });

  it("marks every imported brief as requiring fact and source review", () => {
    expect(topicIdeaBrief(githubTopicIdeas[0])).toContain("التحقق من الحقائق والمصادر");
    expect(topicIdeaBrief(githubTopicIdeas[0])).toContain("قبل إنشاء مشروع أو نشر");
  });
});
