import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";

export default async function InventarioLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const canViewInventario = await currentUserHasPermission(PERMISOS.INVENTARIO_VER);

  if (!canViewInventario) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}