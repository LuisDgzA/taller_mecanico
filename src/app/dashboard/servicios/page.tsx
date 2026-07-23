import Link from "next/link";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { ServicioStatusBadge } from "@/components/dashboard/servicio-status-badge";
import { ServiciosSearch } from "@/components/dashboard/servicios-search";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type ServicioRow = {
  id: number;
  descripcion: string | null;
  status: number;
  fecha_inicio: string;
  imagen_uno: string | null;
  vehiculo: {
    id: number;
    placa: string;
    marca: string | null;
    modelo: string | null;
    cliente: { id: number; nombre: string | null } | null;
  } | null;
};

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

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const canAddServicios = await currentUserHasPermission(PERMISOS.SERVICIOS_ADD);
  const { search = "", status = "" } = await searchParams;

  const supabase = await createSupabaseServerComponentClient();

  let vehiculoIds: number[] | null = null;
  if (search) {
    const { data: vs } = await supabase
      .from("vehiculos")
      .select("id")
      .ilike("placa", `%${search}%`);

    vehiculoIds = vs?.map((v: { id: number }) => v.id) ?? [];
  }

  let query = supabase
    .from("servicios")
    .select(
      "id, descripcion, status, fecha_inicio, imagen_uno, vehiculo:vehiculos(id, placa, marca, modelo, cliente:clientes(id, nombre))",
    )
    .order("fecha_inicio", { ascending: false });

  if (status !== "") {
    const statusNum = Number(status);
    if (!Number.isNaN(statusNum)) {
      query = query.eq("status", statusNum) as typeof query;
    }
  }

  if (vehiculoIds !== null) {
    if (vehiculoIds.length > 0) {
      query = query.in("vehiculo_id", vehiculoIds) as typeof query;
    } else {
      query = query.ilike("descripcion", `%${search}%`) as typeof query;
    }
  }

  const { data: servicios, error } = await query.returns<ServicioRow[]>();

  if (error) {
    notFound();
  }

  const list = servicios ?? [];

  return (
    <>
      <PageHeader title="Órdenes de Servicio" />

      <ServiciosSearch defaultSearch={search} defaultStatus={status} />

      {list.length === 0 ? (
        <div className="px-4 lg:px-8 py-16 text-center text-sm text-on-surface-variant">
          <p className="font-medium text-on-surface">
            {search || status
              ? "Sin resultados para estos filtros."
              : "No hay servicios registrados."}
          </p>
          <p className="mt-1 text-xs">
            {search || status
              ? "Prueba cambiando la búsqueda o el estado."
              : "Agrega el primer servicio con el botón +."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant">
          {list.map((s) => (
            <Link
              key={s.id}
              href={`/dashboard/servicios/${s.id}`}
              className="flex flex-col gap-1.5 px-4 lg:px-8 py-3.5 transition-colors active:bg-surface-container-low hover:bg-surface-container-low"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="shrink-0 rounded border border-outline-variant px-1.5 py-0.5 font-mono text-[11px] font-medium tracking-wide text-on-surface-variant">
                    {s.vehiculo?.placa ?? "—"}
                  </span>
                  <span className="truncate text-sm font-semibold text-on-surface">
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

              {s.descripcion ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-on-surface-variant">
                  {s.descripcion}
                </p>
              ) : null}

              <p className="text-right text-[10px] text-on-surface-variant">
                {formatRelativeDate(s.fecha_inicio)}
              </p>
            </Link>
          ))}
        </div>
      )}

      {canAddServicios ? (
        <Link
          href="/dashboard/servicios/nuevo"
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition active:scale-95"
          aria-label="Agregar servicio"
        >
          <Plus className="size-6" />
        </Link>
      ) : null}
    </>
  );
}
