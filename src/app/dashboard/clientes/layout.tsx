import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";

export default async function ClientesLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const canViewClientes = await currentUserHasPermission(PERMISOS.CLIENTES_VER);

  if (!canViewClientes) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
