import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "lucide-react";

import { createBitacoraAction, deleteBitacoraAction } from "@/actions/bitacoras";
import { updateServicioStatusAction } from "@/actions/servicios";
import { ActionButton } from "@/components/ui/action-button";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { ImageViewer } from "@/components/dashboard/image-viewer";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServiceDetailTabs } from "@/components/dashboard/service-detail-tabs";
import { ServicioStatusBadge } from "@/components/dashboard/servicio-status-badge";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type ServicioDetail = {
  id: number;
  descripcion: string | null;
  status: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  tracking_token: string | null;
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

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
      {children}
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="shrink-0 text-xs text-on-surface-variant">{label}</span>
      <span className="text-right text-sm text-on-surface">{children}</span>
    </div>
  );
}

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
        `id, descripcion, status, fecha_inicio, fecha_fin, tracking_token,
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

  const serviceImageUrls = await Promise.all(
    [servicio.imagen_uno, servicio.imagen_dos, servicio.imagen_tres,
     servicio.imagen_cuatro, servicio.imagen_cinco].map((p) =>
      getSignedUrl(supabase, "servicios", p),
    ),
  );

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

  // ── Tab: Información ──────────────────────────────────────────────
  const infoContent = (
    <div>
      {/* Status + advance action */}
      <div className="flex items-center gap-3 border-b border-outline-variant px-4 py-3">
        <ServicioStatusBadge status={servicio.status} />
        {nextStatus ? (
          <form action={updateServicioStatusAction} className="flex-1">
            <input name="id" type="hidden" value={servicio.id} />
            <input name="status" type="hidden" value={nextStatus.value} />
            <ActionButton className="h-9 w-full rounded-lg border border-primary text-sm font-medium text-primary transition disabled:opacity-60">
              {nextStatus.label}
            </ActionButton>
          </form>
        ) : null}
        {servicio.status === 2 ? (
          <Link
            className="flex h-9 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-on-primary"
            href={`/dashboard/servicios/${servicio.id}/entrega`}
          >
            Entregar →
          </Link>
        ) : null}
      </div>

      {/* Vehículo */}
      <SectionHeader>Vehículo</SectionHeader>
      <div className="divide-y divide-outline-variant">
        <InfoRow label="Placa">
          <span className="rounded border border-outline-variant px-1.5 py-0.5 font-mono text-[11px] font-medium text-on-surface-variant">
            {servicio.vehiculo?.placa ?? "—"}
          </span>
        </InfoRow>
        <InfoRow label="Marca / Modelo">
          {[servicio.vehiculo?.marca, servicio.vehiculo?.modelo]
            .filter(Boolean)
            .join(" ") || "Sin datos"}
        </InfoRow>
        {servicio.vehiculo?.color ? (
          <InfoRow label="Color">{servicio.vehiculo.color}</InfoRow>
        ) : null}
        {servicio.vehiculo?.anio ? (
          <InfoRow label="Año">{servicio.vehiculo.anio}</InfoRow>
        ) : null}
      </div>

      {/* Cliente */}
      {servicio.vehiculo?.cliente ? (
        <>
          <SectionHeader>Cliente</SectionHeader>
          <div className="divide-y divide-outline-variant">
            <InfoRow label="Nombre">
              {servicio.vehiculo.cliente.nombre ?? "Sin nombre"}
            </InfoRow>
            {servicio.vehiculo.cliente.telefono ? (
              <InfoRow label="Teléfono">
                <a
                  href={`tel:${servicio.vehiculo.cliente.telefono}`}
                  className="text-primary"
                >
                  {servicio.vehiculo.cliente.telefono}
                </a>
              </InfoRow>
            ) : null}
          </div>
        </>
      ) : null}

      {/* Fechas */}
      <SectionHeader>Fechas</SectionHeader>
      <div className="divide-y divide-outline-variant">
        <InfoRow label="Ingreso">{formatDate(servicio.fecha_inicio)}</InfoRow>
        {servicio.recibido_por?.nombre ? (
          <InfoRow label="Recibió">{servicio.recibido_por.nombre}</InfoRow>
        ) : null}
        {servicio.fecha_fin ? (
          <InfoRow label="Finalizado">{formatDate(servicio.fecha_fin)}</InfoRow>
        ) : null}
      </div>

      {/* Descripción */}
      {servicio.descripcion ? (
        <>
          <SectionHeader>Descripción</SectionHeader>
          <p className="px-4 py-3 text-sm leading-relaxed text-on-surface">
            {servicio.descripcion}
          </p>
        </>
      ) : null}

      {/* Fotos de ingreso */}
      {serviceImageUrls.some(Boolean) ? (
        <>
          <SectionHeader>Fotografías de ingreso</SectionHeader>
          <div className="px-4 py-3">
            <ImageViewer
              altPrefix="Imagen de ingreso"
              columnsClassName="grid-cols-2"
              images={serviceImageUrls.filter(Boolean) as string[]}
            />
          </div>
        </>
      ) : null}

      {/* Tracking link */}
      {servicio.tracking_token ? (
        <div className="px-4 py-3">
          <CopyLinkButton token={servicio.tracking_token} />
        </div>
      ) : null}
    </div>
  );

  // ── Tab: Bitácora ─────────────────────────────────────────────────
  const bitacoraContent = (
    <div>
      {bitacoras.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
          <p className="font-medium text-on-surface">Sin notas aún.</p>
          <p className="mt-1 text-xs">Agrega la primera nota con el formulario de abajo.</p>
        </div>
      ) : (
        <div className="relative px-4 py-5">
          {/* vertical timeline line */}
          <div
            aria-hidden
            className="absolute left-[2.65rem] top-5 w-px bg-outline-variant"
            style={{ bottom: "3rem" }}
          />

          {bitacoras.map((entry, idx) => {
            const imgs = bitacoraImageUrls[idx].filter(Boolean) as string[];
            const isOwn = staff?.id === entry.autor?.id;
            const initials = entry.autor?.nombre?.charAt(0).toUpperCase() ?? "?";

            return (
              <div key={entry.id} className="relative mb-6 flex gap-3">
                {/* avatar */}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container">
                  <span className="text-xs font-semibold text-on-surface">
                    {initials}
                  </span>
                </div>

                <div className="flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm text-on-surface-variant">
                      <span className="font-medium text-on-surface">
                        {entry.autor?.nombre ?? "Desconocido"}
                      </span>{" "}
                      ha añadido una nota
                    </p>
                    <p className="shrink-0 text-xs text-on-surface-variant">
                      {formatDate(entry.fecha)}
                    </p>
                  </div>

                  <div className="mt-2 rounded-lg bg-surface-container-low p-3">
                    <p className="text-sm leading-relaxed text-on-surface">
                      {entry.descripcion}
                    </p>
                    {imgs.length > 0 ? (
                      <ImageViewer
                        altPrefix="Foto de bitácora"
                        className="mt-3"
                        columnsClassName="grid-cols-2"
                        images={imgs}
                      />
                    ) : null}
                  </div>

                  {isOwn ? (
                    <form action={deleteBitacoraAction} className="mt-1.5">
                      <input name="id" type="hidden" value={entry.id} />
                      <input name="servicioId" type="hidden" value={servicio.id} />
                      <ConfirmSubmitButton
                        className="rounded px-2 py-1 text-xs font-medium text-error transition hover:bg-error-container"
                        confirmMessage="Se eliminará esta nota. ¿Deseas continuar?"
                      >
                        Eliminar nota
                      </ConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* End of log marker */}
          <div className="relative flex items-center gap-3">
            <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center">
              <Flag className="size-3.5 text-on-surface-variant" />
            </div>
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">
              Fin de bitácora
            </p>
          </div>
        </div>
      )}

      {/* Add note form */}
      {servicio.status !== 3 ? (
        <>
          <SectionHeader>Agregar nota</SectionHeader>
          <form action={createBitacoraAction} className="space-y-3 px-4 py-4">
            <input name="servicioId" type="hidden" value={servicio.id} />
            <textarea
              className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
              minLength={5}
              name="descripcion"
              placeholder="Describe el trabajo realizado…"
              required
              rows={4}
            />
            <label className="block text-xs font-medium text-on-surface-variant">
              Fotografías (máx. 4 · JPG, PNG o WebP)
              <input
                accept="image/*"
                className="mt-1.5 w-full rounded-lg border border-dashed border-outline-variant bg-surface-container-low p-3 text-sm text-on-surface-variant file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-on-primary"
                multiple
                name="imagenes"
                type="file"
              />
            </label>
            <ActionButton className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:opacity-60">
              Agregar nota
            </ActionButton>
          </form>
        </>
      ) : null}
    </div>
  );

  return (
    <>
      <PageHeader
        title={`Servicio #${servicio.id}`}
        backHref="/dashboard/servicios"
      />

      {/* Service summary strip */}
      <div className="border-b border-outline-variant px-4 pb-3 pt-2">
        {servicio.descripcion ? (
          <p className="mb-2 text-sm text-on-surface-variant line-clamp-2">
            {servicio.descripcion}
          </p>
        ) : null}
        <ServicioStatusBadge status={servicio.status} />
      </div>

      {error ? (
        <div className="mx-4 mt-3 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className="mx-4 mt-3 rounded-lg px-4 py-3 text-sm"
          style={{ background: "#00573314", color: "#005a33" }}
        >
          {success}
        </div>
      ) : null}

      <ServiceDetailTabs
        bitacoraCount={bitacoras.length}
        infoContent={infoContent}
        bitacoraContent={bitacoraContent}
      />
    </>
  );
}
