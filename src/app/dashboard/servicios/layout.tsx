import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";

export default async function ServiciosLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const canViewServicios = await currentUserHasPermission(PERMISOS.SERVICIOS_VER);

  if (!canViewServicios) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
