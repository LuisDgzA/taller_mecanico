import { NextResponse } from "next/server";

import { createSupabaseServerComponentClient } from "@/lib/supabase/server";

type LookupRow = {
  id: number;
  placa: string;
  marca: string | null;
  modelo: string | null;
  color: string | null;
  anio: number | null;
  cliente: {
    id: number;
    nombre: string | null;
    correo: string | null;
    telefono: string | null;
  } | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placa = searchParams.get("placa")?.trim();

  if (!placa) {
    return NextResponse.json(
      { error: "El parametro placa es obligatorio." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerComponentClient();
  const { data, error } = await supabase
    .from("vehiculos")
    .select(
      "id, placa, marca, modelo, color, anio, cliente:clientes(id, nombre, correo, telefono)",
    )
    .ilike("placa", placa)
    .limit(1)
    .maybeSingle<LookupRow>();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo consultar la placa." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({
    found: true,
    vehiculo: data,
  });
}
