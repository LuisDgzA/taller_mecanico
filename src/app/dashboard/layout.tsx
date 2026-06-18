import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRound } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { ActionButton } from "@/components/ui/action-button";
import { dashboardNavItems } from "@/components/dashboard/navigation-items";
import { InstallPwaButton } from "@/components/dashboard/install-pwa-button";
import { OfflineGuard } from "@/components/dashboard/offline-guard";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  if (!isSupabaseConfigured()) {
    redirect("/login?setup=1");
  }

  const staff = await getCurrentStaffProfile();

  if (!staff) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5ef_0%,#efe5d7_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:gap-6 lg:px-6">
        <aside className="hidden rounded-[2rem] border border-slate-900/10 bg-slate-950 px-5 py-6 text-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.8)] lg:flex lg:w-72 lg:flex-col">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-orange-300/75">
              Taller Mecánico
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Panel privado
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Base del sistema migrado a Next.js con Supabase.
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {dashboardNavItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:text-white"
                  href={item.href}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-4">
            <InstallPwaButton />
          </div>

          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Sesión
            </p>
            <p className="mt-2 text-sm font-medium">{staff.nombre}</p>
            <p className="mt-1 text-sm text-slate-300">{staff.correo}</p>
            <form action={logoutAction} className="mt-4">
              <ActionButton className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-70">
                Cerrar sesión
              </ActionButton>
            </form>
          </div>
        </aside>

        <div className="flex flex-1 flex-col gap-4 pb-24 lg:pb-0">
          <header className="flex items-center justify-between rounded-[1.75rem] bg-slate-950 px-5 py-4 text-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.9)] lg:hidden">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-orange-300/80">
                Taller Mecánico
              </p>
              <p className="mt-1 text-sm font-semibold">Panel privado</p>
            </div>
            <div className="flex items-center gap-2">
              <InstallPwaButton mobile />
              <div className="text-right">
                <p className="text-sm font-medium">{staff.nombre}</p>
                <p className="text-xs text-slate-300">Personal activo</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-2 text-slate-200">
                <UserRound className="size-5" />
              </div>
            </div>
          </header>

          <div className="flex min-h-[80vh] flex-1 flex-col rounded-[2rem] border border-slate-900/10 bg-white/90 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
            <OfflineGuard>{children}</OfflineGuard>
          </div>
        </div>
      </div>

      <BottomNav className="lg:hidden" />
    </div>
  );
}
