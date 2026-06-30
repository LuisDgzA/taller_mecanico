import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type PermissionRow = Record<string, unknown>;

export const PERMISOS = {
  CLIENTES_VER: 6,
  CLIENTES_ADD: 7,
  CLIENTES_DEL: 8,
  CLIENTES_EDIT: 16,
  CLIENTES_ADD_VEHICULO: 9,
  CLIENTES_EDIT_VEHICULO: 17,
  CLIENTES_DEL_VEHICULO: 10,
  USUARIOS_VER: 11,
  USUARIOS_ADD: 12,
  USUARIOS_EDIT: 13,
  USUARIOS_DESACTIVAR: 14,
  USUARIOS_PERMISOS: 15,
} as const;

function getPositiveNumericValue(row: PermissionRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
      }
    }
  }

  return null;
}

function rowMatchesUserId(row: PermissionRow, usuarioId: number) {
  const candidateKeys = ["usuario_id", "seg_usuario_id", "id_usuario"];

  return candidateKeys.some((key) => {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value === usuarioId;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed === usuarioId;
    }

    return false;
  });
}

async function fetchUserPermissionRows(
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>> | ReturnType<typeof createSupabaseAdminClient>,
  usuarioId: number,
) {
  const queryCandidates = ["usuario_id", "seg_usuario_id", "id_usuario"] as const;

  let lastError: { message?: string } | null = null;
  let hadSuccessfulQuery = false;
  const collectedRows: PermissionRow[] = [];

  for (const userColumn of queryCandidates) {
    const result = await supabase.from("seg_permiso").select("*").eq(userColumn, usuarioId);

    if (result.error) {
      lastError = result.error;
      continue;
    }

    hadSuccessfulQuery = true;
    const rows = (result.data ?? []) as PermissionRow[];

    if (rows.length > 0) {
      collectedRows.push(...rows);
    }
  }

  if (collectedRows.length > 0) {
    return { rows: collectedRows, error: null };
  }

  if (hadSuccessfulQuery) {
    return { rows: [] as PermissionRow[], error: null };
  }

  return { rows: [] as PermissionRow[], error: lastError };
}

const getCurrentUserPermissionIdsCached = async () => {
  const staff = await getCurrentStaffProfile();

  if (!staff) {
    return [] as number[];
  }

  const evaluate = async (
    supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>> | ReturnType<typeof createSupabaseAdminClient>,
  ) => {
    const { rows, error } = await fetchUserPermissionRows(supabase, staff.id);

    if (error) {
      return { permissionIds: [] as number[], error };
    }

    const permissionIds = [
      ...new Set(
        rows
          .map((row) => {
            if (!rowMatchesUserId(row, staff.id)) {
              return null;
            }

            return getPositiveNumericValue(row, ["seg_accion_id", "accion_id", "id_accion"]);
          })
          .filter((id): id is number => id !== null),
      ),
    ];

    return { permissionIds, error: null };
  };

  const supabase = await createSupabaseServerComponentClient();
  const baseResult = await evaluate(supabase);

  const shouldTryAdmin =
    isSupabaseAdminConfigured() &&
    (Boolean(baseResult.error) || baseResult.permissionIds.length === 0);

  if (!shouldTryAdmin) {
    return baseResult.permissionIds;
  }

  if (!isSupabaseAdminConfigured()) {
    return baseResult.permissionIds;
  }

  const adminClient = createSupabaseAdminClient();
  const adminResult = await evaluate(adminClient);

  return adminResult.permissionIds;
};

export async function getCurrentUserPermissionIds() {
  return getCurrentUserPermissionIdsCached();
}

export async function currentUserHasPermission(permissionId: number) {
  const permissions = await getCurrentUserPermissionIdsCached();
  return permissions.includes(permissionId);
}
