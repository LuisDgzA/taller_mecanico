import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type PermisoRow = Record<string, unknown>;

function getNumericValue(row: PermisoRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

async function fetchPermisos(
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>> | ReturnType<typeof createSupabaseAdminClient>,
  usuarioId: number,
) {
  const queryCandidates = ["usuario_id"] as const;

  let data: PermisoRow[] = [];
  let error: { message?: string } | null = null;

  for (const userColumn of queryCandidates) {
    const result = await supabase
      .from("seg_permiso")
      .select("*")
      .eq(userColumn, usuarioId);

    if (!result.error) {
      data = (result.data ?? []) as PermisoRow[];
      error = null;
      break;
    }

    error = result.error;
  }

  if (error) {
    return { error };
  }

  const permisos = new Set<number>();

  for (const row of data) {
    const rowUsuarioId = getNumericValue(row, ["usuario_id"]);

    if (rowUsuarioId !== usuarioId) {
      continue;
    }

    const accionId = getNumericValue(row, ["seg_accion_id", "accion_id", "id_accion"]);

    if (accionId !== null) {
      permisos.add(accionId);
    }
  }

  return { permisos: [...permisos] };
}

async function replacePermisos(
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>> | ReturnType<typeof createSupabaseAdminClient>,
  usuarioId: number,
  permisoIds: number[],
) {
  const { error: deleteError } = await supabase
    .from("seg_permiso")
    .delete()
    .eq("usuario_id", usuarioId);

  if (deleteError) {
    return { error: deleteError };
  }

  if (permisoIds.length === 0) {
    return { permisos: [] as number[] };
  }

  const rows = permisoIds.map((permisoId) => ({
    usuario_id: usuarioId,
    seg_accion_id: permisoId,
  }));

  const { error: insertError } = await supabase.from("seg_permiso").insert(rows);

  if (insertError) {
    return { error: insertError };
  }

  return { permisos: permisoIds };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ usuarioId: string }> },
) {
  const { usuarioId } = await context.params;
  const parsedUsuarioId = Number(usuarioId);

  if (!Number.isFinite(parsedUsuarioId)) {
    return NextResponse.json({ error: "Usuario invalido." }, { status: 400 });
  }

  const supabase = await createSupabaseServerComponentClient();
  let { permisos = [], error } = await fetchPermisos(supabase, parsedUsuarioId);

  if ((error || permisos.length === 0) && isSupabaseAdminConfigured()) {
    const adminClient = createSupabaseAdminClient();
    const adminResult = await fetchPermisos(adminClient, parsedUsuarioId);
    permisos = adminResult.permisos ?? [];
    error = adminResult.error;
  }

  if (error) {
    return NextResponse.json(
      { error: "No se pudieron obtener los permisos del usuario." },
      { status: 500 },
    );
  }

  return NextResponse.json({ permisos });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ usuarioId: string }> },
) {
  const { usuarioId } = await context.params;
  const parsedUsuarioId = Number(usuarioId);

  if (!Number.isFinite(parsedUsuarioId)) {
    return NextResponse.json({ error: "Usuario invalido." }, { status: 400 });
  }

  let body: { permisos?: unknown };

  try {
    body = (await request.json()) as { permisos?: unknown };
  } catch {
    return NextResponse.json({ error: "Cuerpo invalido." }, { status: 400 });
  }

  const permisoIds = Array.isArray(body.permisos)
    ? body.permisos
        .map((permisoId) => Number(permisoId))
        .filter((permisoId) => Number.isFinite(permisoId))
    : [];

  const permisoIdsUnicos = [...new Set(permisoIds)];

  const supabase = await createSupabaseServerComponentClient();

  let result = await replacePermisos(supabase, parsedUsuarioId, permisoIdsUnicos);

  if (result.error && isSupabaseAdminConfigured()) {
    const adminClient = createSupabaseAdminClient();
    result = await replacePermisos(adminClient, parsedUsuarioId, permisoIdsUnicos);
  }

  if (result.error) {
    return NextResponse.json(
      { error: "No se pudieron guardar los permisos del usuario." },
      { status: 500 },
    );
  }

  return NextResponse.json({ permisos: result.permisos ?? permisoIdsUnicos });
}
