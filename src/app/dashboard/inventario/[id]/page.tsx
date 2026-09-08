import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowUpFromLine,
  ChevronRight,
  History,
  Package2,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  createRefaccionMovimientoAction,
  deleteRefaccionAction,
  updateRefaccionAction,
} from "@/actions/inventario";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/ui/action-button";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  error?: string;
  success?: string;
}>;

type RefaccionDetail = {
  id: number;
  nombre: string;
  marca: string | null;
  uuid: string;
  precio: number;
  stock: number;
  status: number | boolean;
};

type KardexRow = {
  id: number;
  tipo: 1 | -1;
  inicial: number;
  cantidad: number;
  final: number;
  fecha: string;
  notas: string | null;
  usuario: { nombre: string | null } | null;
};

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary";

const KARDEX_PREVIEW_SIZE = 5;

function getStatusMeta(status: number | boolean) {
  if (status === 1 || status === true) {
    return {
      label: "Activa",
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  return {
    label: "Inactiva",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function InventarioDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const feedback = await searchParams;
  const refaccionId = Number(id);
  const error = feedback.error?.trim() ?? "";
  const success = feedback.success?.trim() ?? "";

  if (!Number.isFinite(refaccionId) || refaccionId <= 0) {
    notFound();
  }

  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerComponentClient();
  const [{ data: refaccion }, { data: kardex }] = await Promise.all([
    supabase
      .from("refaccion_con_stock")
      .select("id, nombre, marca, uuid, precio, stock, status")
      .eq("id", refaccionId)
      .maybeSingle<RefaccionDetail>(),
    supabase
      .from("refaccion_kardex")
      .select("id, tipo, inicial, cantidad, final, fecha, notas, usuario:usuarios(nombre)")
      .eq("refaccion_id", refaccionId)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false })
      .range(0, KARDEX_PREVIEW_SIZE - 1)
      .returns<KardexRow[]>(),
  ]);

  if (!refaccion) {
    notFound();
  }

  const statusMeta = getStatusMeta(refaccion.status);
  const movimientoList = kardex ?? [];

  return (
    <>
      <PageHeader title="Detalle de refacción" backHref="/dashboard/inventario" />

      <section className="space-y-4 px-4 py-4">
        {error ? (
          <div className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{ background: "#00573314", color: "#005a33" }}
          >
            {success}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_1fr]">
          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                  Ficha de refacción
                </p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface">Editar datos</h2>
              </div>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>

            <form action={updateRefaccionAction} className="grid gap-4 px-4 py-4">
              <input name="redirectTo" type="hidden" value={`/dashboard/inventario/${refaccion.id}`} />
              <input name="id" type="hidden" value={refaccion.id} />

              <label className="block text-sm font-medium text-on-surface">
                Nombre
                <input
                  className={inputClass}
                  defaultValue={refaccion.nombre}
                  name="nombre"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                Marca
                <input
                  className={inputClass}
                  defaultValue={refaccion.marca ?? ""}
                  name="marca"
                  placeholder="Sin marca"
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                UUID
                <input
                  className={`${inputClass} font-mono`}
                  defaultValue={refaccion.uuid}
                  name="uuid"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                Precio
                <input
                  className={inputClass}
                  defaultValue={refaccion.precio}
                  min={0}
                  name="precio"
                  required
                  step="0.01"
                  type="number"
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                Status
                <select
                  className={inputClass}
                  defaultValue={refaccion.status === 1 || refaccion.status === true ? "1" : "0"}
                  name="status"
                >
                  <option value="1">Activa</option>
                  <option value="0">Inactiva</option>
                </select>
              </label>

              <div className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                  Stock actual
                </p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-semibold text-on-surface">{refaccion.stock}</p>
                    <p className="text-xs text-on-surface-variant">
                      El stock se con cada entrada y salida registradas, no desde este campo.
                    </p>
                  </div>
                  <Package2 className="size-9 text-primary" />
                </div>
              </div>

              <ActionButton className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:opacity-60">
                <Pencil className="size-4" />
                Guardar cambios
              </ActionButton>
            </form>

            <div className="border-t border-outline-variant px-4 py-4">
              <p className="text-sm font-semibold text-on-surface">Zona de peligro</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Eliminar la refacción también borra su historial de kardex asociado.
              </p>
              <form action={deleteRefaccionAction} className="mt-4">
                <input name="redirectTo" type="hidden" value="/dashboard/inventario" />
                <input name="id" type="hidden" value={refaccion.id} />
                <ConfirmSubmitButton
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-error px-4 text-sm font-medium text-error transition"
                  confirmMessage="Se eliminará la refaccion y su kardex. ¿Deseas continuar?"
                >
                  <Trash2 className="size-4" />
                  Eliminar refacción
                </ConfirmSubmitButton>
              </form>
            </div>
          </section>

          <section className="space-y-4">
            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                    Kardex
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-on-surface">
                    Movimientos de stock
                  </h2>
                </div>
                <History className="size-5 text-on-surface-variant" />
              </div>

              <div className="p-4">
                <form
                  action={createRefaccionMovimientoAction}
                  className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4"
                >
                  <input name="redirectTo" type="hidden" value={`/dashboard/inventario/${refaccion.id}`} />
                  <input name="id" type="hidden" value={refaccion.id} />
                  <input name="tipo" type="hidden" value="entrada" />

                  <div className="mb-4 flex items-center gap-2 text-emerald-700">
                    <ArrowUpFromLine className="size-4" />
                    <p className="text-sm font-semibold">Registrar entrada</p>
                  </div>

                  <label className="block text-sm font-medium text-on-surface">
                    Cantidad
                    <input className={inputClass} min={1} name="cantidad" required type="number" />
                  </label>

                  <label className="mt-4 block text-sm font-medium text-on-surface">
                    Notas
                    <textarea
                      className={`${inputClass} h-24 resize-none py-2`}
                      maxLength={500}
                      name="notas"
                      placeholder="Ej. compra a proveedor, folio de factura, etc."
                    />
                  </label>

                  <ActionButton className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition disabled:opacity-60">
                    <ArrowUpFromLine className="size-4" />
                    Guardar entrada
                  </ActionButton>
                </form>
              </div>
            </div>

            <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                    Historial
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-on-surface">Últimos movimientos</h2>
                </div>
                <Link
                  className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary"
                  href={`/dashboard/inventario/${refaccion.id}/kardex`}
                >
                  Ver todo
                  <ChevronRight className="size-4" />
                </Link>
              </div>

              {movimientoList.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-on-surface-variant">
                  Aún no hay movimientos registrados para esta refacción.
                </div>
              ) : (
                <div className="divide-y divide-outline-variant">
                  {movimientoList.map((movimiento) => {
                    const isEntrada = Number(movimiento.tipo) === 1;

                    return (
                      <div key={movimiento.id} className="px-4 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p
                              className={`text-sm font-semibold ${
                                isEntrada ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {isEntrada ? "Entrada" : "Salida"} de {movimiento.cantidad}
                            </p>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              {formatDateTime(movimiento.fecha)}
                              {movimiento.usuario?.nombre ? ` · ${movimiento.usuario.nombre}` : ""}
                            </p>
                            {movimiento.notas ? (
                              <p className="mt-1 text-xs text-on-surface-variant">{movimiento.notas}</p>
                            ) : null}
                          </div>
                          <div className="text-right text-xs text-on-surface-variant">
                            <p>Antes: {movimiento.inicial}</p>
                            <p>Ahora: {movimiento.final}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {movimientoList.length > 0 ? (
                <Link
                  className="flex items-center justify-center gap-1 border-t border-outline-variant px-4 py-3 text-sm font-medium text-primary"
                  href={`/dashboard/inventario/${refaccion.id}/kardex`}
                >
                  Ver historial completo
                  <ChevronRight className="size-4" />
                </Link>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}