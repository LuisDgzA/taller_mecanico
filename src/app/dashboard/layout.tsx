import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CarFront, ClipboardList, LayoutGrid, Users } from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutGrid },
  { href: "/dashboard/servicios", label: "Servicios", icon: ClipboardList },
  { href: "/dashboard/clientes", label: "Clientes", icon: CarFront },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
];

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
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-4 lg:flex-row lg:gap-6 lg:px-6">
        <aside className="mb-4 rounded-[2rem] border border-slate-900/10 bg-slate-950 px-5 py-6 text-white shadow-[0_30px_70px_-45px_rgba(15,23,42,0.8)] lg:mb-0 lg:w-72">
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
            {navItems.map((item) => {
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

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Sesión
            </p>
            <p className="mt-2 text-sm font-medium">{staff.nombre}</p>
            <p className="mt-1 text-sm text-slate-300">{staff.correo}</p>
            <form action={logoutAction} className="mt-4">
              <button
                className="w-full rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400"
                type="submit"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </aside>

        <div className="flex min-h-[80vh] flex-1 flex-col rounded-[2rem] border border-slate-900/10 bg-white/90 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
          {children}
        </div>
      </div>
    </div>
  );
}
