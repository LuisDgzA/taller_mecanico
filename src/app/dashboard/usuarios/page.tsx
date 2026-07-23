import { Ban, Search, UserPlus } from "lucide-react";
import { redirect } from "next/navigation";

import { createUsuarioAction, toggleUsuarioStatusAction, updateUsuarioAction } from "@/actions/usuarios";
import { Pagination } from "@/components/dashboard/pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ActionButton } from "@/components/ui/action-button";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
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

const inputClass =
  "mt-1.5 h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const canViewUsers = await currentUserHasPermission(PERMISOS.USUARIOS_VER);

  if (!canViewUsers) {
    redirect("/dashboard");
  }

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
  const canDeactivateUsers = await currentUserHasPermission(PERMISOS.USUARIOS_DESACTIVAR);
  const canEditUsers = await currentUserHasPermission(PERMISOS.USUARIOS_EDIT);
  const canAddUser = await currentUserHasPermission(PERMISOS.USUARIOS_ADD);

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
    <>
      <PageHeader title="Usuarios" />

      {/* Alerts */}
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

      {!hasAdminAccess ? (
        <div className="mx-4 mt-3 lg:mx-8 rounded-lg border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
          Este proyecto está operando sin <code>SUPABASE_SERVICE_ROLE_KEY</code>. Aquí solo
          se crea el perfil interno en <code>public.usuarios</code>; la cuenta de Auth puede
          darse de alta aparte con el mismo correo.
        </div>
      ) : null}

      {/*
        Mobile: stacks Nueva cuenta → Personal registrado
        Desktop: two-column grid. Left = Nueva cuenta, Right = Personal registrado
      */}
      <div className="lg:grid lg:grid-cols-[minmax(320px,380px)_1fr] lg:gap-8 lg:items-start lg:px-8 lg:py-6">

        {/* ── Nueva cuenta interna — col 1 ── */}
        {canAddUser ? (
          <section className="lg:col-start-1 lg:row-start-1 lg:rounded-2xl lg:border lg:border-outline-variant lg:overflow-hidden lg:bg-surface-container-lowest">
            <div className="bg-primary/8 px-4 py-3 lg:bg-surface-container-low">
              <p className="text-sm font-semibold text-primary lg:text-xs lg:font-semibold lg:uppercase lg:tracking-wide lg:text-on-surface-variant">
                Nueva cuenta interna
              </p>
            </div>

            <form action={createUsuarioAction} className="space-y-4 px-4 py-4">
              <input name="redirectTo" type="hidden" value="/dashboard/usuarios" />

              <div>
                <label className="block text-xs text-on-surface-variant">Nombre</label>
                <input
                  className={inputClass}
                  name="nombre"
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-on-surface-variant">Correo</label>
                <input
                  className={inputClass}
                  name="correo"
                  placeholder="ejemplo@taller.com"
                  required
                  type="email"
                />
              </div>

              <div>
                <label className="block text-xs text-on-surface-variant">Teléfono</label>
                <input
                  className={inputClass}
                  name="telefono"
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div>
                <label className="block text-xs text-on-surface-variant">
                  Contraseña {hasAdminAccess ? "" : "(opcional)"}
                </label>
                <input
                  className={inputClass}
                  minLength={8}
                  name="password"
                  placeholder="••••••••"
                  required={hasAdminAccess}
                  type="password"
                />
              </div>

              <ActionButton className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:opacity-60">
                <UserPlus className="size-4" />
                Crear Cuenta
              </ActionButton>
            </form>
          </section>
        ) : null}

        {/* ── Personal Registrado — col 2 ── */}
        <section className={`mt-4 lg:mt-0 ${canAddUser ? "lg:col-start-2 lg:row-start-1" : "lg:col-start-1 lg:col-span-2 lg:row-start-1"} lg:rounded-2xl lg:border lg:border-outline-variant lg:overflow-hidden lg:bg-surface-container-lowest`}>
          <div className="flex items-center justify-between bg-surface-container-low px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Personal registrado
            </span>
            <span className="text-xs text-on-surface-variant">{total} usuario{total !== 1 ? "s" : ""}</span>
          </div>

          {/* Inline search */}
          <div className="border-b border-outline-variant px-4 py-3">
            <form>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container pl-9 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
                  defaultValue={query}
                  name="q"
                  placeholder="Buscar usuario..."
                />
              </div>
            </form>
          </div>

          <div className="divide-y divide-outline-variant">
            {usuarios.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-on-surface-variant">
                No hay usuarios que coincidan.
              </div>
            ) : (
              usuarios.map((usuario) => {
                const isCurrentUser = currentStaff?.auth_id === usuario.auth_id;

                return (
                  <div key={usuario.id} className="px-4 py-3.5">
                    {/* Avatar + info */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {usuario.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-on-surface">
                            {usuario.nombre}
                          </p>
                          <StatusBadge active={usuario.status === 1} />
                          {isCurrentUser ? (
                            <span className="text-[11px] text-on-surface-variant">(tú)</span>
                          ) : null}
                        </div>
                        <p className="truncate text-xs text-on-surface-variant">{usuario.correo}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {(canEditUsers || canDeactivateUsers) ? (
                      <div className="mt-3 flex gap-2 border-t border-outline-variant pt-3">
                        {canEditUsers ? (
                          <form action={updateUsuarioAction} className="flex-1">
                            <input name="redirectTo" type="hidden" value="/dashboard/usuarios" />
                            <input name="id" type="hidden" value={usuario.id} />
                            <input name="authId" type="hidden" value={usuario.auth_id ?? ""} />
                            <input name="nombre" type="hidden" value={usuario.nombre} />
                            <input name="correo" type="hidden" value={usuario.correo} />
                            <input name="telefono" type="hidden" value={usuario.telefono ?? ""} />
                            <ActionButton className="h-9 w-full rounded-lg border border-outline-variant text-sm font-medium text-on-surface transition disabled:opacity-60">
                              Guardar
                            </ActionButton>
                          </form>
                        ) : null}

                        {canDeactivateUsers ? (
                          <form action={toggleUsuarioStatusAction} className="flex-1">
                            <input name="redirectTo" type="hidden" value="/dashboard/usuarios" />
                            <input name="id" type="hidden" value={usuario.id} />
                            <input name="authId" type="hidden" value={usuario.auth_id ?? ""} />
                            <input name="status" type="hidden" value={usuario.status} />
                            <ActionButton
                              className={`flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border text-sm font-medium transition disabled:opacity-60 ${
                                usuario.status === 1
                                  ? "border-error text-error"
                                  : "border-outline-variant text-on-surface"
                              }`}
                            >
                              {usuario.status === 1 ? (
                                <>
                                  <Ban className="size-3.5" />
                                  Desactivar
                                </>
                              ) : (
                                "Activar"
                              )}
                            </ActionButton>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {pageCount > 1 ? (
            <div className="border-t border-outline-variant px-4 py-3">
              <Pagination buildHref={buildHref} page={page} pageCount={pageCount} />
            </div>
          ) : null}
        </section>

      </div>
    </>
  );
}
