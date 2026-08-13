import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { BellRing, Bot, ExternalLink, Facebook, Instagram, LockKeyhole, Music2, RadioTower, ShieldCheck, Youtube } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function statusLabel(status?: string) {
  if (status === "authorized") return "مرتبط";
  if (status === "configured") return "مهيأ";
  if (status === "error") return "يحتاج مراجعة";
  return "غير مرتبط";
}

function distributionLabel(mode?: string) {
  if (mode === "automatic_api") return "نشر آلي";
  if (mode === "confirmation_required") return "تأكيد مطلوب";
  return "تفويض ناقص";
}

const distributionPlatforms = [
  { platform: "youtube", label: "YouTube", description: "Shorts والفيديوهات الطويلة", icon: Youtube },
  { platform: "tiktok", label: "TikTok", description: "مقاطع عمودية قصيرة", icon: Music2 },
  { platform: "instagram", label: "Instagram", description: "Reels وحساب العلامة", icon: Instagram },
  { platform: "facebook", label: "Facebook", description: "Reels وصفحة العلامة", icon: Facebook },
] as const;

export default function ChannelControlCenter() {
  const utils = trpc.useUtils();
  const { data: integrations, isLoading: integrationsLoading } = trpc.daousha.integrations.useQuery();
  const { data: policy, isLoading: policyLoading } = trpc.daousha.publishingPolicy.useQuery();
  const { data: events } = trpc.daousha.notificationEvents.useQuery();
  const [minIntervalMinutes, setMinIntervalMinutes] = useState(10);
  const [maxPublicationsPerDay, setMaxPublicationsPerDay] = useState(6);
  const [dailyShortTarget, setDailyShortTarget] = useState(4);
  const [dailyLongTarget, setDailyLongTarget] = useState(2);

  useEffect(() => {
    if (!policy) return;
    setMinIntervalMinutes(policy.minIntervalMinutes);
    setMaxPublicationsPerDay(policy.maxPublicationsPerDay);
    setDailyShortTarget(policy.dailyShortTarget);
    setDailyLongTarget(policy.dailyLongTarget);
  }, [policy]);

  const claimTelegram = trpc.daousha.claimTelegramChat.useMutation({
    onSuccess: () => {
      toast.success("تم ربط محادثة Telegram. يمكنك إرسال اختبار يدوي الآن.");
      utils.daousha.integrations.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const sendTelegramTest = trpc.daousha.sendTelegramTest.useMutation({
    onSuccess: result => {
      result.delivered ? toast.success("أُرسل إشعار الاختبار إلى Telegram.") : toast.error(result.reason);
      utils.daousha.notificationEvents.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const updatePolicy = trpc.daousha.updatePublishingPolicy.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ سياسة النشر وتسجيل التغيير.");
      utils.daousha.publishingPolicy.invalidate();
      utils.daousha.dashboard.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const patchPolicy = (patch: Partial<{ mode: "human_review" | "guarded_auto"; publicPublishingEnabled: boolean; killSwitchEnabled: boolean; requirePrivateCanary: boolean; minIntervalMinutes: number; maxPublicationsPerDay: number; dailyShortTarget: number; dailyLongTarget: number }>) => {
    if (!policy) return;
    updatePolicy.mutate({
      mode: patch.mode ?? policy.mode,
      publicPublishingEnabled: patch.publicPublishingEnabled ?? policy.publicPublishingEnabled,
      killSwitchEnabled: patch.killSwitchEnabled ?? policy.killSwitchEnabled,
      requirePrivateCanary: patch.requirePrivateCanary ?? policy.requirePrivateCanary,
      minIntervalMinutes: patch.minIntervalMinutes ?? policy.minIntervalMinutes,
      maxPublicationsPerDay: patch.maxPublicationsPerDay ?? policy.maxPublicationsPerDay,
      dailyShortTarget: patch.dailyShortTarget ?? policy.dailyShortTarget,
      dailyLongTarget: patch.dailyLongTarget ?? policy.dailyLongTarget,
    });
  };

  const youtube = integrations?.connections.find(connection => connection.platform === "youtube");
  const facebook = integrations?.connections.find(connection => connection.platform === "facebook");
  const telegram = integrations?.connections.find(connection => connection.platform === "telegram");
  const policyBusy = policyLoading || updatePolicy.isPending;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="border-red-500/20 bg-[radial-gradient(circle_at_90%_10%,rgba(239,68,68,.14),transparent_34%),rgba(9,9,11,.72)]">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-white"><Youtube className="h-5 w-5 text-red-400" /> YouTube الرسمي</CardTitle>
              <CardDescription className="mt-2 leading-6 text-zinc-500">تفويض OAuth محدود للرفع فقط؛ لا تُخزَّن كلمة مرور القناة.</CardDescription>
            </div>
            <Badge variant="outline" className="border-white/10 text-zinc-300">{statusLabel(youtube?.status)}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-black/25 p-3 text-xs leading-6 text-zinc-400">
              {integrationsLoading ? "جارٍ قراءة حالة الاتصال…" : integrations?.youtubeClientConfigured ? "بيانات تطبيق OAuth مهيأة. سيطلب Google موافقة مالك القناة على نطاق الرفع والقراءة فقط." : <>أضف هذا العنوان كـ Redirect URI عند إنشاء OAuth في Google Cloud: <span className="mt-1 block break-all font-mono text-[10px] text-red-200" dir="ltr">{integrations?.youtubeRedirectUri}</span></>}
            </div>
            {integrations?.youtubeClientConfigured ? <Button asChild className="w-full bg-red-600 hover:bg-red-500"><a href="/api/integrations/youtube/authorize"><LockKeyhole className="ml-2 h-4 w-4" /> تفويض YouTube الرسمي</a></Button> : <Button variant="outline" disabled className="w-full border-white/10 bg-white/[0.03] text-zinc-400"><LockKeyhole className="ml-2 h-4 w-4" /> أضف بيانات OAuth أولًا</Button>}
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-zinc-950/60">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-white"><Facebook className="h-5 w-5 text-red-400" /> Facebook الرسمي</CardTitle>
              <CardDescription className="mt-2 leading-6 text-zinc-500">تفويض رسمي لصفحة واحدة يختارها المدير صراحةً؛ لا يربط أو ينقل حساب Instagram المستقل.</CardDescription>
            </div>
            <Badge variant="outline" className="border-white/10 text-zinc-300">{statusLabel(facebook?.status)}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-black/25 p-3 text-xs leading-6 text-zinc-400">
              {integrationsLoading ? "جارٍ قراءة حالة الاتصال…" : integrations?.facebookClientConfigured ? <>بيانات تطبيق Meta مهيأة. بعد منح الموافقة ستختار صفحة XDAW NOVA الجديدة من قائمة الصفحات التي يديرها الحساب. <span className="mt-1 block break-all font-mono text-[10px] text-red-200" dir="ltr">{integrations.facebookRedirectUri}</span></> : "أضف معرّف تطبيق Meta ومفتاحه السري في الأسرار المحمية أولًا."}
            </div>
            {integrations?.facebookClientConfigured ? <Button asChild className="w-full bg-red-600 hover:bg-red-500"><a href="/api/integrations/facebook/authorize"><LockKeyhole className="ml-2 h-4 w-4" /> تفويض صفحة Facebook</a></Button> : <Button variant="outline" disabled className="w-full border-white/10 bg-white/[0.03] text-zinc-400"><LockKeyhole className="ml-2 h-4 w-4" /> إعداد Meta غير مكتمل</Button>}
          </CardContent>
        </Card>

        <Card className="border-white/8 bg-zinc-950/60">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2 text-white"><BellRing className="h-5 w-5 text-red-400" /> إشعارات Telegram</CardTitle>
              <CardDescription className="mt-2 leading-6 text-zinc-500">تنبيهات الحالة الخاصة بالمحرك، دون صلاحية لإدارة حسابك.</CardDescription>
            </div>
            <Badge variant="outline" className="border-white/10 text-zinc-300">{statusLabel(telegram?.status)}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-black/25 p-3 text-xs leading-6 text-zinc-400">
              {telegram?.status === "authorized" ? "تم ربط محادثة الإشعارات. سيظهر هنا تاريخ التسليم عند بدء الدورات." : "افتح البوت، أرسل start، ثم اضغط التقاط المحادثة. لا تحتاج إلى كتابة Chat ID."}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="bg-red-600 hover:bg-red-500" onClick={() => claimTelegram.mutate()} disabled={claimTelegram.isPending}>
                <Bot className="ml-2 h-4 w-4" /> {claimTelegram.isPending ? "جارٍ الالتقاط…" : "التقاط محادثة البوت"}
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08] hover:text-white" onClick={() => sendTelegramTest.mutate()} disabled={telegram?.status !== "authorized" || sendTelegramTest.isPending}>
                <RadioTower className="ml-2 h-4 w-4" /> إرسال اختبار
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="border-white/8 bg-zinc-950/60">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-white"><RadioTower className="h-5 w-5 text-red-400" /> وجهات النشر المتوازي</CardTitle>
            <CardDescription className="mt-2 leading-6 text-zinc-500">تُرسل الحزمة إلى الحسابات المفوّضة رسميًا فقط. تفرّق اللوحة بين النشر الآلي والتأكيد المطلوب والتفويض الناقص، ولا تستخدم أي جلسة متصفح شخصية.</CardDescription>
          </div>
          <Badge variant="outline" className="border-white/10 text-zinc-400">{integrations?.distributionReadiness.filter(item => item.eligible).length ?? 0} / 4 مهيأ للتوزيع</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {distributionPlatforms.map(item => {
            const connection = integrations?.connections.find(candidate => candidate.platform === item.platform);
            const readiness = integrations?.distributionReadiness.find(candidate => candidate.platform === item.platform);
            const Icon = item.icon;
            return <div key={item.platform} className="rounded-xl border border-white/8 bg-black/25 p-3"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-red-400" /><p className="text-sm font-medium text-zinc-100">{item.label}</p></div><Badge variant="outline" className="border-white/10 text-[10px] text-zinc-400">{readiness ? distributionLabel(readiness.mode) : statusLabel(connection?.status)}</Badge></div><p className="mt-3 min-h-10 text-xs leading-5 text-zinc-500">{readiness?.reason ?? `${item.description} — يتطلب OAuth رسميًا قبل التفعيل.`}</p></div>;
          })}
        </CardContent>
      </Card>

      <Card className="border-red-500/20 bg-[linear-gradient(145deg,rgba(69,10,10,.32),rgba(9,9,11,.8))]">
        <CardHeader className="flex-row items-start justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-white"><ShieldCheck className="h-5 w-5 text-red-400" /> سياسة النشر المستقل</CardTitle>
            <CardDescription className="mt-2 leading-6 text-zinc-500">الحواجز تعمل قبل الرفع: الأصالة، الحقوق، السلامة، سقف النشر، والفاصل الزمني.</CardDescription>
          </div>
          <Badge className={policy?.killSwitchEnabled ? "border border-amber-500/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/10" : "border border-emerald-500/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/10"}>{policy?.killSwitchEnabled ? "الإيقاف مفعّل" : "المحرك مسموح"}</Badge>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-zinc-100">وضع التشغيل</p><p className="mt-1 text-xs text-zinc-500">النشر العام لا يعمل إلا في وضع الحراسة.</p></div><Switch checked={policy?.mode === "guarded_auto"} disabled={policyBusy} onCheckedChange={checked => patchPolicy({ mode: checked ? "guarded_auto" : "human_review" })} /></div>
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-zinc-100">النشر العام</p><p className="mt-1 text-xs text-zinc-500">يبقى غير فعّال حتى ينجح تفويض YouTube واختبار الرفع الخاص.</p></div><Switch checked={policy?.publicPublishingEnabled ?? false} disabled={policyBusy} onCheckedChange={checked => patchPolicy({ publicPublishingEnabled: checked })} /></div>
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-zinc-100">نسخة اختبار خاصة</p><p className="mt-1 text-xs text-zinc-500">تجربة رفع محفوظة قبل السماح بالنسخة العامة.</p></div><Switch checked={policy?.requirePrivateCanary ?? true} disabled={policyBusy} onCheckedChange={checked => patchPolicy({ requirePrivateCanary: checked })} /></div>
          </div>
          <div className="space-y-3 rounded-xl border border-white/8 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-medium text-zinc-100">مفتاح الإيقاف الفوري</p><p className="mt-1 text-xs text-zinc-500">يمنع أي رفع جديد فورًا، مع بقاء السجل محفوظًا.</p></div><Switch checked={policy?.killSwitchEnabled ?? true} disabled={policyBusy} onCheckedChange={checked => patchPolicy({ killSwitchEnabled: checked })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <label className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><span className="text-[11px] text-zinc-500">أقصر فاصل (دقيقة)</span><Input type="number" min={10} max={1440} value={minIntervalMinutes} onChange={event => setMinIntervalMinutes(Math.max(10, Math.min(1440, Number(event.target.value) || 10)))} disabled={policyBusy} className="mt-2 h-9 border-white/10 bg-black/30 font-mono text-base text-white" /></label>
              <label className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><span className="text-[11px] text-zinc-500">السقف اليومي (فيديو)</span><Input type="number" min={1} max={144} value={maxPublicationsPerDay} onChange={event => setMaxPublicationsPerDay(Math.max(1, Math.min(144, Number(event.target.value) || 1)))} disabled={policyBusy} className="mt-2 h-9 border-white/10 bg-black/30 font-mono text-base text-white" /></label>
              <label className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><span className="text-[11px] text-zinc-500">هدف Reels / Shorts</span><Input type="number" min={0} max={100} value={dailyShortTarget} onChange={event => setDailyShortTarget(Math.max(0, Math.min(100, Number(event.target.value) || 0)))} disabled={policyBusy} className="mt-2 h-9 border-white/10 bg-black/30 font-mono text-base text-white" /></label>
              <label className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><span className="text-[11px] text-zinc-500">هدف الفيديو الطويل</span><Input type="number" min={0} max={20} value={dailyLongTarget} onChange={event => setDailyLongTarget(Math.max(0, Math.min(20, Number(event.target.value) || 0)))} disabled={policyBusy} className="mt-2 h-9 border-white/10 bg-black/30 font-mono text-base text-white" /></label>
            </div>
            <Button variant="outline" className="w-full border-white/10 bg-white/[0.03] text-zinc-200 hover:bg-white/[0.08] hover:text-white" disabled={policyBusy} onClick={() => patchPolicy({ minIntervalMinutes, maxPublicationsPerDay, dailyShortTarget, dailyLongTarget })}>حفظ حدود وأهداف النشر</Button>
            <a href="/docs/autonomous-youtube-policy.md" target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-red-300 hover:text-red-200"><ExternalLink className="ml-1 h-3.5 w-3.5" /> قراءة سياسة التشغيل الكاملة</a>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/8 bg-zinc-950/60">
        <CardHeader><CardTitle className="text-base text-white">آخر تسليمات الإشعارات</CardTitle></CardHeader>
        <CardContent>{events?.length ? <div className="space-y-2">{events.slice(0, 4).map(event => <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2.5"><div><p className="text-xs font-medium text-zinc-200">{event.eventType}</p><p className="mt-1 text-[11px] text-zinc-600">{event.detail}</p></div><Badge variant="outline" className="border-white/10 text-[10px] text-zinc-400">{event.deliveryStatus}</Badge></div>)}</div> : <p className="text-sm text-zinc-500">لا توجد إشعارات مُسجلة بعد.</p>}</CardContent>
      </Card>
    </div>
  );
}
