"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildActionRedirect, getRedirectTarget } from "@/lib/action-feedback";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { DeleteClienteSchema, CreateClienteSchema, UpdateClienteSchema } from "@/lib/schemas/cliente";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

type DuplicateClienteMatch = {
  id: number;
  nombre: string | null;
  correo: string | null;
  telefono: string | null;
};

export type CreateClienteActionState = {
  duplicateMatches?: DuplicateClienteMatch[];
  duplicateName?: string;
  error?: string;
};

const normalizeName = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("es-MX");

export async function createClienteAction(
  _: CreateClienteActionState,
  formData: FormData,
): Promise<CreateClienteActionState> {
  const canAddClientes = await currentUserHasPermission(PERMISOS.CLIENTES_ADD);

  if (!canAddClientes) {
    return {
      error: "No tienes permiso para crear clientes.",
    };
  }

  const parsed = CreateClienteSchema.safeParse({
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "No se pudo crear el cliente.",
    };
  }

  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
  const supabase = await createSupabaseServerActionClient();
  const duplicateConfirmed = String(formData.get("confirmDuplicate") ?? "").trim() === "1";
  const normalizedName = normalizeName(parsed.data.nombre);

  if (!duplicateConfirmed) {
    const { data: possibleDuplicates, error: duplicateError } = await supabase
      .from("clientes")
      .select("id, nombre, correo, telefono")
      .ilike("nombre", parsed.data.nombre)
      .limit(5)
      .returns<DuplicateClienteMatch[]>();

    if (duplicateError) {
      return { error: duplicateError.message };
    }

    const exactDuplicates = (possibleDuplicates ?? []).filter(
      (cliente) => cliente.nombre && normalizeName(cliente.nombre) === normalizedName,
    );

    if (exactDuplicates.length > 0) {
      return {
        duplicateMatches: exactDuplicates,
        duplicateName: parsed.data.nombre,
      };
    }
  }

  const { error } = await supabase.from("clientes").insert(parsed.data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  redirect(buildActionRedirect(redirectTo, { success: "Cliente creado correctamente." }));
}

export async function updateClienteAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
  const canEditClientes = await currentUserHasPermission(PERMISOS.CLIENTES_EDIT);

  if (!canEditClientes) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: "No tienes permiso para editar clientes.",
      }),
    );
  }

  const parsed = UpdateClienteSchema.safeParse({
    id: formData.get("id"),
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "No se pudo actualizar el cliente.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase
    .from("clientes")
    .update({
      nombre: parsed.data.nombre,
      correo: parsed.data.correo,
      telefono: parsed.data.telefono,
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${parsed.data.id}`);
  redirect(buildActionRedirect(redirectTo, { success: "Cliente actualizado correctamente." }));
}

export async function deleteClienteAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
  const canDeleteClientes = await currentUserHasPermission(PERMISOS.CLIENTES_DEL);

  if (!canDeleteClientes) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: "No tienes permiso para eliminar clientes.",
      }),
    );
  }

  const parsed = DeleteClienteSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    redirect(buildActionRedirect(redirectTo, { error: "No se pudo eliminar el cliente." }));
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase.from("clientes").delete().eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath("/dashboard/clientes");
  redirect(buildActionRedirect(redirectTo, { success: "Cliente eliminado correctamente." }));
}
