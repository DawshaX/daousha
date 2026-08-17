import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Archive, BellRing, BookOpenCheck, Bot, Brain, CheckCircle2, CircleAlert, ClipboardList, KeyRound, Loader2, MessageSquarePlus, RadioTower, Search, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const NOVA_SUGGESTED_PROMPTS = [
  "ما حالة القنوات والمهام المجدولة؟",
  "ما حالة التفويض وتجديد الرموز؟",
  "اعرض آخر التنبيهات التشغيلية",
  "ما الذي يحتاج مراجعة الآن؟",
  "اعرض الذاكرة والـPlaybooks",
  "تذكر أن الأولوية للعربية أولاً",
  "ابحث في قاعدة المعرفة عن الحقوق",
];

export const NOVA_MEMORY_GUIDANCE = "الذاكرة تحفظ قرارًا أو تفضيلًا صريحًا للمالك فقط؛ لا تحفظ كلمات مرور أو رموز دخول أو مفاتيح وصول.";

const planState = {
  proposed: ["مقترحة", "border-amber-500/25 bg-amber-500/10 text-amber-100"],
  approved: ["معتمدة", "border-sky-500/25 bg-sky-500/10 text-sky-100"],
  executing: ["قيد التنفيذ", "border-violet-500/25 bg-violet-500/10 text-violet-100"],
  completed: ["مكتملة", "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"],
  blocked: ["محجوبة", "border-red-500/25 bg-red-500/10 text-red-100"],
  failed: ["تعذرت", "border-red-500/25 bg-red-500/10 text-red-100"],
} as const;

function formatTime(value: Date | string) {
  return new Date(value).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" });
}

function auditActorLabel(actor: string) {
  if (actor === "user") return "المالك";
  if (actor === "assistant") return "NOVA";
  return "النظام";
}

function auditDecisionStyle(decision: string) {
  if (["completed", "allowed"].includes(decision)) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
  if (["blocked", "denied"].includes(decision)) return "border-amber-500/25 bg-amber-500/10 text-amber-100";
  if (decision === "failed") return "border-red-500/25 bg-red-500/10 text-red-100";
  return "border-white/10 bg-white/[0.04] text-zinc-400";
}

export default function NOVAConsole() {
  const utils = trpc.useUtils();
  const [selectedSessionId, setSelectedSessionId] = useState<number | undefined>();
  const workspaceInput = useMemo(() => selectedSessionId ? { sessionId: selectedSessionId } : undefined, [selectedSessionId]);
  const workspace = trpc.nova.workspace.useQuery(workspaceInput, {
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const memories = trpc.nova.memories.useQuery(undefined, { refetchInterval: 15_000, refetchOnWindowFocus: true });
  const playbooks = trpc.nova.playbooks.useQuery(undefined, { refetchInterval: 15_000, refetchOnWindowFocus: true });
  const advisorProviders = trpc.nova.advisorProviders.useQuery(undefined, { refetchInterval: 60_000, refetchOnWindowFocus: true });
  const [advisorPrompt, setAdvisorPrompt] = useState("");
  const [advisorProvider, setAdvisorProvider] = useState<"gemini" | "openai">("gemini");
  const [advisorDraft, setAdvisorDraft] = useState<string | undefined>();
  const createSession = trpc.nova.createSession.useMutation({
    onSuccess: session => {
      setSelectedSessionId(session.id);
      utils.nova.workspace.invalidate();
      utils.nova.sessions.invalidate();
      toast.success("فُتحت جلسة NOVA جديدة.");
    },
    onError: error => toast.error(error.message),
  });
  const archiveSession = trpc.nova.archiveSession.useMutation({
    onSuccess: () => {
      setSelectedSessionId(undefined);
      utils.nova.workspace.invalidate();
      utils.nova.sessions.invalidate();
      toast.success("أُرشفت الجلسة. لا تُحذف سجلاتها.");
    },
    onError: error => toast.error(error.message),
  });
  const sendMessage = trpc.nova.sendMessage.useMutation({
    onSuccess: result => {
      setSelectedSessionId(result.session.id);
      utils.nova.workspace.invalidate();
      utils.nova.sessions.invalidate();
    },
    onError: error => toast.error(error.message),
  });
  const createAdvisorDraft = trpc.nova.createAdvisorDraft.useMutation({
    onSuccess: result => {
      setAdvisorDraft(result.content);
      utils.nova.workspace.invalidate();
      toast.success(`أُنشئت مسودة إرشادية عبر ${result.provider}.`);
    },
    onError: error => toast.error(error.message),
  });

  useEffect(() => {
    if (!selectedSessionId && workspace.data?.session?.id) setSelectedSessionId(workspace.data.session.id);
  }, [selectedSessionId, workspace.data?.session?.id]);

  const messages: Message[] = useMemo(() => (workspace.data?.messages ?? []).map(message => ({
    role: message.role === "system" ? "assistant" : message.role,
    content: message.content,
  })), [workspace.data?.messages]);
  const session = workspace.data?.session;
  const plans = workspace.data?.plans ?? [];

  return <section className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_330px]" dir="rtl">
    <Card className="border-white/8 bg-zinc-950/65 xl:min-h-[720px]">
      <CardHeader className="border-b border-white/7 pb-4">
        <div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-base text-white"><Bot className="h-4 w-4 text-red-400" /> جلسات NOVA</CardTitle><CardDescription className="mt-1 text-xs text-zinc-500">سياق محفوظ للمالك فقط</CardDescription></div><Button size="icon" variant="outline" aria-label="جلسة جديدة" className="h-8 w-8 border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-red-500/10 hover:text-red-200" onClick={() => createSession.mutate()} disabled={createSession.isPending}>{createSession.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}</Button></div>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[570px] pr-1"><div className="space-y-1.5">
          {(workspace.data?.sessions ?? []).map(item => <button key={item.id} onClick={() => setSelectedSessionId(item.id)} className={`w-full rounded-xl border p-3 text-right transition-colors ${session?.id === item.id ? "border-red-500/25 bg-red-500/[0.09]" : "border-transparent hover:border-white/8 hover:bg-white/[0.03]"}`}><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-xs font-semibold leading-5 text-zinc-200">{item.title}</p><span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${item.status === "active" ? "bg-emerald-400" : "bg-zinc-600"}`} /></div><p className="mt-2 text-[10px] text-zinc-600">{formatTime(item.updatedAt)}</p></button>)}
          {!workspace.isLoading && (workspace.data?.sessions?.length ?? 0) === 0 ? <div className="p-5 text-center text-xs leading-6 text-zinc-600">افتح جلسة جديدة واطلب حالة القنوات أو إنشاء مسودة محتوى.</div> : null}
        </div></ScrollArea>
      </CardContent>
    </Card>

    <Card className="overflow-hidden border-red-500/18 bg-[radial-gradient(circle_at_75%_10%,rgba(239,68,68,.14),transparent_30%),linear-gradient(145deg,rgba(24,11,13,.9),rgba(9,9,11,.96))] xl:min-h-[720px]">
      <CardHeader className="border-b border-white/8 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-xl text-white"><Sparkles className="h-5 w-5 text-red-300" /> NOVA Assistant</CardTitle><CardDescription className="mt-1 text-xs leading-5 text-zinc-500">يفهم طلبك، يعرض خطة واضحة، وينفذ الأدوات الآمنة فقط.</CardDescription></div><Badge className="border border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500/10"><ShieldCheck className="ml-1.5 h-3.5 w-3.5" /> حواجز النشر مفعلة</Badge></div>
      </CardHeader>
      <CardContent className="p-0">
      {!session ? <div className="flex min-h-[560px] flex-col items-center justify-center p-8 text-center"><div className="grid h-14 w-14 place-items-center rounded-2xl border border-red-500/25 bg-red-500/10 text-red-300"><Bot className="h-7 w-7" /></div><h2 className="mt-5 text-lg font-black text-white">ابدأ جلسة NOVA</h2><p className="mt-2 max-w-md text-sm leading-7 text-zinc-500">المساعد يملك سجلًا مستقلًا ويحفظ فقط ما يظهر في المحادثة والخطة والنتيجة، وليس تفكيره الداخلي أو أسرار القنوات.</p><Button className="mt-6 bg-red-600 hover:bg-red-500" onClick={() => createSession.mutate()} disabled={createSession.isPending}><MessageSquarePlus className="ml-2 h-4 w-4" /> بدء جلسة</Button></div> : <AIChatBox messages={messages} onSendMessage={content => sendMessage.mutate({ sessionId: session.id, content })} isLoading={sendMessage.isPending} height="610px" placeholder="اكتب ما تريد إنجازه داخل XDAW NOVA…" emptyStateMessage="اسأل عن القنوات، التفويض، التنبيهات، أو الذاكرة — وسأعرض نتيجة آمنة قابلة للتدقيق." suggestedPrompts={NOVA_SUGGESTED_PROMPTS} enableVoiceInput voiceLanguage="ar-EG" className="rounded-none border-0 bg-transparent shadow-none" />}
      </CardContent>
      {session ? <div className="flex items-center justify-between border-t border-white/8 bg-black/20 px-4 py-3"><span className="text-[11px] text-zinc-600">الجلسة #{session.id} · مصدر موحد للويب وTelegram · تحديث تلقائي كل 15 ثانية</span><Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-zinc-500 hover:bg-red-500/10 hover:text-red-200" onClick={() => archiveSession.mutate({ sessionId: session.id })} disabled={archiveSession.isPending}><Archive className="ml-1.5 h-3.5 w-3.5" /> أرشفة</Button></div> : null}
    </Card>

    <div className="space-y-5">
      <Card className="border-white/8 bg-zinc-950/65">
        <CardHeader className="border-b border-white/7 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div><CardTitle className="flex items-center gap-2 text-sm text-white"><Brain className="h-4 w-4 text-red-400" /> ذاكرة NOVA</CardTitle><CardDescription className="mt-1 text-[11px] text-zinc-600">موارد خاصة بالمالك فقط، مشتركة بين الويب وTelegram.</CardDescription></div>
            <Badge className="border border-red-500/20 bg-red-500/[0.07] text-[10px] text-red-200 hover:bg-red-500/[0.07]">{memories.data?.length ?? 0} محفوظة</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="rounded-xl border border-white/7 bg-black/20 p-3"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-200"><BookOpenCheck className="h-3.5 w-3.5 text-red-300" /> Playbooks النشطة</span><span className="text-xs font-black text-white">{playbooks.data?.filter(item => item.status === "active").length ?? 0}</span></div><p className="mt-1.5 text-[10px] leading-5 text-zinc-600">تشغيل الوصفات يظل محكومًا؛ يُسمح تلقائيًا بخطوات القراءة فقط.</p></div>
          {memories.isLoading ? <p className="text-[11px] text-zinc-600">يجري تحميل ملخص الذاكرة…</p> : (memories.data?.length ?? 0) > 0 ? <div className="space-y-2">{memories.data?.slice(0, 2).map(memory => <div key={memory.id} className="rounded-lg border border-white/6 bg-white/[0.025] px-3 py-2"><p className="line-clamp-1 text-[11px] font-semibold text-zinc-200">{memory.title}</p><p className="mt-1 text-[10px] text-zinc-600">{formatTime(memory.updatedAt)}</p></div>)}</div> : <p className="text-[11px] leading-5 text-zinc-600">لا توجد ذاكرة صريحة محفوظة بعد. اكتب «تذكر أن …» لحفظ قرار غير حساس.</p>}
          <p className="rounded-lg border border-amber-500/15 bg-amber-500/[0.035] px-3 py-2 text-[10px] leading-5 text-amber-100/75">{NOVA_MEMORY_GUIDANCE}</p>
        </CardContent>
      </Card>
      <Card className="border-white/8 bg-zinc-950/65">
        <CardHeader className="border-b border-white/7 pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-sm text-white"><Sparkles className="h-4 w-4 text-red-400" /> مسودة بمساعدة مزود</CardTitle><CardDescription className="mt-1 text-[11px] text-zinc-600">طلب صريح فقط؛ لا يملك المزود أدوات تنفيذ أو نشر.</CardDescription></div><Badge className="border border-white/10 bg-white/[0.03] text-[10px] text-zinc-400 hover:bg-white/[0.03]">مسودة فقط</Badge></div></CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="flex flex-wrap gap-1.5">{advisorProviders.data?.map(provider => <button key={provider.id} type="button" disabled={provider.status !== "ready" || provider.id === "perplexity"} onClick={() => provider.id !== "perplexity" && setAdvisorProvider(provider.id)} className={`rounded-lg border px-2 py-1 text-[10px] transition-colors ${provider.id === advisorProvider ? "border-red-500/35 bg-red-500/10 text-red-100" : "border-white/8 bg-white/[0.02] text-zinc-500"} ${provider.status !== "ready" ? "cursor-not-allowed opacity-55" : "hover:border-white/20"}`}>{provider.title} · {provider.status === "ready" ? "متاح" : provider.status === "disabled" ? "متوقف" : "غير مهيأ"}</button>)}</div>
          <Textarea value={advisorPrompt} onChange={event => setAdvisorPrompt(event.target.value)} placeholder="مثال: اقترح هيكل سكربت قصير عربي عن فضل الأذكار، مع تنبيه حقوقي للمادة المرئية." className="min-h-24 resize-none border-white/10 bg-black/25 text-xs leading-6 text-zinc-200 placeholder:text-zinc-600" maxLength={6000} />
          <Button size="sm" className="w-full bg-red-600 text-xs hover:bg-red-500" disabled={createAdvisorDraft.isPending || advisorPrompt.trim().length < 3} onClick={() => createAdvisorDraft.mutate({ provider: advisorProvider, prompt: advisorPrompt, language: "ar" })}>{createAdvisorDraft.isPending ? <Loader2 className="ml-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="ml-1.5 h-3.5 w-3.5" />} إنشاء مسودة إرشادية</Button>
          {advisorDraft ? <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.035] p-3"><p className="mb-1.5 text-[10px] font-semibold text-amber-100">نتيجة إرشادية — تحتاج مراجعة بشرية</p><p className="whitespace-pre-wrap text-[11px] leading-6 text-zinc-300">{advisorDraft}</p></div> : <p className="text-[10px] leading-5 text-zinc-600">لا تُرسل كلمات مرور أو رموزًا أو مفاتيح. Perplexity API متوقف بقرار المالك؛ استخدم البحث اليدوي الموثق بدلًا منه.</p>}
        </CardContent>
      </Card>
      <Card className="border-white/8 bg-zinc-950/65">
        <CardHeader className="border-b border-white/7 pb-4"><CardTitle className="flex items-center gap-2 text-sm text-white"><ClipboardList className="h-4 w-4 text-red-400" /> الخطط والتنفيذ</CardTitle><CardDescription className="mt-1 text-[11px] text-zinc-600">ملخص قابل للمراجعة، لا تفكير خام.</CardDescription></CardHeader>
        <CardContent className="space-y-3 p-3">
          {plans.slice(0, 4).map(plan => { const state = planState[plan.status]; const steps = workspace.data?.stepsByPlan[plan.id] ?? []; return <div key={plan.id} className="rounded-xl border border-white/8 bg-white/[0.02] p-3"><div className="flex items-start justify-between gap-2"><Badge className={`border text-[10px] ${state[1]}`}>{state[0]}</Badge><span className="font-mono text-[10px] text-zinc-600">#{plan.id}</span></div><p className="mt-2 text-xs leading-5 text-zinc-200">{plan.summary}</p><div className="mt-3 space-y-1.5">{steps.map((step: { id: number; toolName: string; status: string; resultSummary?: string | null }) => <div key={step.id} className="rounded-lg border border-white/6 bg-black/20 px-2.5 py-2"><div className="flex items-center justify-between gap-2"><span className="text-[10px] text-zinc-300">{step.toolName}</span><span className="text-[10px] text-zinc-600">{step.status}</span></div>{step.resultSummary ? <p className="mt-1 text-[10px] leading-4 text-zinc-500">{step.resultSummary}</p> : null}</div>)}</div></div>; })}
          {plans.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs leading-6 text-zinc-600">ستظهر هنا خطة كل طلب وبطاقة النتيجة بعد التنفيذ.</div> : null}
        </CardContent>
      </Card>
      <Card className="border-red-500/15 bg-red-500/[0.035]"><CardContent className="p-4"><div className="flex items-start gap-3"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-300" /><p className="text-[11px] leading-6 text-red-100/70">NOVA لا يتعامل مع كلمات مرور أو رموز وصول، ولا يغيّر سياسة النشر، ولا يضيف TikTok إلى أي مسار. النشر الخلفي المعتمد يظل محكومًا بالسياسة والـCanary وسقف النشر.</p></div></CardContent></Card>
      <Card className="border-white/8 bg-zinc-950/65"><CardHeader className="border-b border-white/7 pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-sm text-white"><RadioTower className="h-4 w-4 text-red-400" /> آخر سجل</CardTitle><CardDescription className="mt-1 text-[11px] text-zinc-600">أحداث هذه الجلسة فقط، بلا تفكير خام أو أسرار.</CardDescription></div>{session ? <Badge className="border border-white/10 bg-white/[0.03] text-[10px] text-zinc-400 hover:bg-white/[0.03]">{session.origin === "telegram" ? "Telegram" : "الويب"}</Badge> : null}</div></CardHeader><CardContent className="space-y-2 p-3">{(workspace.data?.audit ?? []).slice(0, 4).map(event => <div key={event.id} className="border-b border-white/6 pb-3 last:border-0 last:pb-0"><div className="flex items-start justify-between gap-2"><p className="min-w-0 flex-1 break-words text-[10px] font-semibold text-zinc-200">{event.action}</p><Badge className={`shrink-0 border text-[9px] ${auditDecisionStyle(event.decision)}`}>{event.decision}</Badge></div><div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-zinc-600"><span>{auditActorLabel(event.actor)}</span><span>·</span><span>{formatTime(event.createdAt)}</span>{event.target ? <><span>·</span><span className="max-w-[180px] truncate">{event.target}</span></> : null}</div>{event.detail ? <p className="mt-1.5 line-clamp-2 text-[10px] leading-5 text-zinc-500">{event.detail}</p> : null}</div>)}{(workspace.data?.audit?.length ?? 0) === 0 ? <p className="text-[11px] leading-5 text-zinc-600">لا يوجد تنفيذ مسجل بعد.</p> : null}</CardContent></Card>
    </div>
  </section>;
}
