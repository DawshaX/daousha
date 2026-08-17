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
  listProjects: vi.fn(),
  getConnectionHealthMonitor: vi.fn(),
  listNotificationEvents: vi.fn(),
  listChannelConnections: vi.fn(),
  listPublishingRuns: vi.fn(),
  getPublishingPolicy: vi.fn(),
  listSources: vi.fn(),
  listOwnedProjectVideoAssets: vi.fn(),
  listAssistantSessions: vi.fn(),
  listAssistantActionPlans: vi.fn(),
  listAssistantActionSteps: vi.fn(),
  listAssistantAuditEvents: vi.fn(),
  listAssistantMemories: vi.fn(),
  createAssistantMemory: vi.fn(),
  listContentPlaybooks: vi.fn(),
  searchAssistantKnowledge: vi.fn(),
  createPlaybookRun: vi.fn(),
  updatePlaybookRun: vi.fn(),
  listContentPlaybookSteps: vi.fn(),
};
const llmMock = { invokeLLM: vi.fn() };

vi.mock("./db", () => dbMock);
vi.mock("./_core/llm", () => llmMock);

const { getNOVAWorkspace, runNOVAPlaybook, runNOVATurn } = await import("./novaAssistant");

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
    dbMock.getDashboardData.mockResolvedValue({ stats: { activeProjects: 2, reviewProjects: 0, activeSchedules: 6 }, connections: [{ platform: "youtube", status: "authorized" }], schedules: [{ projectId: 81, platform: "youtube", status: "active", scheduleCronTaskUid: "heartbeat-test-81" }] });
    dbMock.listProjects.mockResolvedValue([]);
    dbMock.getConnectionHealthMonitor.mockResolvedValue({ platform: "youtube", status: "healthy" });
    dbMock.listNotificationEvents.mockResolvedValue([]);
    dbMock.listChannelConnections.mockResolvedValue([{ platform: "youtube", status: "authorized" }]);
    dbMock.listPublishingRuns.mockResolvedValue([]);
    dbMock.getPublishingPolicy.mockResolvedValue({ mode: "guarded_auto", publicPublishingEnabled: true, killSwitchEnabled: false, requirePrivateCanary: true, minIntervalMinutes: 10, maxPublicationsPerDay: 6, lastPublishedAt: null });
    dbMock.listSources.mockResolvedValue([{ id: 4, name: "Pexels — ترخيص اللقطات", trustStatus: "proposed" }]);
    dbMock.listOwnedProjectVideoAssets.mockResolvedValue([]);
    dbMock.listAssistantMemories.mockResolvedValue([{ id: 1, title: "لغة المحتوى" }]);
    dbMock.listContentPlaybooks.mockResolvedValue([{ id: 2, title: "حلقة معرفية قصيرة" }]);
    dbMock.searchAssistantKnowledge.mockResolvedValue([{ id: 3, title: "دليل الحقوق" }]);
    dbMock.createPlaybookRun.mockResolvedValue({ id: 51 });
    dbMock.updatePlaybookRun.mockResolvedValue({ id: 51, status: "completed" });
    dbMock.listContentPlaybookSteps.mockResolvedValue([]);
    llmMock.invokeLLM.mockResolvedValue(modelPlan());
  });

  it("ينشئ مشروعًا مسودًا فقط تحت مالك الجلسة ويوثق الخطة والخطوة", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "أنشئ Reel عن التحقق من المعلومات" });

    expect(result.status).toBe("completed");
    expect(dbMock.createProject).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, title: "التحقق من المعلومات", targetLanguage: "both", contentFormat: "short" }));
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
    expect(result.reply).toContain("youtube للمشروع #81");
    expect(result.reply).toContain("heartbeat-test-81");
  });

  it("يعرض سياسة التفويض والتجديد من Telegram دون استدعاء نموذج اللغة أو كشف رموز", async () => {
    dbMock.listChannelConnections.mockResolvedValue([
      { platform: "youtube", status: "authorized" },
      { platform: "facebook", status: "authorized" },
      { platform: "telegram", status: "authorized" },
    ]);

    const result = await runNOVATurn({ ownerId: 7, content: "ما حالة التفويض وتجديد الرموز؟", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(result.reply).toContain("تجديد YouTube الخادمي");
    expect(result.reply).toContain("TikTok خارج التشغيل الإنتاجي");
    expect(result.reply).not.toContain("credentialCiphertext");
  });

  it("يعرض دليل بدء حتميًا من Telegram من دون استدعاء نموذج اللغة أو تنفيذ أي إجراء", async () => {
    llmMock.invokeLLM.mockRejectedValue(new Error("service unavailable"));

    const result = await runNOVATurn({ ownerId: 7, content: "/start", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(result.reply).toContain("أهلًا بك في XDAW NOVA");
    expect(result.reply).toContain("ما حالة القنوات؟");
    expect(dbMock.createProject).not.toHaveBeenCalled();
  });

  it("يعرض آخر التنبيهات من Telegram من دون استدعاء النموذج أو إرسال رسالة جديدة", async () => {
    dbMock.listNotificationEvents.mockResolvedValue([{ eventType: "facebook_health_healthy", deliveryStatus: "sent" }]);

    const result = await runNOVATurn({ ownerId: 7, content: "ما آخر التنبيهات؟", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(result.reply).toContain("facebook_health_healthy: sent");
    expect(dbMock.createAssistantActionStep).toHaveBeenCalledWith(expect.objectContaining({ toolName: "get_notifications_overview" }));
  });

  it("يحفظ ذاكرة صريحة من Telegram ضمن نطاق المالك فقط", async () => {
    dbMock.createAssistantMemory.mockResolvedValue({ id: 61, title: "ذاكرة NOVA: الأولوية للعربية أولاً" });

    const result = await runNOVATurn({ ownerId: 7, content: "تذكر أن الأولوية للعربية أولاً", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.createAssistantMemory).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, kind: "decision", content: "الأولوية للعربية أولاً" }));
    expect(result.reply).toContain("حُفظت الذاكرة");
  });

  it("يرفض حفظ رمز تحقق أو كلمة مرور حتى إذا طلب المالك ذلك صراحةً", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "تذكر أن رمز تحقق الحساب 123456", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(dbMock.createAssistantMemory).not.toHaveBeenCalled();
    expect(result.reply).toContain("لن أحفظ كلمات مرور أو رموز وصول أو رموز تحقق");
  });

  it("يحوّل أمر النشر إلى فحص حزم مقيد ولا ينفذ رفعًا", async () => {
    dbMock.listOwnedProjectVideoAssets.mockResolvedValue([{ project: { id: 88, title: "حزمة عربية", status: "approved", previewAcknowledgedAt: new Date() }, asset: { storageKey: "videos/ar.mp4", licenseType: "أصلي", licenseStatus: "approved", safetyStatus: "clear" } }]);

    const result = await runNOVATurn({ ownerId: 7, content: "انشرلي فيديو الآن على كل المنصات", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(result.reply).toContain("حزمة عربية");
    expect(result.reply).toContain("هذا فحص فقط");
  });

  it("يعرض عناصر المراجعة من أمر Telegram حتميًا من دون استدعاء النموذج أو اعتماد مشروع", async () => {
    dbMock.listProjects.mockResolvedValue([{ id: 81, title: "حلقة التحقق", status: "review", previewAcknowledgedAt: null }]);

    const result = await runNOVATurn({ ownerId: 7, content: "ما الذي يحتاج مراجعة الآن؟", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(result.reply).toContain("حلقة التحقق");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.createAssistantActionStep).toHaveBeenCalledWith(expect.objectContaining({ toolName: "get_review_overview" }));
  });

  it("ينشئ مسودة من أمر مباشر من دون استدعاء نموذج اللغة", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "أنشئ Reel عن حماية الحسابات", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.createProject).toHaveBeenCalledWith(expect.objectContaining({ title: "حماية الحسابات", ownerId: 7 }));
  });

  it("يسجل المصدر كمقترح من أمر مباشر من دون استدعاء نموذج اللغة", async () => {
    dbMock.createSource.mockResolvedValue({ id: 92, name: "UNESCO" });
    const result = await runNOVATurn({ ownerId: 7, content: "أضف مصدر UNESCO https://www.unesco.org", origin: "web" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.createSource).toHaveBeenCalledWith(expect.objectContaining({ name: "مصدر UNESCO", url: "https://www.unesco.org", trustStatus: "proposed" }));
  });

  it("يسجل رابط Pinterest كمرجع بصري مقترح فقط من دون تنزيل أو استدعاء نموذج اللغة", async () => {
    dbMock.createSource.mockResolvedValue({ id: 93, name: "تكوين ضوء" });
    const result = await runNOVATurn({ ownerId: 7, content: "أضف مرجع Pinterest تكوين ضوء https://www.pinterest.com/pin/123456789/", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(result.reply).toContain("مرجع إلهام بصري");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.createSource).toHaveBeenCalledWith(expect.objectContaining({ sourceKind: "reference", trustStatus: "proposed", notes: expect.stringContaining("لا يمنح حق تنزيل") }));
  });

  it("يعرض الذاكرة والـPlaybooks من المصدر الموحد من دون استدعاء نموذج اللغة", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "اعرض الذاكرة والـPlaybooks", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.listAssistantMemories).toHaveBeenCalledWith(7);
    expect(dbMock.listContentPlaybooks).toHaveBeenCalledWith(7);
    expect(result.reply).toContain("لغة المحتوى");
    expect(result.reply).toContain("حلقة معرفية قصيرة");
  });

  it("يعرض مصادر اللقطات المرخصة من Telegram من دون تنزيل أو اعتماد أو استدعاء نموذج اللغة", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "اعرض مصادر اللقطات المرخصة", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.listSources).toHaveBeenCalledWith(7);
    expect(result.reply).toContain("Pexels — ترخيص اللقطات");
    expect(result.reply).toContain("لم يبدأ تنزيل");
  });

  it("يبحث في قاعدة المعرفة من أمر موحد من دون استدعاء نموذج اللغة", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "ابحث في قاعدة المعرفة عن الحقوق", origin: "web" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.searchAssistantKnowledge).toHaveBeenCalledWith(7, "الحقوق");
    expect(result.reply).toContain("دليل الحقوق");
  });

  it("يحجب أمر اعتماد عالي الأثر برسالة تشغيلية واضحة من دون استدعاء نموذج اللغة", async () => {
    const result = await runNOVATurn({ ownerId: 7, content: "اعتمد الفيديو وغيّر سقف النشر", origin: "telegram" });

    expect(result.status).toBe("needs_approval");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.createProject).not.toHaveBeenCalled();
    expect(result.reply).toContain("لم أنفذ أي تغيير أو نشر");
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

  it("يشغّل Playbook قراءة فقط ويسجل خطواته ونتيجته في خطة NOVA", async () => {
    dbMock.listContentPlaybooks.mockResolvedValue([{ id: 51, title: "فحص تشغيل", status: "active", impact: "read" }]);
    dbMock.listContentPlaybookSteps.mockResolvedValue([{ stepOrder: 1, title: "عرض الحالة", toolName: "get_operational_overview" }]);

    const result = await runNOVAPlaybook({ ownerId: 7, playbookId: 51 });

    expect(result.status).toBe("completed");
    expect(dbMock.createPlaybookRun).toHaveBeenCalledWith(expect.objectContaining({ playbookId: 51, status: "queued" }));
    expect(dbMock.updatePlaybookRun).toHaveBeenLastCalledWith(7, 51, expect.objectContaining({ status: "completed" }));
    expect(dbMock.getDashboardData).toHaveBeenCalledWith(7);
  });

  it("يشغّل Playbook باسمه من أمر Telegram عبر المحرك الموحد دون استدعاء نموذج اللغة", async () => {
    const session = { id: 21, ownerId: 7, title: "جلسة جديدة", status: "active", origin: "telegram" };
    dbMock.getOwnedAssistantSession.mockResolvedValue(session);
    dbMock.listContentPlaybooks.mockResolvedValue([{ id: 53, title: "فحص تشغيل", status: "active", impact: "read" }]);
    dbMock.listContentPlaybookSteps.mockResolvedValue([{ stepOrder: 1, title: "عرض الحالة", toolName: "get_operational_overview" }]);

    const result = await runNOVATurn({ ownerId: 7, content: "شغل Playbook فحص تشغيل", origin: "telegram" });

    expect(result.status).toBe("completed");
    expect(llmMock.invokeLLM).not.toHaveBeenCalled();
    expect(dbMock.createPlaybookRun).toHaveBeenCalledWith(expect.objectContaining({ playbookId: 53, sessionId: 21 }));
  });

  it("يحجب Playbook الذي يطلب تغيير بيانات قبل إنشاء مسودة أو نشر", async () => {
    dbMock.listContentPlaybooks.mockResolvedValue([{ id: 52, title: "مسودة تحتاج إدخال", status: "active", impact: "draft" }]);
    dbMock.listContentPlaybookSteps.mockResolvedValue([{ stepOrder: 1, title: "إنشاء مشروع", toolName: "create_project_draft", inputTemplate: "عنوان مطلوب" }]);

    const result = await runNOVAPlaybook({ ownerId: 7, playbookId: 52 });

    expect(result.status).toBe("blocked");
    expect(dbMock.createProject).not.toHaveBeenCalled();
    expect(dbMock.updatePlaybookRun).toHaveBeenLastCalledWith(7, 51, expect.objectContaining({ status: "blocked" }));
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
