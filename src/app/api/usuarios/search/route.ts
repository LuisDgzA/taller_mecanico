import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type UsuarioSearchRow = {
  id: number;
  nombre: string | null;
  correo: string | null;
  telefono: string | null;
};

type SearchClient = Awaited<ReturnType<typeof createSupabaseServerComponentClient>> | ReturnType<typeof createSupabaseAdminClient>;

async function searchUsuarios(supabase: SearchClient, query: string) {
  const safeQuery = query.replace(/[(),]/g, " ").trim();

  if (safeQuery.length === 0) {
    return { data: [] as UsuarioSearchRow[], error: null };
  }

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nombre, correo, telefono")
    .or(`nombre.ilike.%${safeQuery}%,correo.ilike.%${safeQuery}%,telefono.ilike.%${safeQuery}%`)
    .order("nombre", { ascending: true, nullsFirst: false })
    .limit(10)
    .returns<UsuarioSearchRow[]>();

  return { data: data ?? [], error };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ usuarios: [] });
  }

  const supabase = await createSupabaseServerComponentClient();
  let { data: usuarios, error } = await searchUsuarios(supabase, q);

  const shouldTryAdmin = (error || usuarios.length === 0) && isSupabaseAdminConfigured();

  if (shouldTryAdmin) {
    const adminClient = createSupabaseAdminClient();
    const adminResult = await searchUsuarios(adminClient, q);
    usuarios = adminResult.data;
    error = adminResult.error;
  }

  if (error) {
    return NextResponse.json({ error: "No se pudo buscar usuarios." }, { status: 500 });
  }

  return NextResponse.json({ usuarios });
}
