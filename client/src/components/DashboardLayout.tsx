import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, Bot, CalendarClock, CircleCheckBig, FolderOpen, LayoutDashboard, LibraryBig, LogOut, Orbit, PanelLeft, Settings2, Skull, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "غرفة التحكم", path: "/" },
  { icon: Orbit, label: "رادار الترندات", path: "/trends" },
  { icon: LibraryBig, label: "مكتبة المواد", path: "/library" },
  { icon: Sparkles, label: "استوديو الإنتاج", path: "/studio" },
  { icon: CircleCheckBig, label: "بوابة المراجعة", path: "/review" },
  { icon: CalendarClock, label: "الأتمتة والجدولة", path: "/automation" },
  { icon: BarChart3, label: "التحليلات", path: "/insights" },
  { icon: Bot, label: "سجل التطوير", path: "/evolution" },
  { icon: Settings2, label: "الإعدادات", path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-5 dir-rtl">
      <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-950 p-8 text-center shadow-[0_0_60px_rgba(147,51,234,.12)]">
        <Skull className="mx-auto h-11 w-11 text-violet-400" />
        <h1 className="mt-5 text-2xl font-black text-white">XDAW NOVA يحتاج دخولك</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">سجّل الدخول لفتح لوحة التحكم وحفظ مشروعاتك ومصادرك.</p>
        <Button onClick={() => startLogin()} className="mt-6 w-full bg-violet-600 hover:bg-violet-500">
          تسجيل الدخول
        </Button>
      </div>
    </div>
  );

  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const active = menuItems.findItem(item => item.path === location);
  return <SidebarProvider defaultOpen={true}>
    <Sidebar collapsible="icon" side="right" className="border-l border-white/8 bg-[var(--sidebar-bg)]" dir="rtl">
      <SidebarHeader className="h-[78px] border-b border-white/8 px-3">
        <div className="flex h-full items-center gap-3">
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-violet-500/25 bg-violet-500/10 shadow-[0_0_26px_rgba(147,51,234,.18)]">
            <img src="/docs/dawsha-app-icon.png" alt="شعار Daousha" className="h-full w-full object-contain p-1" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-lg font-black tracking-tight text-white">Daousha</p>
            <p className="font-mono text-[9px] tracking-[0.18em] text-violet-300">CONTENT ENGINE</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarMenu className="gap-1">
          {menuItems.map(item => {
            const activeItem = location === item.path;
            return <SidebarMenuItem key={item.path}>
              <SidebarMenuButton isActive={activeItem} tooltip={item.label} onClick={() => setLocation(item.path)} className="h-10 rounded-lg px-3 text-zinc-400 transition-colors hover:bg-violet-500/[0.07] hover:text-violet-100 data-[active=true]:bg-violet-500/[0.12] data-[active=true]:font-semibold data-[active=true]:text-violet-200">
                {item.icon} className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>;
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-white/8 p-3">
        <div className="mb-3 rounded-lg border border-violet-500/15 bg-violet-500/[0.04] p-2.5 group-data-[collapsible=icon]:hidden">
          <p className="text-[10px] font-semibold text-violet-200">نشر محمي</p>
          <p className="mt-1 text-[10px] leading-4 text-zinc-600">الموافقة البشرية مطلوبة قبل كل نشر.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-1 text-right outline-none transition-colors hover:bg-white/[0.04]">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarFallback className="bg-zinc-800 text-xs text-violet-200">{user?.name?.charAt(0).toUpperCase() || "د"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-xs font-medium text-violet-300">{user?.name || "المالك"}</p>
                <p className="mt-0.5 truncate text-[10px] text-zinc-600">جلسة محمية</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="border-violet-10 bg-zinc-950 text-violet-200">
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-violet-300 focus:bg-violet-500/10 focus:text-violet-200">
              <LogOut className="ml-2 h-4 w-4" />تسجيل الخروج
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
    <SidebarInset className="bg-[var(--bg)] text-zinc-100">
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:44px_44px]" />
        {isMobile ? (
          <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/8 bg-zinc-950/90 px-4 backdrop-blur">
            <span className="text-sm font-bold text-violet-100">{active?.label ?? "Daousha"}</span>
            <SidebarTrigger className="border border-white/10 bg-white/[0.03] text-violet-200" />
          </div>
        ) : (
          <button aria-label="طي القائمة" className="absolute left-5 top-5 z-20 grid h-9 w-9 place-items-center rounded-lg border border-white/8 bg-zinc-950/60 text-violet-200 transition-colors hover:border-violet-500/30 hover:text-violet-300" onClick={() => document.querySelector<HTMLButtonElement>("[data-sidebar=trigger]")?.click()}>
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        <main className="relative p-4 sm:p-7 lg:p-9">{children}</main>
      </div>
    </SidebarInset>
  </SidebarProvider>;
}