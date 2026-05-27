"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildActionRedirect, getRedirectTarget } from "@/lib/action-feedback";
import { DeleteClienteSchema, CreateClienteSchema, UpdateClienteSchema } from "@/lib/schemas/cliente";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function createClienteAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
  const parsed = CreateClienteSchema.safeParse({
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "No se pudo crear el cliente.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase.from("clientes").insert(parsed.data);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath("/dashboard/clientes");
  redirect(buildActionRedirect(redirectTo, { success: "Cliente creado correctamente." }));
}

export async function updateClienteAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
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
