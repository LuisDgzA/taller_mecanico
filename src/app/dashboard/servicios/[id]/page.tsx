import Link from "next/link";
import { notFound } from "next/navigation";

import { createBitacoraAction, deleteBitacoraAction } from "@/actions/bitacoras";
import { updateServicioStatusAction } from "@/actions/servicios";
import { ServicioStatusBadge } from "@/components/dashboard/servicio-status-badge";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type ServicioDetail = {
  id: number;
  descripcion: string | null;
  status: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  imagen_uno: string | null;
  imagen_dos: string | null;
  imagen_tres: string | null;
  imagen_cuatro: string | null;
  imagen_cinco: string | null;
  vehiculo: {
    id: number;
    placa: string;
    marca: string | null;
    modelo: string | null;
    color: string | null;
    anio: number | null;
    cliente: { id: number; nombre: string | null; telefono: string | null } | null;
  } | null;
  recibido_por: { nombre: string } | null;
};

type BitacoraRow = {
  id: number;
  fecha: string;
  descripcion: string;
  imagen_uno: string | null;
  imagen_dos: string | null;
  imagen_tres: string | null;
  imagen_cuatro: string | null;
  autor: { id: number; nombre: string } | null;
};

async function getSignedUrl(
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>>,
  bucket: string,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const NEXT_STATUS: Record<number, { value: number; label: string } | null> = {
  0: { value: 1, label: "Marcar En Progreso" },
  1: { value: 2, label: "Marcar Finalizado" },
  2: null,
  3: null,
};

export default async function ServicioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const feedback = await searchParams;
  const servicioId = Number(id);

  if (!Number.isFinite(servicioId) || servicioId <= 0) notFound();

  const supabase = await createSupabaseServerComponentClient();
  const staff = await getCurrentStaffProfile();

  const [{ data: servicio }, { data: bitacorasRaw }] = await Promise.all([
    supabase
      .from("servicios")
      .select(
        `id, descripcion, status, fecha_inicio, fecha_fin,
         imagen_uno, imagen_dos, imagen_tres, imagen_cuatro, imagen_cinco,
         vehiculo:vehiculos(id, placa, marca, modelo, color, anio,
           cliente:clientes(id, nombre, telefono)
         ),
         recibido_por:usuarios!usuario_recibe(nombre)`,
      )
      .eq("id", servicioId)
      .maybeSingle<ServicioDetail>(),
    supabase
      .from("bitacoras")
      .select(
        "id, fecha, descripcion, imagen_uno, imagen_dos, imagen_tres, imagen_cuatro, autor:usuarios!usuario_id(id, nombre)",
      )
      .eq("servicio_id", servicioId)
      .order("fecha", { ascending: true })
      .returns<BitacoraRow[]>(),
  ]);

  if (!servicio) notFound();

  // Generate signed URLs for service images
  const serviceImagePaths = [
    servicio.imagen_uno,
    servicio.imagen_dos,
    servicio.imagen_tres,
    servicio.imagen_cuatro,
    servicio.imagen_cinco,
  ];

  const serviceImageUrls = await Promise.all(
    serviceImagePaths.map((p) => getSignedUrl(supabase, "servicios", p)),
  );

  // Generate signed URLs for each bitácora entry
  const bitacoras = bitacorasRaw ?? [];
  const bitacoraImageUrls = await Promise.all(
    bitacoras.map((b) =>
      Promise.all([
        getSignedUrl(supabase, "bitacoras", b.imagen_uno),
        getSignedUrl(supabase, "bitacoras", b.imagen_dos),
        getSignedUrl(supabase, "bitacoras", b.imagen_tres),
        getSignedUrl(supabase, "bitacoras", b.imagen_cuatro),
      ]),
    ),
  );

  const nextStatus = NEXT_STATUS[servicio.status] ?? null;
  const error = feedback.error?.trim() ?? "";
  const success = feedback.success?.trim() ?? "";

  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
            F-08
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Servicio #{servicio.id}
          </h1>
        </div>
        <Link
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-slate-950"
          href="/dashboard/servicios"
        >
          ← Volver a servicios
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.6fr]">
        {/* Left column — service summary */}
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Vehículo
            </p>
            <div className="mt-3 space-y-1">
              <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                {servicio.vehiculo?.placa ?? "—"}
              </span>
              <p className="mt-2 font-medium">
                {[servicio.vehiculo?.marca, servicio.vehiculo?.modelo]
                  .filter(Boolean)
                  .join(" ") || "Sin datos"}
              </p>
              {servicio.vehiculo?.color ? (
                <p className="text-sm text-slate-500">
                  Color: {servicio.vehiculo.color}
                </p>
              ) : null}
              {servicio.vehiculo?.anio ? (
                <p className="text-sm text-slate-500">
                  Año: {servicio.vehiculo.anio}
                </p>
              ) : null}
            </div>

            {servicio.vehiculo?.cliente ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Cliente
                </p>
                <p className="mt-1 font-medium">
                  {servicio.vehiculo.cliente.nombre ?? "Sin nombre"}
                </p>
                {servicio.vehiculo.cliente.telefono ? (
                  <p className="text-sm text-slate-500">
                    {servicio.vehiculo.cliente.telefono}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 border-t border-slate-100 pt-4 space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Ingreso
              </p>
              <p className="text-sm text-slate-700">
                {formatDate(servicio.fecha_inicio)}
              </p>
              {servicio.recibido_por?.nombre ? (
                <p className="text-sm text-slate-500">
                  Recibió: {servicio.recibido_por.nombre}
                </p>
              ) : null}
            </div>

            {servicio.fecha_fin ? (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Finalizado
                </p>
                <p className="text-sm text-slate-700">
                  {formatDate(servicio.fecha_fin)}
                </p>
              </div>
            ) : null}
          </div>

          {/* Status + transition */}
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Estado actual
            </p>
            <div className="mt-3">
              <ServicioStatusBadge status={servicio.status} />
            </div>

            {nextStatus ? (
              <form action={updateServicioStatusAction} className="mt-4">
                <input name="id" type="hidden" value={servicio.id} />
                <input name="status" type="hidden" value={nextStatus.value} />
                <button
                  className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-medium transition hover:border-slate-950 hover:bg-slate-50"
                  type="submit"
                >
                  {nextStatus.label}
                </button>
              </form>
            ) : null}

            {servicio.status === 2 ? (
              <Link
                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                href={`/dashboard/servicios/${servicio.id}/entrega`}
              >
                Entregar vehículo →
              </Link>
            ) : null}
          </div>

          {/* Description */}
          {servicio.descripcion ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Descripción
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {servicio.descripcion}
              </p>
            </div>
          ) : null}

          {/* Service photos */}
          {serviceImageUrls.some(Boolean) ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Fotografías de ingreso
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {serviceImageUrls.filter(Boolean).map((url, i) => (
                  <a
                    key={i}
                    className="block overflow-hidden rounded-2xl"
                    href={url!}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={`Imagen ${i + 1}`}
                      className="aspect-square w-full object-cover"
                      src={url!}
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right column — bitácora */}
        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Bitácora de trabajo
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">
              {bitacoras.length} nota{bitacoras.length !== 1 ? "s" : ""}
            </h2>

            {bitacoras.length === 0 ? (
              <div className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Aún no hay notas en esta bitácora.
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                {bitacoras.map((entry, idx) => {
                  const imgs = bitacoraImageUrls[idx].filter(Boolean) as string[];
                  const isOwn = staff?.id === entry.autor?.id;

                  return (
                    <div
                      key={entry.id}
                      className="rounded-3xl border border-slate-200 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex size-7 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">
                              {entry.autor?.nombre?.charAt(0).toUpperCase() ?? "?"}
                            </span>
                            <span className="text-sm font-medium">
                              {entry.autor?.nombre ?? "Desconocido"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {formatDate(entry.fecha)}
                          </p>
                        </div>

                        {isOwn ? (
                          <form action={deleteBitacoraAction}>
                            <input name="id" type="hidden" value={entry.id} />
                            <input
                              name="servicioId"
                              type="hidden"
                              value={servicio.id}
                            />
                            <button
                              className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-100"
                              type="submit"
                            >
                              Eliminar
                            </button>
                          </form>
                        ) : null}
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-700">
                        {entry.descripcion}
                      </p>

                      {imgs.length > 0 ? (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {imgs.map((url, i) => (
                            <a
                              key={i}
                              className="block overflow-hidden rounded-xl"
                              href={url}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                alt={`Foto ${i + 1}`}
                                className="aspect-square w-full object-cover"
                                src={url}
                              />
                            </a>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add bitácora entry */}
          {servicio.status !== 3 ? (
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Agregar nota
              </p>
              <form action={createBitacoraAction} className="mt-4 space-y-4">
                <input
                  name="servicioId"
                  type="hidden"
                  value={servicio.id}
                />
                <label className="block text-sm font-medium text-slate-700">
                  Descripción *
                  <textarea
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                    minLength={5}
                    name="descripcion"
                    placeholder="Describe el trabajo realizado…"
                    required
                    rows={4}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Fotografías
                  <p className="mt-0.5 text-xs font-normal text-slate-400">
                    Máximo 4 · JPG, PNG o WebP
                  </p>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-2 w-full rounded-2xl border border-dashed border-slate-300 p-3 text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-slate-950 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                    multiple
                    name="imagenes"
                    type="file"
                  />
                </label>
                <button
                  className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
                  type="submit"
                >
                  Agregar nota
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
