import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ page?: string }>;

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

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function InventarioKardexPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const refaccionId = Number(id);

  if (!Number.isFinite(refaccionId) || refaccionId <= 0) {
    notFound();
  }

  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect("/dashboard");
  }

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createSupabaseServerComponentClient();
  const [{ data: refaccion }, { data, count }] = await Promise.all([
    supabase
      .from("refaccion_con_stock")
      .select("id, nombre")
      .eq("id", refaccionId)
      .maybeSingle<{ id: number; nombre: string }>(),
    supabase
      .from("refaccion_kardex")
      .select("id, tipo, inicial, cantidad, final, fecha, notas, usuario:usuarios(nombre)", {
        count: "exact",
      })
      .eq("refaccion_id", refaccionId)
      .order("fecha", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to)
      .returns<KardexRow[]>(),
  ]);

  if (!refaccion) {
    notFound();
  }

  const movimientoList = data ?? [];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    if (nextPage > 1) qs.set("page", String(nextPage));
    const search = qs.toString();
    const base = `/dashboard/inventario/${refaccionId}/kardex`;
    return search ? `${base}?${search}` : base;
  };

  return (
    <>
      <PageHeader
        backHref={`/dashboard/inventario/${refaccionId}`}
        title={`Historial · ${refaccion.nombre}`}
      />

      <section className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
              Entradas y salidas
            </p>
            <p className="text-xs text-on-surface-variant">
              {total} movimiento{total === 1 ? "" : "s"}
            </p>
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

          <div className="px-4">
            <Pagination buildHref={buildHref} page={page} pageCount={pageCount} />
          </div>
        </div>
      </section>
    </>
  );
}
