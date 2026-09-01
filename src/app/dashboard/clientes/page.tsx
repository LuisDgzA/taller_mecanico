import Link from "next/link";
import { ChevronRight, Plus, Search } from "lucide-react";

import { CreateClienteForm } from "@/components/dashboard/create-cliente-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { redirect } from "next/dist/client/components/navigation";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  q?: string;
  page?: string;
  new?: string;
  error?: string;
  success?: string;
}>;

type ClienteRow = {
  id: number;
  nombre: string | null;
  correo: string | null;
  telefono: string | null;
  vehiculos: Array<{ count: number }> | null;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [canViewClientes, canAddClientes] = await Promise.all([
    currentUserHasPermission(PERMISOS.CLIENTES_VER),
    currentUserHasPermission(PERMISOS.CLIENTES_ADD),
  ]);

  if (!canViewClientes) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedNew = params.new === "1";
  const showNew = requestedNew && canAddClientes;
  const error = params.error?.trim() ?? "";
  const success = params.success?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  if (requestedNew && !canAddClientes) {
    redirect("/dashboard/clientes?error=No+tienes+permiso+para+crear+clientes.");
  }

  const supabase = await createSupabaseServerComponentClient();

  let request = supabase
    .from("clientes")
    .select("id, nombre, correo, telefono, vehiculos(count)", { count: "exact" })
    .order("nombre", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (query) {
    request = request.or(
      `nombre.ilike.%${query}%,correo.ilike.%${query}%,telefono.ilike.%${query}%`,
    );
  }

  const { data, count } = await request.returns<ClienteRow[]>();
  const clientes = data ?? [];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const search = qs.toString();
    return search ? `/dashboard/clientes?${search}` : "/dashboard/clientes";
  };

  return (
    <>
      <PageHeader title="Clientes" />

      <div className="px-4 lg:px-8 pt-3 pb-2">
        <form action="/dashboard/clientes" method="get" className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
          <input
            className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
            defaultValue={query}
            name="q"
            placeholder="Buscar por nombre, correo o teléfono"
          />
        </form>
      </div>

      {error ? (
        <div className="mx-4 lg:mx-8 mb-2 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className="mx-4 lg:mx-8 mb-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: "#00573314", color: "#005a33" }}
        >
          {success}
        </div>
      ) : null}

      {showNew ? (
        <section className="border-b border-outline-variant bg-surface-container-low px-4 lg:px-8 pb-5 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-on-surface">Nuevo cliente</p>
            <Link
              href="/dashboard/clientes"
              className="text-xs text-on-surface-variant"
            >
              Cancelar
            </Link>
          </div>
          <CreateClienteForm />
        </section>
      ) : null}

      <p className="px-4 lg:px-8 pb-1 pt-3 text-xs text-on-surface-variant">
        {total} cliente{total === 1 ? "" : "s"}
        {query ? ` · "${query}"` : ""}
      </p>

      {clientes.length === 0 ? (
        <div className="px-4 lg:px-8 py-16 text-center text-sm text-on-surface-variant">
          <p className="font-medium text-on-surface">
            {query ? "Sin resultados para esta búsqueda." : "No hay clientes registrados."}
          </p>
          <p className="mt-1 text-xs">
            {query
              ? "Intenta otra búsqueda."
              : "Agrega el primer cliente con el botón +."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-outline-variant">
          {clientes.map((cliente) => {
            const vehicleCount = cliente.vehiculos?.[0]?.count ?? 0;

            return (
              <Link
                key={cliente.id}
                href={`/dashboard/clientes/${cliente.id}`}
                className="flex items-center gap-3 px-4 lg:px-8 py-3.5 transition-colors active:bg-surface-container-low hover:bg-surface-container-low"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-surface">
                    {cliente.nombre?.trim() || "Sin nombre"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-on-surface-variant">
                    {[
                      cliente.correo,
                      `${vehicleCount} vehículo${vehicleCount === 1 ? "" : "s"}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-on-surface-variant" />
              </Link>
            );
          })}
        </div>
      )}

      <div className="px-4 lg:px-8">
        <Pagination buildHref={buildHref} page={page} pageCount={pageCount} />
      </div>

      {!showNew && canAddClientes ? (
        <Link
          href="/dashboard/clientes?new=1"
          className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition active:scale-95"
          aria-label="Agregar cliente"
        >
          <Plus className="size-6 stroke-white" />
        </Link>
      ) : null}
    </>
  );
}
