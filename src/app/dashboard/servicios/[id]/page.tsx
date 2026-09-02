import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, Camera, Car, FileText, Flag, Pencil } from "lucide-react";

import { createBitacoraAction, deleteBitacoraAction } from "@/actions/bitacoras";
import { updateServicioStatusAction } from "@/actions/servicios";
import { formatDate } from "@/lib/format-date";
import { ActionButton } from "@/components/ui/action-button";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { CopyLinkButton } from "@/components/dashboard/copy-link-button";
import { ImageViewer } from "@/components/dashboard/image-viewer";
import { NotaForm } from "@/components/dashboard/nota-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServiceDetailTabs } from "@/components/dashboard/service-detail-tabs";
import { ServicioStatusBadge } from "@/components/dashboard/servicio-status-badge";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
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
  const [staff, canAddNota, canDeleteNota, canEntregarVehiculo] = await Promise.all([
    getCurrentStaffProfile(),
    currentUserHasPermission(PERMISOS.SERVICIOS_ADD_NOTA),
    currentUserHasPermission(PERMISOS.SERVICIOS_DEL_NOTA),
    currentUserHasPermission(PERMISOS.SERVICIOS_ENTREGAR_V),
  ]);

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
    <div className="divide-y divide-outline-variant">
      {/* Status + acciones */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-4">
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
        {servicio.status === 2 && canEntregarVehiculo ? (
          <Link
            className="flex h-9 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-on-primary"
            href={`/dashboard/servicios/${servicio.id}/entrega`}
          >
            Entregar →
          </Link>
        ) : null}
      </div>

      {/* Vehículo + Cliente */}
      <div>
        <div className="flex items-center gap-2 px-4 py-3">
          <Car className="size-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface">Vehículo Seleccionado</span>
        </div>

        {/* Placa + Modelo */}
        <div className="grid grid-cols-2 gap-4 border-b border-outline-variant px-4 pb-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Placa
            </p>
            <p className="text-2xl font-bold tracking-wide text-on-surface">
              {servicio.vehiculo?.placa ?? "—"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Modelo
            </p>
            <p className="mt-0.5 text-sm font-semibold text-on-surface">
              {[servicio.vehiculo?.marca, servicio.vehiculo?.modelo, servicio.vehiculo?.anio]
                .filter(Boolean)
                .join(" ") || "Sin datos"}
            </p>
            {servicio.vehiculo?.color ? (
              <p className="text-xs text-on-surface-variant">{servicio.vehiculo.color}</p>
            ) : null}
          </div>
        </div>

        {/* Cliente */}
        {servicio.vehiculo?.cliente ? (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-sm font-bold text-on-surface">
              {servicio.vehiculo.cliente.nombre?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Cliente
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {servicio.vehiculo.cliente.nombre ?? "Sin nombre"}
              </p>
              {servicio.vehiculo.cliente.telefono ? (
                <a
                  className="text-xs text-primary"
                  href={`tel:${servicio.vehiculo.cliente.telefono}`}
                >
                  {servicio.vehiculo.cliente.telefono}
                </a>
              ) : null}
            </div>
            <Link
              className="shrink-0 text-on-surface-variant transition hover:text-primary"
              href={`/dashboard/clientes/${servicio.vehiculo.cliente.id}?back=/dashboard/servicios/${servicio.id}`}
            >
              <Pencil className="size-4" />
            </Link>
          </div>
        ) : null}
      </div>

      {/* Fechas */}
      <div>
        <div className="flex items-center gap-2 px-4 py-3">
          <Calendar className="size-4 text-primary" />
          <span className="text-sm font-semibold text-on-surface">Fechas</span>
        </div>
        <div className="divide-y divide-outline-variant">
          <div className="flex items-center justify-between px-4 py-2.5">
            <span className="text-xs text-on-surface-variant">Ingreso</span>
            <span className="text-sm font-medium text-on-surface">
              {formatDate(servicio.fecha_inicio)}
            </span>
          </div>
          {servicio.recibido_por?.nombre ? (
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-on-surface-variant">Recibió</span>
              <span className="text-sm font-medium text-on-surface">
                {servicio.recibido_por.nombre}
              </span>
            </div>
          ) : null}
          {servicio.fecha_fin ? (
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-xs text-on-surface-variant">Finalizado</span>
              <span className="text-sm font-medium text-on-surface">
                {formatDate(servicio.fecha_fin)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Descripción */}
      {servicio.descripcion ? (
        <div>
          <div className="flex items-center gap-2 px-4 py-3">
            <FileText className="size-4 text-primary" />
            <span className="text-sm font-semibold text-on-surface">Descripción del problema</span>
          </div>
          <p className="px-4 pb-4 text-sm leading-relaxed text-on-surface">
            {servicio.descripcion}
          </p>
        </div>
      ) : null}

      {/* Fotografías de ingreso */}
      {serviceImageUrls.some(Boolean) ? (
        <div>
          <div className="flex items-center gap-2 px-4 py-3">
            <Camera className="size-4 text-primary" />
            <span className="text-sm font-semibold text-on-surface">Fotografías de Ingreso</span>
          </div>
          <div className="px-4 pb-4">
            <ImageViewer
              altPrefix="Imagen de ingreso"
              columnsClassName="grid-cols-2"
              images={serviceImageUrls.filter(Boolean) as string[]}
            />
          </div>
        </div>
      ) : null}

      {/* Tracking link */}
      {servicio.tracking_token ? (
        <div className="px-4 py-4">
          <CopyLinkButton token={servicio.tracking_token} />
        </div>
      ) : null}
    </div>
  );

  // ── Tab: Bitácora ─────────────────────────────────────────────────
  const bitacoraContent = (
    <div className="divide-y divide-outline-variant">
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

                    {isOwn && canDeleteNota ? (
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
      </div>

      {/* Add note form */}
      {servicio.status !== 3 && canAddNota ? (
        <div>
          <SectionHeader>Agregar nota</SectionHeader>
          <NotaForm servicioId={servicio.id} action={createBitacoraAction} />
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <PageHeader
        title={`Servicio #${servicio.id}`}
        backHref="/dashboard/servicios"
      />

      {/* Summary strip — only on mobile (desktop shows description in the info column) */}
      <div className="border-b border-outline-variant px-4 pb-2 pt-2 lg:hidden">
        <p className="truncate text-xs text-on-surface-variant">
          {servicio.descripcion ?? "Sin descripción"}
        </p>
      </div>

      {error ? (
        <div className="mx-4 mt-3 lg:mx-8 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className="mx-4 mt-3 lg:mx-8 rounded-lg px-4 py-3 text-sm"
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
