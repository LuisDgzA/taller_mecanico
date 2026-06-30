"use client";

import { useEffect, useRef, useState } from "react";
import {
  CarFront,
  ChevronDown,
  ClipboardList,
  Loader2,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";

type IconKey = "servicios" | "clientes" | "usuarios" | "permisos";

type PermisoItem = {
  id: number;
  nombre: string;
};

type ModuloPermiso = {
  id: number | string;
  title: string;
  icon: string | null;
  permissions: PermisoItem[];
};

type ModuloPermisoApi = {
  id?: number | string;
  modulo_id?: number | string;
  title?: string;
  nombre?: string;
  descripcion?: string;
  icon?: string | null;
  icono?: string | null;
  modulo_icono?: string | null;
  permissions?: PermisoApiItem[];
  acciones?: PermisoApiItem[];
  permisos?: PermisoApiItem[];
};

type PermisoApiItem = {
  id?: number | string;
  nombre?: string;
  seg_accion_id?: number | string;
  accion_id?: number | string;
  id_accion?: number | string;
};

const iconByKey: Record<IconKey, typeof ClipboardList> = {
  servicios: ClipboardList,
  clientes: CarFront,
  usuarios: Users,
  permisos: ShieldCheck,
};

const lucideIconByKey: Record<string, typeof ClipboardList> = {
  clipboardlist: ClipboardList,
  carfront: CarFront,
  users: Users,
  shieldcheck: ShieldCheck,
};

function normalizeIconKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveModuleIcon(icon: string | null, title: string) {
  const iconKey = normalizeIconKey(icon);
  const titleKey = normalizeIconKey(title);

  return (
    lucideIconByKey[iconKey] ??
    iconByKey[titleKey as IconKey] ??
    lucideIconByKey[titleKey] ??
    ClipboardList
  );
}

type UsuarioSearchItem = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string | null;
};

function normalizeModuleCards(modulos: ModuloPermisoApi[] | undefined): ModuloPermiso[] {
  if (!Array.isArray(modulos)) return [];

  return modulos
    .map((modulo) => {
      const rawModuleId = modulo.id ?? modulo.modulo_id;
      const moduleId =
        typeof rawModuleId === "string" || typeof rawModuleId === "number"
          ? rawModuleId
          : "";
      const moduleTitle = (modulo.title ?? modulo.nombre ?? modulo.descripcion ?? "").trim();
      const sourcePermissions: PermisoApiItem[] = Array.isArray(modulo.permissions)
        ? modulo.permissions
        : Array.isArray(modulo.acciones)
          ? modulo.acciones
          : Array.isArray(modulo.permisos)
            ? modulo.permisos
            : [];

      const permissions = sourcePermissions
        .map((permission) => {
          const permissionId = Number(
            permission.id ?? permission.seg_accion_id ?? permission.accion_id ?? permission.id_accion,
          );
          const permissionName = (permission.nombre ?? "").trim();

          if (!Number.isFinite(permissionId) || !permissionName) {
            return null;
          }

          return {
            id: permissionId,
            nombre: permissionName,
          };
        })
        .filter((permission): permission is PermisoItem => permission !== null);

      if ((typeof moduleId === "string" && moduleId.trim() === "") || !moduleTitle) {
        return null;
      }

      return {
        id: moduleId,
        title: moduleTitle,
        icon: modulo.icon ?? modulo.icono ?? modulo.modulo_icono ?? null,
        permissions,
      };
    })
    .filter((modulo): modulo is ModuloPermiso => modulo !== null);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isModuleLike(value: unknown) {
  if (!isRecord(value)) return false;

  return (
    "nombre" in value ||
    "title" in value ||
    "modulo_id" in value ||
    "permissions" in value ||
    "acciones" in value ||
    "permisos" in value
  );
}

function getModulesArray(payload: unknown): unknown[] {
  if (isRecord(payload) && Array.isArray(payload.modulos)) {
    return payload.modulos;
  }

  if (isRecord(payload) && isRecord(payload.data) && Array.isArray(payload.data.modulos)) {
    return payload.data.modulos;
  }

  return getModulesFromPayload(payload);
}

function getModulesFromPayload(payload: unknown): ModuloPermisoApi[] {
  const queue: unknown[] = [payload];
  let depth = 0;

  while (queue.length > 0 && depth < 40) {
    const current = queue.shift();
    depth += 1;

    if (Array.isArray(current)) {
      const objectItems = current.filter(isRecord);
      if (objectItems.length > 0 && objectItems.some(isModuleLike)) {
        return objectItems as ModuloPermisoApi[];
      }

      queue.push(...current);
      continue;
    }

    if (!isRecord(current)) {
      continue;
    }

    const preferredKeys = ["modulos", "modules", "data", "result", "payload", "items"];

    for (const key of preferredKeys) {
      if (key in current) {
        queue.push(current[key]);
      }
    }

    for (const value of Object.values(current)) {
      queue.push(value);
    }
  }

  return [];
}

export default function PermisosPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<UsuarioSearchItem[]>([]);
  const [moduleCards, setModuleCards] = useState<ModuloPermiso[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(true);
  const [modulesError, setModulesError] = useState("");
  const [selectedUser, setSelectedUser] = useState<UsuarioSearchItem | null>(null);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [isLoadingUserPermissions, setIsLoadingUserPermissions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const effectiveQuery = query.trim();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadModules = async () => {
      try {
        setIsLoadingModules(true);
        setModulesError("");

        const response = await fetch("/api/permisos/modulos");
        const responseText = await response.text();

        let payload: Record<string, unknown> = {};

        try {
          payload = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : {};
        } catch {
          payload = {};
        }

        if (!response.ok) {
          if (!isMounted) return;
          setModuleCards([]);
          const apiError = typeof payload.error === "string" ? payload.error : "";
          setModulesError(
            apiError || `No se pudieron cargar los modulos (HTTP ${response.status}).`,
          );
          return;
        }

        if (!isMounted) return;
        const normalizedCards = normalizeModuleCards(getModulesArray(payload) as ModuloPermisoApi[]);
        setModuleCards(normalizedCards);

        if (normalizedCards.length === 0) {
          setModulesError("La API respondió, pero no se detectaron módulos renderizables.");
        }
      } catch {
        if (!isMounted) return;
        setModuleCards([]);
        setModulesError("No se pudieron cargar los modulos.");
      } finally {
        if (!isMounted) return;
        setIsLoadingModules(false);
      }
    };

    void loadModules();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) return;

    const controller = new AbortController();

    const loadUserPermissions = async () => {
      try {
        setIsLoadingUserPermissions(true);

        const response = await fetch(`/api/permisos/usuarios/${selectedUser.id}`, {
          signal: controller.signal,
        });

        const payload = (await response.json()) as {
          permisos?: number[];
          error?: string;
        };

        if (!response.ok) {
          if (controller.signal.aborted) return;
          setSelectedPermissionIds([]);
          return;
        }

        if (controller.signal.aborted) return;
        setSelectedPermissionIds(payload.permisos ?? []);
      } catch {
        if (controller.signal.aborted) return;
        setSelectedPermissionIds([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingUserPermissions(false);
        }
      }
    };

    void loadUserPermissions();

    return () => {
      controller.abort();
    };
  }, [selectedUser]);

  useEffect(() => {
    if (effectiveQuery.length < 2) {
      abortRef.current?.abort();
      return;
    }

    const timeoutId = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `/api/usuarios/search?q=${encodeURIComponent(effectiveQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          setResults([]);
          setErrorMessage("No se pudo buscar usuarios.");
          return;
        }

        const payload = (await response.json()) as {
          usuarios?: UsuarioSearchItem[];
          error?: string;
        };

        setResults(payload.usuarios ?? []);
        if (payload.error) {
          setErrorMessage(payload.error);
        }
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [effectiveQuery]);

  const selectUser = (usuario: UsuarioSearchItem) => {
    setSelectedUser(usuario);
    setQuery(usuario.nombre);
    setIsDropdownOpen(false);
    setResults([]);
    setSelectedPermissionIds([]);
  };

  const clearSelectedUser = () => {
    setSelectedUser(null);
    setQuery("");
    setResults([]);
    setErrorMessage("");
    setSelectedPermissionIds([]);
    setSaveMessage("");
    setSaveError("");
    setIsDropdownOpen(false);
  };

  const toggleModulePermissions = (permissionIds: number[], checked: boolean) => {
    setSelectedPermissionIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        permissionIds.forEach((permissionId) => nextIds.add(permissionId));
      } else {
        permissionIds.forEach((permissionId) => nextIds.delete(permissionId));
      }

      return Array.from(nextIds);
    });
  };

  const togglePermission = (permissionId: number, checked: boolean) => {
    setSelectedPermissionIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (checked) {
        nextIds.add(permissionId);
      } else {
        nextIds.delete(permissionId);
      }

      return Array.from(nextIds);
    });
  };

  const savePermissions = async () => {
    if (!selectedUser) {
      setSaveError("Selecciona un usuario primero.");
      setSaveMessage("");
      return;
    }

    try {
      setIsSavingPermissions(true);
      setSaveError("");
      setSaveMessage("");

      const response = await fetch(`/api/permisos/usuarios/${selectedUser.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permisos: selectedPermissionIds }),
      });

      const payload = (await response.json()) as {
        permisos?: number[];
        error?: string;
      };

      if (!response.ok) {
        setSaveError(payload.error ?? "No se pudieron guardar los permisos.");
        return;
      }

      setSelectedPermissionIds(payload.permisos ?? selectedPermissionIds);
      setSaveMessage("Permisos guardados correctamente.");
    } catch {
      setSaveError("No se pudieron guardar los permisos.");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const canSavePermissions =
    Boolean(selectedUser) &&
    selectedPermissionIds.length > 0 &&
    !isSavingPermissions &&
    !isLoadingUserPermissions;

  const saveLegend = !selectedUser
    ? "Selecciona un usuario para continuar."
    : selectedPermissionIds.length === 0
      ? "Marca al menos un permiso para habilitar el guardado."
      : null;

  return (
    <>
      <PageHeader title="Permisos" />

      <div className="bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Gestión de accesos
      </div>

      <div className="px-4 py-3 text-sm text-on-surface-variant">
        Configura los permisos por módulo para controlar lo que cada usuario puede
        ver y ejecutar.
      </div>

      <section className="mx-4 mt-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <div className="relative" ref={containerRef}>
          <label
            className="mb-2 block text-sm font-medium text-on-surface"
            htmlFor="usuario-typeahead"
          >
            Buscar usuario
          </label>
          <div className="flex h-10 items-center rounded-lg border border-outline-variant bg-surface-container-low px-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <Search className="size-4 text-on-surface-variant" />
            <input
              autoComplete="off"
              className="h-full w-full bg-transparent px-3 text-sm text-on-surface outline-none"
              id="usuario-typeahead"
              onChange={(event) => {
                const nextValue = event.target.value;
                setQuery(nextValue);
                if (selectedUser && nextValue.trim() !== selectedUser.nombre) {
                  setSelectedUser(null);
                  setSelectedPermissionIds([]);
                }
                setIsDropdownOpen(true);
                if (nextValue.trim().length < 2) {
                  setResults([]);
                  setErrorMessage("");
                }
              }}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder="Escribe nombre, correo o teléfono..."
              value={query}
            />
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-on-surface-variant" />
            ) : selectedUser ? (
              <button
                aria-label="Limpiar usuario seleccionado"
                className="rounded-full p-1 text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
                onClick={clearSelectedUser}
                type="button"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>

          {isDropdownOpen && effectiveQuery.length >= 2 ? (
            <div className="absolute z-20 mt-2 w-full rounded-lg border border-outline-variant bg-surface-container-lowest p-2 shadow-lg">
              {errorMessage ? (
                <p className="px-3 py-2 text-sm text-on-error-container">{errorMessage}</p>
              ) : results.length === 0 && !isLoading ? (
                <p className="px-3 py-2 text-sm text-on-surface-variant">
                  No se encontraron usuarios.
                </p>
              ) : (
                <ul className="max-h-60 overflow-y-auto">
                  {results.map((usuario) => (
                    <li key={usuario.id}>
                      <button
                        className="w-full rounded-lg px-3 py-2 text-left transition hover:bg-surface-container-low"
                        onClick={() => selectUser(usuario)}
                        type="button"
                      >
                        <p className="text-sm font-medium text-on-surface">{usuario.nombre}</p>
                        <p className="text-xs text-on-surface-variant">{usuario.correo}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        {selectedUser ? (
          <div
            className="mt-4 rounded-lg border px-4 py-3 text-sm"
            style={{ background: "#00573314", borderColor: "#95cfab", color: "#005a33" }}
          >
            Permisos de: <span className="font-semibold">{selectedUser.nombre}</span> ({selectedUser.correo})
            {isLoadingUserPermissions ? (
              <span className="ml-2">Cargando permisos actuales...</span>
            ) : null}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
            Busca y selecciona un usuario para asignar permisos.
          </div>
        )}

        {saveMessage ? (
          <div
            className="mt-4 rounded-lg border px-4 py-3 text-sm"
            style={{ background: "#00573314", borderColor: "#95cfab", color: "#005a33" }}
          >
            {saveMessage}
          </div>
        ) : null}

        {saveError ? (
          <div className="mt-4 rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
            {saveError}
          </div>
        ) : null}
      </section>

      <div className="mt-3 bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        Módulos disponibles
      </div>

      <section className="grid gap-3 px-4 py-3 md:grid-cols-2 xl:grid-cols-3">
        {isLoadingModules ? (
          <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
            Cargando modulos de permisos...
          </div>
        ) : modulesError ? (
          <div className="rounded-lg bg-error-container p-4 text-sm text-on-error-container">
            {modulesError}
          </div>
        ) : moduleCards.length === 0 ? (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
            No hay modulos activos para configurar.
          </div>
        ) : moduleCards.map((moduleCard) => {
          const ModuleIcon = resolveModuleIcon(moduleCard.icon, moduleCard.title);
          const contentId = `permisos-${moduleCard.title.toLowerCase()}`;
          const selectedPermissionSet = new Set(selectedPermissionIds);
          const modulePermissionIds = moduleCard.permissions.map((permission) => permission.id);
          const modulePermissionCount = modulePermissionIds.length;
          const selectedModulePermissionCount = modulePermissionIds.filter((permissionId) =>
            selectedPermissionSet.has(permissionId),
          ).length;
          const areAllModulePermissionsSelected =
            modulePermissionCount > 0 && selectedModulePermissionCount === modulePermissionCount;

          return (
            <details
              key={moduleCard.title}
              className="group overflow-hidden rounded-2xl border border-outline-variant/80 bg-surface-container-lowest shadow-sm transition hover:border-outline"
            >
              <summary
                aria-controls={contentId}
                className="flex cursor-pointer list-none items-center justify-between bg-linear-to-br from-surface-container-low via-surface-container to-surface-container-high px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 group-open:border-b group-open:border-outline-variant [&::-webkit-details-marker]:hidden"
              >
                <div className="flex min-w-0 items-center gap-3 text-on-surface">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/80 bg-surface-container-lowest text-primary">
                    <ModuleIcon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold tracking-tight">
                      {moduleCard.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant">
                      {selectedModulePermissionCount}/{modulePermissionCount} permisos activos
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="flex size-8 items-center justify-center rounded-full border border-outline-variant bg-surface-container-low text-on-surface transition group-hover:bg-surface-container">
                    <ChevronDown className="size-4 transition-transform duration-200 group-open:rotate-180" />
                  </span>
                </div>
              </summary>

              <div className="overflow-hidden" id={contentId}>
                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2">
                    <label className="flex items-center gap-3 text-on-surface">
                      <input
                        checked={areAllModulePermissionsSelected}
                        className="size-4 rounded border-outline-variant accent-primary"
                        onChange={(event) => toggleModulePermissions(modulePermissionIds, event.target.checked)}
                        type="checkbox"
                      />
                      <span className="text-sm font-medium leading-tight">Asignar todos</span>
                    </label>
                    <span className="text-xs font-medium text-on-surface-variant">
                      {modulePermissionCount} acciones
                    </span>
                  </div>

                  <div className="grid gap-2">
                    {moduleCard.permissions.map((permission) => {
                      const isChecked = selectedPermissionSet.has(permission.id);

                      return (
                        <label
                          key={`${moduleCard.title}-${permission.id}`}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm leading-tight transition ${
                            isChecked
                              ? "border-primary/25 bg-primary/8 text-on-surface"
                              : "border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low"
                          }`}
                        >
                          <input
                            className="size-4 rounded border-outline-variant accent-primary"
                            checked={isChecked}
                            onChange={(event) => togglePermission(permission.id, event.target.checked)}
                            type="checkbox"
                          />
                          <span className="leading-tight">{permission.nombre}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </section>

      <div className="px-4 pb-6 pt-2">
        <button
          className={`h-11 w-full rounded-lg px-5 text-sm font-semibold text-on-primary transition ${
            canSavePermissions
              ? "bg-primary active:scale-[0.99]"
              : "cursor-not-allowed bg-outline-variant text-on-surface-variant"
          }`}
          disabled={!canSavePermissions}
          onClick={() => {
            void savePermissions();
          }}
          type="button"
        >
          {isSavingPermissions ? "Guardando permisos..." : "Guardar permisos del usuario"}
        </button>
        {!canSavePermissions && saveLegend ? (
          <p className="mt-2 text-xs text-on-surface-variant">{saveLegend}</p>
        ) : null}
      </div>
    </>
  );
}
