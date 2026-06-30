"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildActionRedirect, getRedirectTarget } from "@/lib/action-feedback";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { CreateVehiculoSchema, DeleteVehiculoSchema, UpdateVehiculoSchema } from "@/lib/schemas/vehiculo";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function createVehiculoAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
  const canAddVehiculos = await currentUserHasPermission(PERMISOS.CLIENTES_ADD_VEHICULO);

  if (!canAddVehiculos) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: "No tienes permiso para agregar vehiculos.",
      }),
    );
  }

  const parsed = CreateVehiculoSchema.safeParse({
    clienteId: formData.get("clienteId"),
    placa: formData.get("placa"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    color: formData.get("color"),
    anio: formData.get("anio"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "No se pudo crear el vehiculo.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase.from("vehiculos").insert({
    cliente_id: parsed.data.clienteId,
    placa: parsed.data.placa,
    marca: parsed.data.marca,
    modelo: parsed.data.modelo,
    color: parsed.data.color,
    anio: parsed.data.anio,
  });

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath(`/dashboard/clientes/${parsed.data.clienteId}`);
  revalidatePath("/dashboard/clientes");
  redirect(buildActionRedirect(redirectTo, { success: "Vehiculo creado correctamente." }));
}

export async function updateVehiculoAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
  const canEditVehiculos = await currentUserHasPermission(PERMISOS.CLIENTES_EDIT_VEHICULO);

  if (!canEditVehiculos) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: "No tienes permiso para editar vehiculos.",
      }),
    );
  }

  const parsed = UpdateVehiculoSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
    placa: formData.get("placa"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    color: formData.get("color"),
    anio: formData.get("anio"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "No se pudo actualizar el vehiculo.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase
    .from("vehiculos")
    .update({
      placa: parsed.data.placa,
      marca: parsed.data.marca,
      modelo: parsed.data.modelo,
      color: parsed.data.color,
      anio: parsed.data.anio,
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath(`/dashboard/clientes/${parsed.data.clienteId}`);
  revalidatePath("/dashboard/clientes");
  redirect(buildActionRedirect(redirectTo, { success: "Vehiculo actualizado correctamente." }));
}

export async function deleteVehiculoAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/clientes");
  const canDeleteVehiculos = await currentUserHasPermission(PERMISOS.CLIENTES_DEL_VEHICULO);

  if (!canDeleteVehiculos) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: "No tienes permiso para eliminar vehiculos.",
      }),
    );
  }

  const parsed = DeleteVehiculoSchema.safeParse({
    id: formData.get("id"),
    clienteId: formData.get("clienteId"),
  });

  if (!parsed.success) {
    redirect(buildActionRedirect(redirectTo, { error: "No se pudo eliminar el vehiculo." }));
  }

  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase.from("vehiculos").delete().eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath(`/dashboard/clientes/${parsed.data.clienteId}`);
  revalidatePath("/dashboard/clientes");
  redirect(buildActionRedirect(redirectTo, { success: "Vehiculo eliminado correctamente." }));
}
