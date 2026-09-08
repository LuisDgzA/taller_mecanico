import { NextResponse } from "next/server";

import { buildRefaccionesTemplateWorkbook } from "@/lib/inventario-import";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";

export async function GET() {
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    return NextResponse.json({ error: "No tienes permiso para administrar inventario." }, { status: 403 });
  }

  const buffer = await buildRefaccionesTemplateWorkbook();

  return new NextResponse(Buffer.from(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="plantilla-refacciones.xlsx"',
    },
  });
}
