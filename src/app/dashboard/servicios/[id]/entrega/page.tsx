import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { EntregaForm } from "./_form";

type ServicioEntrega = {
  id: number;
  descripcion: string | null;
  status: number;
  fecha_inicio: string;
  vehiculo: {
    placa: string;
    marca: string | null;
    modelo: string | null;
    color: string | null;
    anio: number | null;
    cliente: { nombre: string | null; telefono: string | null } | null;
  } | null;
};

function now() {
  return new Date().toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default async function EntregaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const servicioId = Number(id);

  if (!Number.isFinite(servicioId) || servicioId <= 0) notFound();

  const canEntregarVehiculo = await currentUserHasPermission(PERMISOS.SERVICIOS_ENTREGAR_V);

  if (!canEntregarVehiculo) {
    redirect(`/dashboard/servicios/${servicioId}?error=No+tienes+permiso+para+entregar+vehiculos.`);
  }

  const supabase = await createSupabaseServerComponentClient();

  const { data: servicio } = await supabase
    .from("servicios")
    .select(
      `id, descripcion, status, fecha_inicio,
       vehiculo:vehiculos(placa, marca, modelo, color, anio,
         cliente:clientes(nombre, telefono)
       )`,
    )
    .eq("id", servicioId)
    .maybeSingle<ServicioEntrega>();

  if (!servicio) notFound();

  // Only Finalizado services (status=2) can be delivered
  if (servicio.status !== 2) {
    redirect(`/dashboard/servicios/${servicioId}`);
  }

  const v = servicio.vehiculo;
  const c = v?.cliente ?? null;

  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Entrega de vehículo
          </h1>
        </div>
        <Link
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-slate-950"
          href={`/dashboard/servicios/${servicioId}`}
        >
          ← Volver al servicio
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* ── Service summary ── */}
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Vehículo a entregar
            </p>
            <div className="mt-3 space-y-2">
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {v?.placa ?? "—"}
              </span>
              <p className="font-medium">
                {[v?.marca, v?.modelo].filter(Boolean).join(" ") || "Sin datos"}
              </p>
              {v?.color ? (
                <p className="text-sm text-slate-500">Color: {v.color}</p>
              ) : null}
              {v?.anio ? (
                <p className="text-sm text-slate-500">Año: {v.anio}</p>
              ) : null}
            </div>

            {c ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Cliente
                </p>
                <p className="mt-1 font-medium">{c.nombre ?? "Sin nombre"}</p>
                {c.telefono ? (
                  <p className="text-sm text-slate-500">{c.telefono}</p>
                ) : null}
              </div>
            ) : null}

            {servicio.descripcion ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Servicio realizado
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700">
                  {servicio.descripcion}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
              Fecha y hora de entrega
            </p>
            <p className="mt-2 font-medium text-emerald-900">{now()}</p>
          </div>
        </div>

        {/* ── Signature form ── */}
        <EntregaForm servicioId={servicioId} error={error} />
      </div>
    </main>
  );
}
