import Link from "next/link";

import { createClienteAction, deleteClienteAction, updateClienteAction } from "@/actions/clientes";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { Pagination } from "@/components/dashboard/pagination";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  q?: string;
  page?: string;
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
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const error = params.error?.trim() ?? "";
  const success = params.success?.trim() ?? "";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
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
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
          F-04
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Clientes</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Gestiona la base de clientes, entra al detalle para ver sus vehículos
          y deja preparada la información para la captura de servicios.
        </p>
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

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Agregar cliente
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Registro rápido
            </h2>
          </div>

          <form action={createClienteAction} className="mt-5 space-y-4">
            <input name="redirectTo" type="hidden" value="/dashboard/clientes" />
            <label className="block text-sm font-medium text-slate-700">
              Nombre
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="nombre"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Correo
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="correo"
                type="email"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Teléfono
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="telefono"
              />
            </label>
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              El nombre sigue siendo opcional, pero conviene capturarlo para que la búsqueda funcione mejor.
            </p>
            <button
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Crear cliente
            </button>
          </form>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Base de clientes
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {total} cliente{total === 1 ? "" : "s"}
              </h2>
            </div>

            <form className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
              <input
                className="h-11 flex-1 rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                defaultValue={query}
                name="q"
                placeholder="Buscar por nombre, correo o telefono"
              />
              <button
                className="h-11 rounded-2xl border border-slate-300 px-4 text-sm font-medium transition hover:border-slate-950"
                type="submit"
              >
                Buscar
              </button>
            </form>
          </div>

          <div className="mt-6 space-y-4">
            {clientes.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                <p className="font-medium text-slate-700">
                  No hay clientes que coincidan con la búsqueda actual.
                </p>
                <p className="mt-2">
                  Ajusta el filtro o registra un cliente nuevo desde el panel lateral.
                </p>
              </div>
            ) : (
              clientes.map((cliente) => (
                <div
                  key={cliente.id}
                  className="rounded-3xl border border-slate-200 p-5"
                >
                  <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold tracking-tight text-slate-950">
                        {cliente.nombre?.trim() || "Cliente sin nombre"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Vehículos registrados: {cliente.vehiculos?.[0]?.count ?? 0}
                      </p>
                    </div>
                    <Link
                      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:border-slate-950"
                      href={`/dashboard/clientes/${cliente.id}`}
                    >
                      Ver detalle
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
                    <form action={updateClienteAction} className="grid gap-3 md:grid-cols-3">
                      <input name="redirectTo" type="hidden" value="/dashboard/clientes" />
                      <input name="id" type="hidden" value={cliente.id} />
                      <label className="text-sm font-medium text-slate-700">
                        Nombre
                        <input
                          className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                          defaultValue={cliente.nombre ?? ""}
                          name="nombre"
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Correo
                        <input
                          className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                          defaultValue={cliente.correo ?? ""}
                          name="correo"
                          type="email"
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Teléfono
                        <input
                          className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                          defaultValue={cliente.telefono ?? ""}
                          name="telefono"
                        />
                      </label>
                      <div className="md:col-span-3">
                        <button
                          className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                          type="submit"
                        >
                          Guardar cambios
                        </button>
                      </div>
                    </form>

                    <form action={deleteClienteAction} className="flex items-start">
                      <input name="redirectTo" type="hidden" value="/dashboard/clientes" />
                      <input name="id" type="hidden" value={cliente.id} />
                      <ConfirmSubmitButton
                        className="h-11 rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        confirmMessage="Se eliminará el cliente y todos sus vehículos. ¿Deseas continuar?"
                      >
                        Eliminar
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>

          <Pagination buildHref={buildHref} page={page} pageCount={pageCount} />
        </div>
      </section>
    </main>
  );
}
