import Link from "next/link";
import { notFound } from "next/navigation";

import { createServicioAction } from "@/actions/servicios";
import { NuevoServicioStep1Form } from "@/components/dashboard/nuevo-servicio-step1";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type VehiculoStep2 = {
  id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  cliente: { id: number; nombre: string | null; telefono: string | null } | null;
};

export default async function NuevoServicioPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; vehiculoId?: string; error?: string }>;
}) {
  const { step, vehiculoId, error } = await searchParams;

  // ── Step 2 ──────────────────────────────────────────────────
  if (step === "2" && vehiculoId) {
    const id = Number(vehiculoId);
    if (!Number.isFinite(id) || id <= 0) notFound();

    const supabase = await createSupabaseServerComponentClient();
    const { data: vehiculo } = await supabase
      .from("vehiculos")
      .select(
        "id, placa, marca, modelo, color, anio, cliente:clientes(id, nombre, telefono)",
      )
      .eq("id", id)
      .maybeSingle<VehiculoStep2>();

    if (!vehiculo) notFound();

    return (
      <main className="flex-1 px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
              F-06 · Paso 2 de 2
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Detalles del servicio
            </h1>
          </div>
          <Link
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-slate-950"
            href="/dashboard/servicios/nuevo"
          >
            ← Volver al paso 1
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          {/* Vehicle / client summary */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Vehículo seleccionado
              </p>
              <div className="mt-3 space-y-1">
                <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                  {vehiculo.placa}
                </span>
                <p className="mt-2 text-sm text-slate-700">
                  {[vehiculo.marca, vehiculo.modelo].filter(Boolean).join(" ") || "Sin datos"}
                </p>
                {vehiculo.color && (
                  <p className="text-sm text-slate-500">Color: {vehiculo.color}</p>
                )}
                {vehiculo.anio && (
                  <p className="text-sm text-slate-500">Año: {vehiculo.anio}</p>
                )}
              </div>
            </div>

            {vehiculo.cliente && (
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Cliente
                </p>
                <p className="mt-2 font-medium">
                  {vehiculo.cliente.nombre ?? "Sin nombre"}
                </p>
                {vehiculo.cliente.telefono && (
                  <p className="text-sm text-slate-500">
                    {vehiculo.cliente.telefono}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Service details form */}
          <form action={createServicioAction} className="space-y-5">
            <input name="vehiculoId" type="hidden" value={vehiculo.id} />

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Descripción
              </p>
              <textarea
                className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                name="descripcion"
                placeholder="Describe el problema o el trabajo a realizar…"
                rows={5}
              />
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Fotografías de ingreso
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Máximo 5 imágenes · JPG, PNG o WebP · hasta 10 MB cada una
              </p>
              <input
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                className="mt-4 w-full rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                multiple
                name="imagenes"
                type="file"
              />
            </div>

            <button
              className="h-12 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Registrar servicio
            </button>
          </form>
        </div>
      </main>
    );
  }

  // ── Step 1 ──────────────────────────────────────────────────
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
            F-06 · Paso 1 de 2
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Nuevo servicio
          </h1>
        </div>
        <Link
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-slate-950"
          href="/dashboard/servicios"
        >
          Cancelar
        </Link>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <NuevoServicioStep1Form error={error} />
      </div>
    </main>
  );
}
