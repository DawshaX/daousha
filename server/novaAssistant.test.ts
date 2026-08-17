import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  createAssistantSession: vi.fn(),
  getOwnedAssistantSession: vi.fn(),
  createAssistantMessage: vi.fn(),
  createAssistantAuditEvent: vi.fn(),
  listAssistantMessages: vi.fn(),
  createAssistantActionPlan: vi.fn(),
  createAssistantActionStep: vi.fn(),
  updateAssistantActionStep: vi.fn(),
  updateAssistantActionPlan: vi.fn(),
  createProject: vi.fn(),
  createChangeLogEntry: vi.fn(),
  createSource: vi.fn(),
  createAsset: vi.fn(),
  getDashboardData: vi.fn(),
  getConnectionHealthMonitor: vi.fn(),
  listNotificationEvents: vi.fn(),
  listAssistantSessions: vi.fn(),
  listAssistantActionPlans: vi.fn(),
  listAssistantActionSteps: vi.fn(),
  listAssistantAuditEvents: vi.fn(),
};
const llmMock = { invokeLLM: vi.fn() };

vi.mock("./db", () => dbMock);
vi.mock("./_core/llm", () => llmMock);

const { getNOVAWorkspace, runNOVATurn } = await import("./novaAssistant");

function modelPlan(overrides: Record<string, unknown> = {}) {
  return {
    choices: [{ message: { content: JSON.stringify({
      response: "تم فهم الطلب.",
      planSummary: "إنشاء مسودة آمنة داخل XDAW NOVA.",
      toolName: "create_project_draft",
      impact: "draft",
      requiresApproval: false,
      title: "فكرة تحقق أصلية",
      brief: "نسخة عربية وإنجليزية قصيرة.",
      sourceName: "",
      sourceUrl: "",
      licenseType: "",
      assetTitle: "",
      ...overrides,
    }) } }],
  };
}

describe("NOVA Assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.createAssistantSession.mockResolvedValue({ id: 21, ownerId: 7, title: "جلسة جديدة", status: "active", origin: "web" });
    dbMock.createAssistantMessage.mockResolvedValue({ id: 30 });
    dbMock.createAssistantAuditEvent.mockResolvedValue({ id: 40 });
    dbMock.listAssistantMessages.mockResolvedValue([]);
    dbMock.createAssistantActionPlan.mockResolvedValue({ id: 41, ownerId: 7, sessionId: 21, summary: "إنشاء مسودة آمنة داخل XDAW NOVA.", impact: "draft", requiresApproval: false, status: "proposed" });
    dbMock.createAssistantActionStep.mockResolvedValue({ id: 42, planId: 41 });
    dbMock.updateAssistantActionPlan.mockResolvedValue({ id: 41 });
    dbMock.updateAssistantActionStep.mockResolvedValue({ id: 42 });
    dbMock.createProject.mockResolvedValue({ id: 88, title: "فكرة تحقق أصلية" });
    dbMock.createChangeLogEntry.mockResolvedValue({ id: 89 });
    dbMock.getDashboardData.mockResolvedValue({ stats: { activeProjects: 2, reviewProjects: 0, activeSchedules: 6 }, connections: [{ platform: "youtube", status: "authorized" }] });
    dbMock.getConnectionHealthMonitor.mockResolvedValue({ platform: "youtube", status: "healthy" });
    dbMock.listNotificationEvents.mockResolvedValue([]);
    llmMock.invokeLLM.mockResolvedValue(modelPlan());
  });

  it("ينشئ مشروعًا مسودًا فقط تحت مالك الجلسة ويوثق الخطة والخطوة", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "أنشئ Reel عن التحقق من المعلومات" });

    expect(result.status).toBe("completed");
    expect(dbMock.createProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, title: "فكرة تحقق أصلية", targetLanguage: "both", contentFormat: "short" }));
    expect(dbMock.createAssistantActionPlan).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, sessionId: 21, impact: "draft", requiresApproval: false }));
    expect(dbMock.updateAssistantActionStep).toHaveBeenLastCalledWith(7, 42, expect.objectContaining({ status: "completed" }));
    expect(dbMock.createAssistantMessage).toHaveBeenCalledWith(expect.objectContaining({ displayKind: "plan", content: expect.stringContaining("### خطة NOVA") }));
    expect(dbMock.createAssistantMessage).toHaveBeenCalledWith(expect.objectContaining({ displayKind: "tool_result", content: expect.stringContaining("لم يُنشأ أي جدول أو نشر") }));
  });

  it("يجيب عن حالة القنوات من المصدر التشغيلي حتى إذا تعذر محلل اللغة", async () => {
    llmMock.invokeLLM.mockRejectedValue(new Error("service unavailable"));
    const result = await runNOVATurn({ ownerId: 7, content: "القنوات أخبارها إيه؟" , origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.getDashboardData).toHaveBeenCalledWith(7);
    expect(result.reply).toContain("الجداول النشطة 6");
  });

  it("يحجب أي طلب عالي الأثر حتى لو طلب نموذج اللغة أداة تنفيذية", async () => {
    llmMock.invokeLLM.mockResolvedValue(modelPlan({
      response: "سأغير سياسة النشر.",
      planSummary: "تغيير سياسة النشر العامة.",
      toolName: "create_project_draft",
      impact: "high",
      requiresApproval: false,
    }));

    const result = await runNOVATurn({ ownerId: 7, content: "عطّل مفتاح الإيقاف وانشر الآن" });

    expect(result.status).toBe("needs_approval");
    expect(dbMock.createProject).not.toHaveBeenCalled();
    expect(dbMock.updateAssistantActionStep).toHaveBeenLastCalledWith(7, 42, expect.objectContaining({ status: "blocked" }));
    expect(dbMock.updateAssistantActionPlan).toHaveBeenLastCalledWith(7, 41, expect.objectContaining({ status: "blocked" }));
  });

  it("يعرض مساحة الجلسة من بيانات المالك وخططها وخطواتها من دون أي محتوى داخلي إضافي", async () => {
    dbMock.listAssistantSessions.mockResolvedValue([{ id: 21, ownerId: 7, title: "جلسة جديدة", status: "active" }]);
    dbMock.listAssistantMessages.mockResolvedValue([{ id: 1, role: "user", content: "ما الحالة؟", displayKind: "message" }]);
    dbMock.listAssistantActionPlans.mockResolvedValue([{ id: 41, ownerId: 7, sessionId: 21, summary: "قراءة الحالة", status: "completed" }]);
    dbMock.listAssistantActionSteps.mockResolvedValue([{ id: 42, toolName: "get_operational_overview", status: "completed" }]);
    dbMock.listAssistantAuditEvents.mockResolvedValue([{ id: 43, sessionId: 21, action: "get_operational_overview", decision: "completed" }]);

    const workspace = await getNOVAWorkspace(7, 21);

    expect(workspace.session).toMatchObject({ id: 21, ownerId: 7 });
    expect(workspace.stepsByPlan[41]).toHaveLength(1);
    expect(workspace.audit).toEqual([{ id: 43, sessionId: 21, action: "get_operational_overview", decision: "completed" }]);
    expect(dbMock.listAssistantSessions).toHaveBeenCalledWith(7);
  });
});
