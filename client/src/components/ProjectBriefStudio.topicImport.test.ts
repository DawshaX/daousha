import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("ProjectBriefStudio GitHub topic import", () => {
  const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/components/ProjectBriefStudio.tsx"), "utf8");

  it("uses a curated snapshot and transfers an idea only into the brief form", () => {
    expect(source).toContain("githubTopicIdeas");
    expect(source).toContain("useImportedIdea");
    expect(source).toContain("setTitle(idea.topic)");
    expect(source).toContain("setBrief(topicIdeaBrief(idea))");
  });

  it("states that a selection does not create a project, schedule, or publication", () => {
    expect(source).toContain("لا ينشئ مشروعًا أو جدولة أو نشرًا");
  });
});
