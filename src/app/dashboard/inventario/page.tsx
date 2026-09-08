import Link from "next/link";
import { randomUUID } from "crypto";
import { ChevronRight, Download, FileSpreadsheet, Package2, Plus, Upload } from "lucide-react";

import { createRefaccionAction, importRefaccionesAction } from "@/actions/inventario";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { ActionButton } from "@/components/ui/action-button";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  page?: string;
  error?: string;
  success?: string;
}>;

type RefaccionRow = {
  id: number;
  nombre: string;
  marca: string | null;
  uuid: string;
  precio: number;
  stock: number;
  status: number | boolean;
};

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

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const error = params.error?.trim() ?? "";
  const success = params.success?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = await createSupabaseServerComponentClient();
  const defaultUuid = randomUUID();

  const { data, count } = await supabase
    .from("refaccion_con_stock")
    .select("id, nombre, marca, uuid, precio, stock, status", { count: "exact" })
    .order("nombre", { ascending: true, nullsFirst: false })
    .range(from, to)
    .returns<RefaccionRow[]>();

  const refacciones = data ?? [];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    if (nextPage > 1) qs.set("page", String(nextPage));
    const search = qs.toString();
    return search ? `/dashboard/inventario?${search}` : "/dashboard/inventario";
  };

  return (
    <>
      <PageHeader title="Inventario" />

      <section className="space-y-4 px-4 py-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                  Alta de refacciones
                </p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface">
                  Registrar pieza nueva
                </h2>
              </div>
              <div className="rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 text-xs text-on-surface-variant">
                {total} refaccion{total === 1 ? "" : "es"}
              </div>
            </div>

            {error ? (
              <div className="mx-4 mt-4 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
                {error}
              </div>
            ) : null}

            {success ? (
              <div
                className="mx-4 mt-4 rounded-lg px-4 py-3 text-sm"
                style={{ background: "#00573314", color: "#005a33" }}
              >
                {success}
              </div>
            ) : null}

            <form action={createRefaccionAction} className="grid gap-4 px-4 py-4 md:grid-cols-2">
              <input name="redirectTo" type="hidden" value="/dashboard/inventario" />

              <label className="block text-sm font-medium text-on-surface">
                Nombre
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface px-4 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  name="nombre"
                  placeholder="Pastillas de freno"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                Marca
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface px-4 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  name="marca"
                  placeholder="Brembo"
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                UUID
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface px-4 font-mono text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue={defaultUuid}
                  name="uuid"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                Precio
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface px-4 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  min={0}
                  name="precio"
                  placeholder="0.00"
                  required
                  step="0.01"
                  type="number"
                />
              </label>

              <label className="block text-sm font-medium text-on-surface">
                Stock inicial
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-surface px-4 text-sm outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue="0"
                  min={0}
                  name="stock"
                  required
                  type="number"
                />
              </label>

              <div className="md:col-span-2">
                <ActionButton className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition active:scale-[0.99]">
                  <Plus className="size-4" />
                  Crear refaccion
                </ActionButton>
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                  Carga masiva
                </p>
                <h2 className="mt-1 text-lg font-semibold text-on-surface">
                  Importar refacciones desde Excel
                </h2>
              </div>
              <FileSpreadsheet className="size-6 text-on-surface-variant" />
            </div>

            <div className="px-4 py-4">
              <a
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-outline-variant px-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
                href="/api/inventario/plantilla"
              >
                <Download className="size-4" />
                Descargar plantilla
              </a>

              <form
                action={importRefaccionesAction}
                className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <input name="redirectTo" type="hidden" value="/dashboard/inventario" />
                <input
                  accept=".xlsx,.xls"
                  className="h-11 w-full flex-1 rounded-lg border border-outline-variant bg-surface px-3 text-sm text-on-surface outline-none transition file:mr-3 file:h-full file:rounded-md file:border-0 file:bg-surface-container-low file:px-3 file:text-sm file:font-medium file:text-on-surface focus:border-primary focus:ring-1 focus:ring-primary"
                  name="file"
                  required
                  type="file"
                />
                <ActionButton className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition active:scale-[0.99]">
                  <Upload className="size-4" />
                  Importar
                </ActionButton>
              </form>

              <p className="mt-3 text-xs text-on-surface-variant">
                Usa la plantilla para llenar nombre, marca, UUID, precio y stock inicial. Se rechazan
                filas con UUID o nombre repetidos, o que ya existan en el inventario.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm lg:col-span-2">
            <div className="border-b border-outline-variant bg-surface-container-low px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
                Inventario
              </p>
              <h2 className="mt-1 text-lg font-semibold text-on-surface">
                Refacciones registradas
              </h2>
            </div>

            {refacciones.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-on-surface-variant">
                <Package2 className="mx-auto mb-3 size-8 text-on-surface-variant" />
                <p className="font-medium text-on-surface">No hay refacciones registradas.</p>
                <p className="mt-1 text-xs">Agrega la primera refacción desde el formulario de arriba.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-50 w-full border-separate border-spacing-0 text-left">
                  <thead className="bg-surface-container-low text-xs uppercase tracking-[0.18em] text-on-surface-variant">
                    <tr>
                      <th className="border-b border-outline-variant px-4 py-3 font-semibold">Nombre</th>
                      <th className="border-b border-outline-variant px-4 py-3 font-semibold">Marca</th>
                      <th className="border-b border-outline-variant px-4 py-3 font-semibold">UUID</th>
                      <th className="border-b border-outline-variant px-4 py-3 font-semibold">Stock</th>
                      <th className="border-b border-outline-variant px-4 py-3 font-semibold">Status</th>
                      <th className="border-b border-outline-variant px-4 py-3 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refacciones.map((refaccion) => {
                      const statusMeta = getStatusMeta(refaccion.status);

                      return (
                        <tr key={refaccion.id} className="align-top hover:bg-surface-container-low">
                          <td className="border-b border-outline-variant px-4 py-4">
                            <p className="text-sm font-medium text-on-surface">{refaccion.nombre}</p>
                          </td>
                          <td className="border-b border-outline-variant px-4 py-4 text-sm text-on-surface-variant">
                            {refaccion.marca ?? "Sin marca"}
                          </td>
                          <td className="border-b border-outline-variant px-4 py-4 font-mono text-xs text-on-surface-variant">
                            {refaccion.uuid}
                          </td>
                          <td className="border-b border-outline-variant px-4 py-4">
                            <span className="inline-flex min-w-16 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-sm font-semibold text-on-surface">
                              {refaccion.stock}
                            </span>
                          </td>
                          <td className="border-b border-outline-variant px-4 py-4">
                            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta.className}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="border-b border-outline-variant px-4 py-4">
                            <Link
                              href={`/dashboard/inventario/${refaccion.id}`}
                              className="inline-flex h-9 items-center gap-1 rounded-lg border border-outline-variant px-3 text-sm font-medium text-on-surface transition hover:bg-surface-container-low"
                            >
                              Ver detalle
                              <ChevronRight className="size-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-4 pb-4 pt-3">
              <Pagination buildHref={buildHref} page={page} pageCount={pageCount} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}