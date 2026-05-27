import { NextResponse } from "next/server";

import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type ClienteSearchRow = {
  id: number;
  nombre: string | null;
  telefono: string | null;
  vehiculos: {
    id: number;
    placa: string;
    marca: string | null;
    modelo: string | null;
  }[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ clientes: [] });
  }

  const supabase = await createSupabaseServerComponentClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, vehiculos(id, placa, marca, modelo)")
    .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
    .order("nombre")
    .limit(8)
    .returns<ClienteSearchRow[]>();

  if (error) {
    return NextResponse.json({ error: "No se pudo buscar." }, { status: 500 });
  }

  return NextResponse.json({ clientes: data ?? [] });
}
