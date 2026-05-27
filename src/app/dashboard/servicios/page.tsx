import Link from "next/link";
import { notFound } from "next/navigation";

import { ServicioStatusBadge } from "@/components/dashboard/servicio-status-badge";
import { ServiciosSearch } from "@/components/dashboard/servicios-search";
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
  const { search = "", status = "" } = await searchParams;

  const supabase = await createSupabaseServerComponentClient();

  // Two-step search: first resolve matching vehiculo IDs by placa
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
      // Plate search yielded nothing — try description
      query = query.ilike("descripcion", `%${search}%`) as typeof query;
    }
  }

  const { data: servicios, error } = await query.returns<ServicioRow[]>();

  if (error) {
    notFound();
  }

  const list = servicios ?? [];

  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
            F-07
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Servicios
          </h1>
        </div>
        <Link
          className="rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          href="/dashboard/servicios/nuevo"
        >
          + Agregar servicio
        </Link>
      </div>

      <div className="mt-6">
        <ServiciosSearch defaultSearch={search} defaultStatus={status} />
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-16 text-center text-sm text-slate-500">
          {search || status
            ? "No hay servicios que coincidan con los filtros."
            : "No hay servicios registrados aún."}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {list.map((s) => (
            <Link
              key={s.id}
              className="block rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400"
              href={`/dashboard/servicios/${s.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    {s.vehiculo?.placa ?? "—"}
                  </span>
                  <ServicioStatusBadge status={s.status} />
                </div>
                <span className="text-xs text-slate-400">
                  {formatRelativeDate(s.fecha_inicio)}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm font-medium text-slate-800">
                  {[s.vehiculo?.marca, s.vehiculo?.modelo].filter(Boolean).join(" ") || "Sin datos de vehículo"}
                </p>
                {s.vehiculo?.cliente?.nombre ? (
                  <p className="text-sm text-slate-500">
                    {s.vehiculo.cliente.nombre}
                  </p>
                ) : null}
                {s.descripcion ? (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {s.descripcion}
                  </p>
                ) : null}
              </div>

              {s.status === 2 ? (
                <div className="mt-3 inline-flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  Listo para entrega
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
