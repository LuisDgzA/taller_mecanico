import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { BottomNav } from "@/components/dashboard/bottom-nav";
import { OfflineGuard } from "@/components/dashboard/offline-guard";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
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

  const [canViewClientes, canViewUsuarios, canViewPermisos] = await Promise.all([
    currentUserHasPermission(PERMISOS.CLIENTES_VER),
    currentUserHasPermission(PERMISOS.USUARIOS_VER),
    currentUserHasPermission(PERMISOS.USUARIOS_PERMISOS),
  ]);

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <OfflineGuard>
        <main className="pb-20">{children}</main>
      </OfflineGuard>
      <BottomNav
        canViewPermisos={canViewPermisos}
        canViewUsuarios={canViewUsuarios}
        canViewClientes={canViewClientes}
      />
    </div>
  );
}
