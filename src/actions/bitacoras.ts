"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildActionRedirect } from "@/lib/action-feedback";
import { requireCurrentStaffProfile } from "@/lib/current-staff";
import { currentUserHasPermission, PERMISOS } from "@/lib/permissions";
import { CreateBitacoraSchema, DeleteBitacoraSchema } from "@/lib/schemas/bitacora";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function createBitacoraAction(formData: FormData) {
  const canAddNotas = await currentUserHasPermission(PERMISOS.SERVICIOS_ADD_NOTA);

  if (!canAddNotas) {
    redirect(
      buildActionRedirect(`/dashboard/servicios/${formData.get("servicioId")}`, {
        error: "No tienes permiso para agregar notas de servicio.",
      }),
    );
  }

  const staff = await requireCurrentStaffProfile();

  const parsed = CreateBitacoraSchema.safeParse({
    servicioId: formData.get("servicioId"),
    descripcion: formData.get("descripcion"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(`/dashboard/servicios/${formData.get("servicioId")}`, {
        error: parsed.error.issues[0]?.message ?? "No se pudo crear la nota.",
      }),
    );
  }

  const supabase = await createSupabaseServerActionClient();

  const { data: bitacora, error } = await supabase
    .from("bitacoras")
    .insert({
      servicio_id: parsed.data.servicioId,
      usuario_id: staff.id,
      descripcion: parsed.data.descripcion,
    })
    .select("id")
    .single();

  if (error || !bitacora) {
    redirect(
      buildActionRedirect(`/dashboard/servicios/${parsed.data.servicioId}`, {
        error: error?.message ?? "No se pudo crear la nota.",
      }),
    );
  }

  // Upload images if any
  const rawFiles = formData.getAll("imagenes");
  const files = rawFiles.filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > 0) {
    const fieldNames = ["imagen_uno", "imagen_dos", "imagen_tres", "imagen_cuatro"];
    const imageFields: Record<string, string> = {};

    for (let i = 0; i < Math.min(files.length, 4); i++) {
      const file = files[i];
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
      const path = `${bitacora.id}/imagen_${i + 1}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("bitacoras")
        .upload(path, file, { upsert: true });

      if (!uploadError) {
        imageFields[fieldNames[i]] = path;
      }
    }

    if (Object.keys(imageFields).length > 0) {
      await supabase.from("bitacoras").update(imageFields).eq("id", bitacora.id);
    }
  }

  revalidatePath(`/dashboard/servicios/${parsed.data.servicioId}`);
  redirect(`/dashboard/servicios/${parsed.data.servicioId}?success=Nota+agregada+correctamente`);
}

export async function deleteBitacoraAction(formData: FormData) {
  const canDeleteNotas = await currentUserHasPermission(PERMISOS.SERVICIOS_DEL_NOTA);

  if (!canDeleteNotas) {
    redirect(
      buildActionRedirect(`/dashboard/servicios/${formData.get("servicioId")}`, {
        error: "No tienes permiso para eliminar notas de servicio.",
      }),
    );
  }

  const staff = await requireCurrentStaffProfile();

  const parsed = DeleteBitacoraSchema.safeParse({
    id: formData.get("id"),
    servicioId: formData.get("servicioId"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/servicios/${formData.get("servicioId")}`);
  }

  const supabase = await createSupabaseServerActionClient();

  // Only the entry's author can delete
  const { error } = await supabase
    .from("bitacoras")
    .delete()
    .eq("id", parsed.data.id)
    .eq("usuario_id", staff.id);

  if (error) {
    redirect(
      buildActionRedirect(`/dashboard/servicios/${parsed.data.servicioId}`, {
        error: error.message,
      }),
    );
  }

  revalidatePath(`/dashboard/servicios/${parsed.data.servicioId}`);
  redirect(`/dashboard/servicios/${parsed.data.servicioId}`);
}
