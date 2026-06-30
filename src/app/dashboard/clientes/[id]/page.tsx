import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Car, Pencil, Plus, Trash2, Wrench } from "lucide-react";

import { deleteClienteAction, updateClienteAction } from "@/actions/clientes";
import {
  createVehiculoAction,
  deleteVehiculoAction,
  updateVehiculoAction,
} from "@/actions/vehiculos";
import { ActionButton } from "@/components/ui/action-button";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type ClienteDetail = {
  id: number;
  nombre: string | null;
  correo: string | null;
  telefono: string | null;
};

type VehiculoRow = {
  id: number;
  cliente_id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary";

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
    addVehicle?: string;
  }>;
}) {
  const { id } = await params;
  const feedback = await searchParams;
  const clienteId = Number(id);
  const error = feedback.error?.trim() ?? "";
  const success = feedback.success?.trim() ?? "";
  const requestedAddVehicle = feedback.addVehicle === "1";

  if (!Number.isFinite(clienteId) || clienteId <= 0) notFound();

  const [canEditCliente, canAddVehiculo, canEditVehiculo, canDeleteVehiculo, canDeleteCliente] = await Promise.all([
    currentUserHasPermission(PERMISOS.CLIENTES_EDIT),
    currentUserHasPermission(PERMISOS.CLIENTES_ADD_VEHICULO),
    currentUserHasPermission(PERMISOS.CLIENTES_EDIT_VEHICULO),
    currentUserHasPermission(PERMISOS.CLIENTES_DEL_VEHICULO),
    currentUserHasPermission(PERMISOS.CLIENTES_DEL),
  ]);

  if (requestedAddVehicle && !canAddVehiculo) {
    redirect(
      `/dashboard/clientes/${clienteId}?error=No+tienes+permiso+para+agregar+vehiculos.`,
    );
  }

  const showAddVehicle = requestedAddVehicle && canAddVehiculo;

  const supabase = await createSupabaseServerComponentClient();
  const [{ data: cliente }, { data: vehiculos }] = await Promise.all([
    supabase
      .from("clientes")
      .select("id, nombre, correo, telefono")
      .eq("id", clienteId)
      .maybeSingle<ClienteDetail>(),
    supabase
      .from("vehiculos")
      .select("id, cliente_id, placa, marca, modelo, color, anio")
      .eq("cliente_id", clienteId)
      .order("placa")
      .returns<VehiculoRow[]>(),
  ]);

  if (!cliente) notFound();

  const vehicleList = vehiculos ?? [];

  return (
    <>
      <PageHeader
        title="Detalle del Cliente"
        backHref="/dashboard/clientes"
        action={canEditCliente ? (
          <Link
            href="?edit=1"
            className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface transition-colors active:bg-surface-container"
            aria-label="Editar"
          >
            <Pencil className="size-4" />
          </Link>
        ) : null}
      />

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

      {/* ── Ficha general ── */}
      <section>
        <div className="bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Ficha general
        </div>

        <form action={canEditCliente ? updateClienteAction : undefined}>
          <input
            name="redirectTo"
            type="hidden"
            value={`/dashboard/clientes/${clienteId}?success=Cliente+actualizado`}
          />
          <input name="id" type="hidden" value={clienteId} />

          <div className="divide-y divide-outline-variant">
            <div className="px-4 py-3">
              <label className="block text-xs text-on-surface-variant">Nombre</label>
              <input
                className={inputClass}
                defaultValue={cliente.nombre ?? ""}
                name="nombre"
                required
                disabled={!canEditCliente}
              />
            </div>
            <div className="px-4 py-3">
              <label className="block text-xs text-on-surface-variant">Correo</label>
              <input
                className={inputClass}
                defaultValue={cliente.correo ?? ""}
                name="correo"
                type="email"
                disabled={!canEditCliente}
              />
            </div>
            <div className="px-4 py-3">
              <label className="block text-xs text-on-surface-variant">Teléfono</label>
              <input
                className={inputClass}
                defaultValue={cliente.telefono ?? ""}
                name="telefono"
                disabled={!canEditCliente}
              />
            </div>
            {canEditCliente ? (
              <div className="px-4 py-3">
                <ActionButton className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:opacity-60">
                  Guardar cambios
                </ActionButton>
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-on-surface-variant">
                No tienes permiso para editar clientes.
              </div>
            )}
          </div>
        </form>
      </section>

      {/* ── Vehículos Asociados ── */}
      <section className="mt-4">
        <div className="flex items-center justify-between bg-surface-container-low px-4 py-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
            Vehículos Asociados
          </span>
          {canAddVehiculo ? (
            <Link
              href={
                showAddVehicle
                  ? `/dashboard/clientes/${clienteId}`
                  : `?addVehicle=1`
              }
              className="flex items-center gap-1 text-xs font-medium text-primary"
            >
              {showAddVehicle ? (
                "Cancelar"
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Añadir Vehículo
                </>
              )}
            </Link>
          ) : null}
        </div>

        {showAddVehicle ? (
          <form
            action={createVehiculoAction}
            className="space-y-3 border-b border-outline-variant bg-surface-container-low px-4 pb-4 pt-3"
          >
            <input
              name="redirectTo"
              type="hidden"
              value={`/dashboard/clientes/${clienteId}`}
            />
            <input name="clienteId" type="hidden" value={clienteId} />

            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { label: "Placa", name: "placa", required: true },
                  { label: "Marca", name: "marca" },
                  { label: "Modelo", name: "modelo" },
                  { label: "Color", name: "color" },
                ] as const
              ).map((f) => (
                <label key={f.name} className="block text-xs font-medium text-on-surface">
                  {f.label}
                  <input
                    className={inputClass}
                    name={f.name}
                    required={"required" in f ? f.required : false}
                  />
                </label>
              ))}
              <label className="block text-xs font-medium text-on-surface">
                Año
                <input
                  className={inputClass}
                  max={new Date().getFullYear()}
                  min={1900}
                  name="anio"
                  type="number"
                />
              </label>
            </div>

            <ActionButton className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:opacity-60">
              Agregar vehículo
            </ActionButton>
          </form>
        ) : null}

        <div className="divide-y divide-outline-variant">
          {vehicleList.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
              No hay vehículos registrados.
            </div>
          ) : (
            vehicleList.map((v) => (
              <div key={v.id} className="px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container">
                    <Car className="size-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-on-surface">
                        {[v.marca, v.modelo].filter(Boolean).join(" ") ||
                          "Sin datos"}
                      </p>
                      <span className="ml-auto shrink-0 rounded border border-outline-variant px-1.5 py-0.5 font-mono text-[11px] font-medium text-on-surface-variant">
                        {v.placa}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-on-surface-variant">
                      {[v.anio, v.color].filter(Boolean).join(" · ") || "Sin datos adicionales"}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex gap-2 border-t border-outline-variant pt-3">
                  <details className="flex-1">
                    <summary className="flex h-9 cursor-pointer list-none select-none items-center justify-center rounded-lg border border-outline-variant text-sm font-medium text-on-surface">
                      Ver detalles
                    </summary>

                    <div className="mt-3 space-y-3 rounded-lg bg-surface-container-low p-3">
                      {canEditVehiculo ? (
                        <form action={updateVehiculoAction} className="space-y-3">
                          <input
                            name="redirectTo"
                            type="hidden"
                            value={`/dashboard/clientes/${clienteId}`}
                          />
                          <input name="id" type="hidden" value={v.id} />
                          <input name="clienteId" type="hidden" value={clienteId} />

                          <div className="grid grid-cols-2 gap-3">
                            {(
                              [
                                { label: "Placa", name: "placa", value: v.placa, required: true },
                                { label: "Marca", name: "marca", value: v.marca },
                                { label: "Modelo", name: "modelo", value: v.modelo },
                                { label: "Color", name: "color", value: v.color },
                              ] as const
                            ).map((f) => (
                              <label key={f.name} className="block text-xs font-medium text-on-surface">
                                {f.label}
                                <input
                                  className={inputClass}
                                  defaultValue={f.value ?? ""}
                                  name={f.name}
                                  required={"required" in f ? f.required : false}
                                />
                              </label>
                            ))}
                            <label className="block text-xs font-medium text-on-surface">
                              Año
                              <input
                                className={inputClass}
                                defaultValue={v.anio ?? ""}
                                max={new Date().getFullYear()}
                                min={1900}
                                name="anio"
                                type="number"
                              />
                            </label>
                          </div>

                          <ActionButton className="h-10 w-full rounded-lg bg-primary text-sm font-semibold text-on-primary disabled:opacity-60">
                            Guardar vehículo
                          </ActionButton>
                        </form>
                      ) : null}

                      {canDeleteVehiculo ? (
                        <form action={deleteVehiculoAction}>
                          <input
                            name="redirectTo"
                            type="hidden"
                            value={`/dashboard/clientes/${clienteId}`}
                          />
                          <input name="id" type="hidden" value={v.id} />
                          <input name="clienteId" type="hidden" value={clienteId} />
                          <ConfirmSubmitButton
                            className="h-10 w-full rounded-lg border border-error text-sm font-medium text-error transition"
                            confirmMessage="Se eliminará este vehículo y sus servicios. ¿Deseas continuar?"
                          >
                            Eliminar vehículo
                          </ConfirmSubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </details>

                  <Link
                    href={`/dashboard/servicios/nuevo?step=2&vehiculoId=${v.id}`}
                    className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-sm font-medium text-on-primary"
                  >
                    <Wrench className="size-3.5" />
                    Crear servicio
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ── Zona de peligro ── */}
      {canDeleteCliente ? (
        <section className="px-4 pb-8 pt-6">
          <div className="rounded-lg border border-error px-4 py-4">
            <p className="text-sm font-semibold text-error">Zona de peligro</p>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Eliminar permanentemente a este cliente y todos sus datos asociados.
              Esta acción no se puede deshacer.
            </p>
            <form action={deleteClienteAction} className="mt-4">
              <input name="redirectTo" type="hidden" value="/dashboard/clientes" />
              <input name="id" type="hidden" value={clienteId} />
              <ConfirmSubmitButton
                className="flex h-10 items-center gap-2 rounded-lg border border-error px-4 text-sm font-medium text-error transition"
                confirmMessage="Se eliminará el cliente y todos sus vehículos. ¿Deseas continuar?"
              >
                <Trash2 className="size-4" />
                Eliminar cliente
              </ConfirmSubmitButton>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
