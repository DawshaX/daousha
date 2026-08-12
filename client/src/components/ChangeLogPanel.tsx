import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ScrollText } from "lucide-react";

export default function ChangeLogPanel() {
  const { data: entries } = trpc.daousha.changeLog.useQuery();
  return <Card className="border-white/8 bg-zinc-950/60"><CardHeader><CardTitle className="flex items-center gap-2 text-white"><ScrollText className="h-5 w-5 text-red-400" /> سجل التغييرات المنفذة</CardTitle><CardDescription className="mt-2 text-zinc-500">يوثق القرارات والتغييرات التي تمت بالفعل، منفصلًا عن الاقتراحات.</CardDescription></CardHeader><CardContent>{entries?.length === 0 ? <p className="rounded-lg border border-white/8 bg-white/[0.02] p-4 text-sm text-zinc-600">لا توجد تغييرات منفذة بعد.</p> : <div className="space-y-2">{entries?.map(entry => <div key={entry.id} className="rounded-lg border border-white/8 bg-white/[0.02] p-3"><p className="text-sm font-medium text-zinc-200">{entry.summary}</p><p className="mt-1 text-xs leading-5 text-zinc-600">{entry.details || "لا توجد تفاصيل إضافية."}</p></div>)}</div>}</CardContent></Card>;
}
