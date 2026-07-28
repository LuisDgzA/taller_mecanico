import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { BottomNav } from "@/components/dashboard/bottom-nav";
import { DesktopSidebar } from "@/components/dashboard/desktop-sidebar";
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

  const [canViewServicios, canViewClientes, canViewUsuarios, canViewPermisos] = await Promise.all([
    currentUserHasPermission(PERMISOS.SERVICIOS_VER),
    currentUserHasPermission(PERMISOS.CLIENTES_VER),
    currentUserHasPermission(PERMISOS.USUARIOS_VER),
    currentUserHasPermission(PERMISOS.USUARIOS_PERMISOS),
  ]);

  return (
    <div className="min-h-screen bg-surface text-on-surface lg:flex">
      <DesktopSidebar
        canViewServicios={canViewServicios}
        canViewClientes={canViewClientes}
        canViewUsuarios={canViewUsuarios}
        canViewPermisos={canViewPermisos}
        userNombre={staff.nombre}
        userCorreo={staff.correo}
      />
      <div className="flex min-h-screen flex-1 flex-col lg:ml-60">
        <OfflineGuard>
          <main className="flex-1 pb-20 lg:pb-0">{children}</main>
        </OfflineGuard>
      </div>
      <BottomNav
        canViewServicios={canViewServicios}
        canViewPermisos={canViewPermisos}
        canViewUsuarios={canViewUsuarios}
        canViewClientes={canViewClientes}
      />
    </div>
  );
}
