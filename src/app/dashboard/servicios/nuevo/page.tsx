import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Camera, Car, FileText } from "lucide-react";

import { createServicioAction } from "@/actions/servicios";
import { NuevoServicioStep1Form } from "@/components/dashboard/nuevo-servicio-step1";
import { ActionButton } from "@/components/ui/action-button";
import { DescripcionField } from "@/components/dashboard/descripcion-field";
import { PageHeader } from "@/components/dashboard/page-header";
import { ServiceWizardStepper } from "@/components/dashboard/service-wizard-stepper";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
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
  const canAddServicios = await currentUserHasPermission(PERMISOS.SERVICIOS_ADD);

  if (!canAddServicios) {
    redirect("/dashboard/servicios?error=No+tienes+permiso+para+crear+servicios.");
  }

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

    const modeloLabel = [vehiculo.marca, vehiculo.modelo, vehiculo.anio]
      .filter(Boolean)
      .join(" ") || "Sin datos";

    const clienteInicial = vehiculo.cliente?.nombre?.charAt(0).toUpperCase() ?? "?";

    return (
      <>
        <PageHeader title="Nuevo servicio" backHref="/dashboard/servicios/nuevo" />

        <form action={createServicioAction}>
          <input name="vehiculoId" type="hidden" value={vehiculo.id} />

          <div className="mx-auto max-w-lg lg:max-w-2xl space-y-4 px-4 lg:px-0 pb-28 pt-3">
            <ServiceWizardStepper currentStep={2} />

            {error ? (
              <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
                {error}
              </div>
            ) : null}

            {/* ── Vehículo seleccionado ───────────────────────── */}
            <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-3">
                <Car className="size-4 text-primary" />
                <span className="text-sm font-semibold text-on-surface">
                  Vehículo Seleccionado
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 border-b border-outline-variant pb-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Placa
                    </p>
                    <p className="text-2xl font-bold tracking-wide text-on-surface">
                      {vehiculo.placa}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                      Modelo
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-on-surface">
                      {modeloLabel}
                    </p>
                  </div>
                </div>

                {vehiculo.cliente ? (
                  <div className="flex items-center gap-3 pt-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-sm font-bold text-on-surface">
                      {clienteInicial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        Cliente
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        {vehiculo.cliente.nombre ?? "Sin nombre"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* ── Descripción del problema ────────────────────── */}
            <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center gap-2 border-b border-outline-variant px-4 py-3">
                <FileText className="size-4 text-primary" />
                <span className="text-sm font-semibold text-on-surface">
                  Descripción del problema
                </span>
              </div>
              <div className="p-4">
                <DescripcionField />
              </div>
            </div>

            {/* ── Fotografías de ingreso ──────────────────────── */}
            <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
              <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
                <div className="flex items-center gap-2">
                  <Camera className="size-4 text-primary" />
                  <span className="text-sm font-semibold text-on-surface">
                    Fotografías de Ingreso
                  </span>
                </div>
                <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-xs text-on-surface-variant">
                  Opcional
                </span>
              </div>
              <div className="p-4">
                <label
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant px-4 py-8 text-center transition hover:border-primary"
                  htmlFor="fotos-input"
                >
                  <Camera className="size-6 text-on-surface-variant" />
                  <span className="text-sm font-medium text-on-surface-variant">Añadir</span>
                </label>
                <input
                  accept="image/*"
                  className="hidden"
                  id="fotos-input"
                  multiple
                  name="imagenes"
                  type="file"
                />
                <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                  Agregue fotos del estado general del vehículo y daños específicos
                  reportados antes de iniciar el trabajo.
                </p>
              </div>
            </div>
          </div>

          {/* ── Footer fijo — arriba de bottom-nav en mobile, al fondo en desktop ── */}
          <div className="fixed bottom-16 left-0 right-0 lg:bottom-0 lg:left-60 z-40 border-t border-outline-variant bg-surface px-4 py-3">
            <div className="mx-auto flex max-w-lg lg:max-w-2xl gap-3">
              <Link
                className="flex h-11 flex-1 items-center justify-center rounded-lg border border-outline-variant text-sm font-medium text-on-surface transition hover:bg-surface-container"
                href="/dashboard/servicios/nuevo"
              >
                Cancelar
              </Link>
              <ActionButton className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:opacity-60">
                Continuar →
              </ActionButton>
            </div>
          </div>
        </form>
      </>
    );
  }

  // ── Step 1 ──────────────────────────────────────────────────
  return (
    <>
      <PageHeader title="Nuevo servicio" backHref="/dashboard/servicios" />

      <div className="mx-auto max-w-lg lg:max-w-2xl px-4 lg:px-0 pt-3">
        <ServiceWizardStepper currentStep={1} />
      </div>

      <div className="mx-auto max-w-lg lg:max-w-2xl px-4 lg:px-0 pb-6">
        <NuevoServicioStep1Form error={error} />
      </div>
    </>
  );
}
