import { BellRing, CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function eventLabel(eventType: string) {
  const labels: Record<string, string> = {
    review_required: "مراجعة مادة مطلوبة",
    project_review_required: "مشروع بانتظار مراجعة",
    project_blocked: "مشروع متوقف",
    schedule_needs_review: "جدولة تحتاج مراجعة",
    scheduled_youtube_failed: "تعثر نشر مجدول",
    youtube_upload_failed: "تعثر رفع YouTube",
    facebook_upload_failed: "تعثر رفع Facebook",
    tiktok_sandbox_draft_failed: "تعثر مسودة TikTok Sandbox",
  };
  return labels[eventType] ?? eventType.replaceAll("_", " ");
}

export default function OperationalNotifications() {
  const events = trpc.daousha.notificationEvents.useQuery();
  const items = events.data?.slice(0, 8) ?? [];
  return <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><BellRing className="h-5 w-5 text-red-400" /> سجل الإشعارات التشغيلية</CardTitle><CardDescription className="mt-2 text-zinc-500">يسجل محاولات التنبيه فقط؛ لا يعيد النشر ولا ينفذ إجراءً خارجيًا من هذه الشاشة.</CardDescription></CardHeader><CardContent>{events.isLoading ? <div className="flex min-h-24 items-center justify-center text-zinc-500"><Loader2 className="ml-2 h-4 w-4 animate-spin" />جارٍ قراءة السجل…</div> : items.length ? <div className="space-y-2">{items.map(event => { const sent = event.deliveryStatus === "sent"; return <div key={event.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/8 bg-black/20 p-3"><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-medium text-zinc-200">{sent ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <CircleAlert className="h-4 w-4 shrink-0 text-amber-400" />}{eventLabel(event.eventType)}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{event.detail}</p><p className="mt-1 text-[11px] text-zinc-700">{new Date(event.createdAt).toLocaleString("ar-EG")}</p></div><Badge className={sent ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/10" : "border border-amber-500/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/10"}>{sent ? "سُلّم" : "لم يُسلّم"}</Badge></div>; })}</div> : <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-5 text-center text-sm leading-6 text-zinc-600">لا توجد محاولات إشعار مسجلة بعد.</div>}</CardContent></Card>;
}
