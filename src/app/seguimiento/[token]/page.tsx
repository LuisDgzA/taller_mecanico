import { notFound } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type TrackingServicio = {
  id: number;
  status: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  fecha_entrega: string | null;
  descripcion: string | null;
  imagen_uno: string | null;
  imagen_dos: string | null;
  imagen_tres: string | null;
  imagen_cuatro: string | null;
  imagen_cinco: string | null;
  vehiculo: {
    placa: string;
    marca: string | null;
    modelo: string | null;
    color: string | null;
    anio: number | null;
  } | null;
};

type TrackingBitacora = {
  id: number;
  fecha: string;
  descripcion: string;
  imagen_uno: string | null;
  imagen_dos: string | null;
  imagen_tres: string | null;
  imagen_cuatro: string | null;
};

const STATUS_STEPS = [
  { label: "Pendiente", value: 0 },
  { label: "En progreso", value: 1 },
  { label: "Finalizado", value: 2 },
  { label: "Entregado", value: 3 },
];

function formatDate(d: string) {
  return new Date(d).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function getSignedUrl(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  bucket: string,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (!token || token.length < 10) notFound();

  const supabase = createSupabaseAdminClient();

  const { data: servicio } = await supabase
    .from("servicios")
    .select(
      `id, status, fecha_inicio, fecha_fin, fecha_entrega, descripcion,
       imagen_uno, imagen_dos, imagen_tres, imagen_cuatro, imagen_cinco,
       vehiculo:vehiculos(placa, marca, modelo, color, anio)`,
    )
    .eq("tracking_token", token)
    .maybeSingle<TrackingServicio>();

  if (!servicio) notFound();

  // Link expires 48 hours after delivery
  if (servicio.status === 3 && servicio.fecha_entrega) {
    const ms = Date.now() - new Date(servicio.fecha_entrega).getTime();
    if (ms > 24 * 60 * 60 * 1000) notFound();
  }

  const { data: bitacorasRaw } = await supabase
    .from("bitacoras")
    .select("id, fecha, descripcion, imagen_uno, imagen_dos, imagen_tres, imagen_cuatro")
    .eq("servicio_id", servicio.id)
    .order("fecha", { ascending: true })
    .returns<TrackingBitacora[]>();

  const bitacoras = bitacorasRaw ?? [];

  const serviceImageUrls = await Promise.all(
    [servicio.imagen_uno, servicio.imagen_dos, servicio.imagen_tres, servicio.imagen_cuatro, servicio.imagen_cinco].map(
      (p) => getSignedUrl(supabase, "servicios", p),
    ),
  );

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

  const v = servicio.vehiculo;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5ef_0%,#efe5d7_100%)]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-700/70">
            Taller Mecánico
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            Seguimiento de servicio
          </h1>
          <p className="mt-1 text-sm text-slate-500">#{servicio.id}</p>
        </div>

        {/* Status stepper */}
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm mb-4">
          <div className="flex items-start">
            {STATUS_STEPS.map((step, idx) => {
              const done = servicio.status === 3 || servicio.status > step.value;
              const active = !done && servicio.status === step.value;
              const isLast = idx === STATUS_STEPS.length - 1;

              return (
                <div key={step.value} className="flex flex-1 flex-col items-center relative">
                  {!isLast ? (
                    <div
                      className={`absolute top-3.5 left-1/2 w-full h-0.5 transition-colors ${
                        done ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                    />
                  ) : null}

                  <div
                    className={`relative z-10 size-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      done
                        ? "bg-emerald-500 text-white"
                        : active
                          ? "bg-slate-950 text-white"
                          : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {done ? "✓" : idx + 1}
                  </div>

                  <p
                    className={`mt-2 text-center text-xs leading-tight transition-colors ${
                      active
                        ? "font-semibold text-slate-950"
                        : done
                          ? "text-emerald-700"
                          : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery banner */}
        {servicio.status === 3 && servicio.fecha_entrega ? (
          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5 mb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-700">
              Vehículo entregado
            </p>
            <p className="mt-1 font-medium text-emerald-900">
              {formatDate(servicio.fecha_entrega)}
            </p>
          </div>
        ) : null}

        {/* Vehicle card */}
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm mb-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Vehículo</p>
          <div className="mt-3 space-y-1">
            <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
              {v?.placa ?? "—"}
            </span>
            <p className="mt-2 font-medium">
              {[v?.marca, v?.modelo].filter(Boolean).join(" ") || "Sin datos"}
            </p>
            {v?.color ? (
              <p className="text-sm text-slate-500">Color: {v.color}</p>
            ) : null}
            {v?.anio ? (
              <p className="text-sm text-slate-500">Año: {v.anio}</p>
            ) : null}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Ingreso</p>
            <p className="mt-1 text-sm text-slate-700">
              {formatDate(servicio.fecha_inicio)}
            </p>
          </div>

          {servicio.fecha_fin ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Trabajo finalizado
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {formatDate(servicio.fecha_fin)}
              </p>
            </div>
          ) : null}

          {servicio.descripcion ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Trabajo solicitado
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {servicio.descripcion}
              </p>
            </div>
          ) : null}
        </div>

        {/* Bitácora updates */}
        {bitacoras.length > 0 ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm mb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Actualizaciones
            </p>
            <div className="mt-4 space-y-4">
              {bitacoras.map((entry, idx) => {
                const imgs = bitacoraImageUrls[idx].filter(Boolean) as string[];
                return (
                  <div
                    key={entry.id}
                    className="rounded-3xl border border-slate-200 p-4"
                  >
                    <p className="text-xs text-slate-400">{formatDate(entry.fecha)}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
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
          </div>
        ) : (
          servicio.status < 3 ? (
            <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white/50 p-6 text-center text-sm text-slate-400 mb-4">
              El taller publicará actualizaciones aquí conforme avance el trabajo.
            </div>
          ) : null
        )}

        {/* Service entry photos */}
        {serviceImageUrls.some(Boolean) ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm mb-4">
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
                    alt={`Fotografía ${i + 1}`}
                    className="aspect-square w-full object-cover"
                    src={url!}
                  />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-center text-xs text-slate-400 mt-6">
          Este enlace es exclusivo para este servicio — solo tú lo tienes.
        </p>
      </div>
    </div>
  );
}
