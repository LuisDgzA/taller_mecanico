import { createUsuarioAction, toggleUsuarioStatusAction, updateUsuarioAction } from "@/actions/usuarios";
import { Pagination } from "@/components/dashboard/pagination";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

type SearchParams = Promise<{
  q?: string;
  page?: string;
  error?: string;
  success?: string;
}>;

type UsuarioRow = {
  id: number;
  auth_id: string | null;
  nombre: string;
  correo: string;
  telefono: string | null;
  status: number;
};

export default async function UsuariosPage({
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
  const currentStaff = await getCurrentStaffProfile();
  const hasAdminAccess = isSupabaseAdminConfigured();

  let request = supabase
    .from("usuarios")
    .select("id, auth_id, nombre, correo, telefono, status", { count: "exact" })
    .order("nombre")
    .range(from, to);

  if (query) {
    request = request.or(
      `nombre.ilike.%${query}%,correo.ilike.%${query}%,telefono.ilike.%${query}%`,
    );
  }

  const { data, count } = await request.returns<UsuarioRow[]>();
  const usuarios = data ?? [];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildHref = (nextPage: number) => {
    const qs = new URLSearchParams();
    if (query) qs.set("q", query);
    if (nextPage > 1) qs.set("page", String(nextPage));
    const search = qs.toString();
    return search ? `/dashboard/usuarios?${search}` : "/dashboard/usuarios";
  };

  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
          F-03
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Usuarios</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Administra al personal interno y mantén sincronizados los datos de
          Supabase Auth con la tabla `public.usuarios`.
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

      {!hasAdminAccess ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Este proyecto está operando sin `SUPABASE_SERVICE_ROLE_KEY`. Aquí solo se crea el perfil interno en `public.usuarios`; la cuenta de Auth puede darse de alta aparte con el mismo correo.
        </div>
      ) : null}

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Agregar usuario
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Nueva cuenta interna
            </h2>
          </div>

          <form action={createUsuarioAction} className="mt-5 space-y-4">
            <input name="redirectTo" type="hidden" value="/dashboard/usuarios" />
            <label className="block text-sm font-medium text-slate-700">
              Nombre
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="nombre"
                required
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Correo
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                name="correo"
                required
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
            <label className="block text-sm font-medium text-slate-700">
              Contraseña {hasAdminAccess ? "" : "(opcional)"}
              <input
                className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                minLength={8}
                name="password"
                required={hasAdminAccess}
                placeholder={hasAdminAccess ? "" : "Solo si también crearás Auth aparte"}
                type="password"
              />
            </label>
            <button
              className="h-11 w-full rounded-2xl bg-slate-950 text-sm font-semibold text-white transition hover:bg-slate-800"
              type="submit"
            >
              Crear usuario
            </button>
          </form>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Personal registrado
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {total} usuario{total === 1 ? "" : "s"}
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
            {usuarios.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
                No hay usuarios que coincidan con la búsqueda actual.
              </div>
            ) : (
              usuarios.map((usuario) => {
                const isCurrentUser = currentStaff?.auth_id === usuario.auth_id;

                return (
                  <div
                    key={usuario.id}
                    className="rounded-3xl border border-slate-200 p-5"
                  >
                    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-lg font-semibold tracking-tight text-slate-950">
                          {usuario.nombre}
                        </p>
                        <p className="text-sm text-slate-500">{usuario.correo}</p>
                      </div>
                      <StatusBadge active={usuario.status === 1} />
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_auto]">
                      <form action={updateUsuarioAction} className="grid gap-3 md:grid-cols-2">
                        <input name="redirectTo" type="hidden" value="/dashboard/usuarios" />
                        <input name="id" type="hidden" value={usuario.id} />
                        <input name="authId" type="hidden" value={usuario.auth_id ?? ""} />
                        <label className="text-sm font-medium text-slate-700">
                          Nombre
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            defaultValue={usuario.nombre}
                            name="nombre"
                            required
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Correo
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950 read-only:bg-slate-100"
                            defaultValue={usuario.correo}
                            name="correo"
                            required
                            readOnly={isCurrentUser}
                            type="email"
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Teléfono
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            defaultValue={usuario.telefono ?? ""}
                            name="telefono"
                          />
                        </label>
                        <label className="text-sm font-medium text-slate-700">
                          Nueva contraseña
                          <input
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-300 px-4 outline-none transition focus:border-slate-950"
                            minLength={8}
                            name="password"
                            placeholder="Opcional"
                            type="password"
                          />
                        </label>
                        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
                          <button
                            className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                            type="submit"
                          >
                            Guardar cambios
                          </button>
                          {isCurrentUser ? (
                            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
                              Tu propio correo queda bloqueado aquí para evitar lockout.
                            </p>
                          ) : null}
                        </div>
                      </form>

                      <form action={toggleUsuarioStatusAction} className="flex items-start">
                        <input name="redirectTo" type="hidden" value="/dashboard/usuarios" />
                        <input name="id" type="hidden" value={usuario.id} />
                        <input name="authId" type="hidden" value={usuario.auth_id ?? ""} />
                        <input name="status" type="hidden" value={usuario.status} />
                        <button
                          className={`h-11 rounded-2xl px-4 text-sm font-semibold transition ${
                            usuario.status === 1
                              ? "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                          type="submit"
                        >
                          {usuario.status === 1 ? "Desactivar" : "Activar"}
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Pagination buildHref={buildHref} page={page} pageCount={pageCount} />
        </div>
      </section>
    </main>
  );
}
