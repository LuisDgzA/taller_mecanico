import Link from "next/link";
import {
  ClipboardList,
  LogOut,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { logoutAction } from "@/actions/auth";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServicioStatusBadge } from "@/components/dashboard/servicio-status-badge";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type RecentServicio = {
  id: number;
  descripcion: string | null;
  status: number;
  fecha_inicio: string;
  vehiculo: {
    placa: string;
    marca: string | null;
    modelo: string | null;
    cliente: { nombre: string | null } | null;
  } | null;
};

const quickActions = [
  { href: "/dashboard/servicios/nuevo", label: "Nuevo Servicio", icon: Plus },
  { href: "/dashboard/servicios", label: "Ver Servicios", icon: ClipboardList },
  { href: "/dashboard/clientes", label: "Clientes", icon: UserRound },
  { href: "/dashboard/usuarios", label: "Usuarios", icon: Users },
  { href: "/dashboard/permisos", label: "Permisos", icon: ShieldCheck },
];

function formatRelativeDate(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `hace ${days} día${days === 1 ? "" : "s"}`;
  if (hours > 0) return `hace ${hours} hora${hours === 1 ? "" : "s"}`;
  if (minutes > 0) return `hace ${minutes} min`;
  return "hace un momento";
}

export default async function DashboardPage() {
  const [staff, supabase, canViewServicios, canAddServicios, canViewUsuarios, canViewPermisos] = await Promise.all([
    getCurrentStaffProfile(),
    createSupabaseServerComponentClient(),
    currentUserHasPermission(PERMISOS.SERVICIOS_VER),
    currentUserHasPermission(PERMISOS.SERVICIOS_ADD),
    currentUserHasPermission(PERMISOS.USUARIOS_VER),
    currentUserHasPermission(PERMISOS.USUARIOS_PERMISOS),
  ]);

  const visibleQuickActions = quickActions.filter((action) => {
    if (action.href === "/dashboard/servicios" && !canViewServicios) {
      return false;
    }

    if (action.href === "/dashboard/servicios/nuevo" && !canAddServicios) {
      return false;
    }

    if (action.href === "/dashboard/usuarios" && !canViewUsuarios) {
      return false;
    }

    if (action.href === "/dashboard/permisos" && !canViewPermisos) {
      return false;
    }

    return true;
  });

  const recentServices = canViewServicios
    ? (
      await supabase
        .from("servicios")
        .select(
          "id, descripcion, status, fecha_inicio, vehiculo:vehiculos(placa, marca, modelo, cliente:clientes(nombre))",
        )
        .order("fecha_inicio", { ascending: false })
        .limit(5)
        .returns<RecentServicio[]>()
    ).data ?? []
    : [];

  return (
    <>
      <PageHeader title="WorkshopPro" />

      {/* Welcome */}
      <div className="border-b border-outline-variant px-4 py-4">
        <p className="text-base font-semibold text-on-surface">
          Hola, {staff?.nombre?.split(" ")[0] ?? "usuario"}
        </p>
      </div>

      {/* Quick actions */}
      <div className="bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Acciones rápidas
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        {visibleQuickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-center transition active:bg-surface-container-low"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container">
                <Icon className="size-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-on-surface">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Recent activity */}
      {canViewServicios ? (
        <>
          <div className="mt-2 bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Actividad reciente
          </div>

          {recentServices.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
              No hay servicios registrados aún.
            </div>
          ) : (
            <div className="divide-y divide-outline-variant">
              {recentServices.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/servicios/${s.id}`}
                  className="flex flex-col gap-1.5 px-4 py-3 transition-colors active:bg-surface-container-low"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="shrink-0 rounded border border-outline-variant px-1.5 py-0.5 font-mono text-[11px] font-medium text-on-surface-variant">
                        {s.vehiculo?.placa ?? "—"}
                      </span>
                      <span className="truncate text-sm font-medium text-on-surface">
                        {[s.vehiculo?.marca, s.vehiculo?.modelo]
                          .filter(Boolean)
                          .join(" ") || "Sin vehículo"}
                      </span>
                    </div>
                    <ServicioStatusBadge status={s.status} />
                  </div>
                  {s.vehiculo?.cliente?.nombre ? (
                    <p className="text-xs text-on-surface-variant">
                      {s.vehiculo.cliente.nombre}
                    </p>
                  ) : null}
                  <p className="text-right text-[10px] text-on-surface-variant">
                    {formatRelativeDate(s.fecha_inicio)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </>
      ) : null}

      {/* Session */}
      <div className="mt-4 bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Sesión
      </div>
      <div className="px-4 py-4 pb-6">
        <p className="text-sm font-medium text-on-surface">
          {staff?.nombre ?? "—"}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          {staff?.correo ?? "—"}
        </p>
        <form action={logoutAction} className="mt-4">
          <ActionButton className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-outline-variant text-sm font-medium text-on-surface transition disabled:opacity-60">
            <LogOut className="size-4" />
            Cerrar sesión
          </ActionButton>
        </form>
      </div>
    </>
  );
}
