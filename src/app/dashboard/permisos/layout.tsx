import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";

export default async function PermisosLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const canManagePermissions = await currentUserHasPermission(PERMISOS.USUARIOS_PERMISOS);

  if (!canManagePermissions) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
