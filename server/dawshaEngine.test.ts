import { describe, expect, it } from "vitest";
import { buildDawshaPipelineTasks } from "./dawshaEngine";

describe("DAWSHA central pipeline", () => {
  it("keeps assets, rendering, and publishing blocked until their prerequisites exist", () => {
    const tasks = buildDawshaPipelineTasks({ targetLanguage: "both", trendSourceUrl: "https://trends.google.com/trending/rss?geo=EG" });
    expect(tasks.find(task => task.taskKind === "trend_scan")).toMatchObject({ status: "completed" });
    expect(tasks.find(task => task.taskKind === "translation")).toMatchObject({ status: "queued" });
    expect(tasks.find(task => task.taskKind === "rights_check")).toMatchObject({ status: "blocked" });
    expect(tasks.find(task => task.taskKind === "publish")).toMatchObject({ status: "blocked" });
  });

  it("does not invent a second language stage for a single-language project", () => {
    const tasks = buildDawshaPipelineTasks({ targetLanguage: "ar" });
    expect(tasks.find(task => task.taskKind === "translation")).toMatchObject({ status: "completed" });
  });
});
