import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type ModuloRow = {
  id: number;
  nombre: string;
  icono: string | null;
  status: boolean | number | string | null;
};

type AccionRow = {
  id: number;
  nombre: string;
  seg_modulo_id: number;
  status: boolean | number | string | null;
};

type AccionItem = {
  id: number;
  nombre: string;
};

function isActiveStatus(status: boolean | number | string | null) {
  if (status == null) return true;
  if (typeof status === "boolean") return status;
  if (typeof status === "number") return status === 1;
  if (typeof status === "string") {
    const normalized = status.trim().toLowerCase();
    return (
      normalized === "1" ||
      normalized === "true" ||
      normalized === "t" ||
      normalized === "active" ||
      normalized === "activo" ||
      normalized === "a"
    );
  }

  return false;
}

async function fetchPermisosCatalog(
  supabase: Awaited<ReturnType<typeof createSupabaseServerComponentClient>> | ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data: modulosRaw, error: modulosError } = await supabase
    .from("seg_modulo")
    .select("id, nombre, icono, status")
    .order("id")
    .returns<ModuloRow[]>();

  if (modulosError) {
    return { modulosError };
  }

  const modulosData = (modulosRaw ?? []).filter((modulo) => isActiveStatus(modulo.status));
  const moduloIds = modulosData.map((modulo) => modulo.id);

  if (moduloIds.length === 0) {
    return {
      modulosData,
      accionesData: [] as AccionRow[],
      accionesError: null,
    };
  }

  const loadAcciones = async (tableName: "seg_accion" | "seg_acicon") =>
    supabase
      .from(tableName)
      .select("id, nombre, seg_modulo_id, status")
      .in("seg_modulo_id", moduloIds)
      .order("orden")
      .returns<AccionRow[]>();

  const [accionesPrimarias, accionesFallback] = await Promise.all([
    loadAcciones("seg_accion"),
    loadAcciones("seg_acicon"),
  ]);

  const accionesError = accionesPrimarias.error && accionesFallback.error ? accionesPrimarias.error : null;

  if (accionesError) {
    return {
      modulosData,
      accionesData: [] as AccionRow[],
      accionesError,
    };
  }

  const accionesData = [...(accionesPrimarias.data ?? []), ...(accionesFallback.data ?? [])].filter((accion) => isActiveStatus(accion.status));

  return {
    modulosData,
    accionesData,
    accionesError: null,
  };
}

export async function GET() {
  const supabase = await createSupabaseServerComponentClient();
  let {
    modulosData = [],
    accionesData = [],
    modulosError,
    accionesError,
  } = await fetchPermisosCatalog(supabase);

  const shouldTryAdmin =
    modulosData.length === 0 &&
    isSupabaseAdminConfigured();

  if (shouldTryAdmin) {
    const adminClient = createSupabaseAdminClient();
    const adminResult = await fetchPermisosCatalog(adminClient);

    modulosData = adminResult.modulosData ?? [];
    accionesData = adminResult.accionesData ?? [];
    modulosError = adminResult.modulosError;
    accionesError = adminResult.accionesError;
  }

  if (modulosError) {
    return NextResponse.json(
      { error: "No se pudieron obtener los modulos." },
      { status: 500 },
    );
  }

  if (accionesError) {
    return NextResponse.json(
      { error: "No se pudieron obtener las acciones de permisos." },
      { status: 500 },
    );
  }

  const accionesPorModulo = new Map<number, AccionItem[]>();

  for (const accion of accionesData) {
    const actuales = accionesPorModulo.get(accion.seg_modulo_id) ?? [];
    actuales.push({
      id: accion.id,
      nombre: accion.nombre,
    });
    accionesPorModulo.set(accion.seg_modulo_id, actuales);
  }

  return NextResponse.json({
    modulos: modulosData.map((modulo) => ({
      id: modulo.id,
      title: modulo.nombre,
      icon: modulo.icono,
      permissions: accionesPorModulo.get(modulo.id) ?? [],
    })),
  });
}
