"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentStaffProfile } from "@/lib/current-staff";
import { buildActionRedirect, getRedirectTarget } from "@/lib/action-feedback";
import { CreateUsuarioSchema, ToggleUsuarioSchema, UpdateUsuarioSchema } from "@/lib/schemas/usuario";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export async function createUsuarioAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/usuarios");
  const hasAdminAccess = isSupabaseAdminConfigured();
  const parsed = CreateUsuarioSchema.safeParse({
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: parsed.error.issues[0]?.message ?? "Datos invalidos para crear el usuario.",
      }),
    );
  }

  await requireCurrentStaffProfile();
  const supabase = await createSupabaseServerActionClient();

  if (hasAdminAccess && !parsed.data.password) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: "La contrasena es obligatoria cuando se crea tambien la cuenta de acceso.",
      }),
    );
  }

  let authId: string | null = null;

  if (hasAdminAccess) {
    const admin = createSupabaseAdminClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: parsed.data.correo,
      password: parsed.data.password!,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      redirect(
        buildActionRedirect(redirectTo, {
          error: authError?.message ?? "No se pudo crear la cuenta en Supabase Auth.",
        }),
      );
    }

    authId = authData.user.id;

    const { error: insertError } = await admin.from("usuarios").insert({
      auth_id: authId,
      nombre: parsed.data.nombre,
      correo: parsed.data.correo,
      telefono: parsed.data.telefono ?? null,
      status: 1,
    });

    if (insertError) {
      await admin.auth.admin.deleteUser(authId);
      redirect(buildActionRedirect(redirectTo, { error: insertError.message }));
    }

    revalidatePath("/dashboard/usuarios");
    redirect(buildActionRedirect(redirectTo, { success: "Usuario creado correctamente." }));
  }

  const { error: insertError } = await supabase.from("usuarios").insert({
    auth_id: null,
    nombre: parsed.data.nombre,
    correo: parsed.data.correo,
    telefono: parsed.data.telefono ?? null,
    status: 1,
  });

  if (insertError) {
    redirect(buildActionRedirect(redirectTo, { error: insertError.message }));
  }

  revalidatePath("/dashboard/usuarios");
  redirect(
    buildActionRedirect(redirectTo, {
      success:
        "Perfil interno creado. Si despues das de alta la cuenta en Auth con el mismo correo, se enlazara al iniciar sesion.",
    }),
  );
}

export async function updateUsuarioAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/usuarios");
  const hasAdminAccess = isSupabaseAdminConfigured();
  const parsed = UpdateUsuarioSchema.safeParse({
    id: formData.get("id"),
    authId: formData.get("authId") ? String(formData.get("authId")) : null,
    nombre: formData.get("nombre"),
    correo: formData.get("correo"),
    telefono: formData.get("telefono"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(
      buildActionRedirect(redirectTo, {
        error:
          parsed.error.issues[0]?.message ?? "Datos invalidos para actualizar el usuario.",
      }),
    );
  }

  const currentStaff = await requireCurrentStaffProfile();
  const supabase = await createSupabaseServerActionClient();

  if (parsed.data.authId && parsed.data.authId === currentStaff.auth_id && parsed.data.correo !== currentStaff.correo) {
    redirect(
      buildActionRedirect(redirectTo, {
        error: "No puedes cambiar tu propio correo desde esta pantalla.",
      }),
    );
  }

  if (hasAdminAccess && parsed.data.authId) {
    const admin = createSupabaseAdminClient();
    const updates: { email?: string; password?: string } = {};

    if (parsed.data.correo !== currentStaff.correo || parsed.data.authId !== currentStaff.auth_id) {
      updates.email = parsed.data.correo;
    }

    if (parsed.data.password) {
      updates.password = parsed.data.password;
    }

    if (Object.keys(updates).length > 0) {
      const { error: authError } = await admin.auth.admin.updateUserById(parsed.data.authId, updates);

      if (authError) {
        redirect(buildActionRedirect(redirectTo, { error: authError.message }));
      }
    }
  }

  const { error } = await supabase
    .from("usuarios")
    .update({
      nombre: parsed.data.nombre,
      correo: parsed.data.correo,
      telefono: parsed.data.telefono ?? null,
    })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  revalidatePath("/dashboard/usuarios");
  redirect(buildActionRedirect(redirectTo, { success: "Usuario actualizado correctamente." }));
}

export async function toggleUsuarioStatusAction(formData: FormData) {
  const redirectTo = getRedirectTarget(formData, "/dashboard/usuarios");
  const hasAdminAccess = isSupabaseAdminConfigured();
  const parsed = ToggleUsuarioSchema.safeParse({
    id: formData.get("id"),
    authId: formData.get("authId") ? String(formData.get("authId")) : null,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(buildActionRedirect(redirectTo, { error: "No se pudo cambiar el estado del usuario." }));
  }

  await requireCurrentStaffProfile();

  const nextStatus = parsed.data.status === 1 ? 0 : 1;
  const supabase = await createSupabaseServerActionClient();
  const { error } = await supabase
    .from("usuarios")
    .update({ status: nextStatus })
    .eq("id", parsed.data.id);

  if (error) {
    redirect(buildActionRedirect(redirectTo, { error: error.message }));
  }

  if (hasAdminAccess && parsed.data.authId) {
    const admin = createSupabaseAdminClient();
    const { error: authError } = await admin.auth.admin.updateUserById(parsed.data.authId, {
      ban_duration: nextStatus === 0 ? "876000h" : "none",
    });

    if (authError) {
      redirect(buildActionRedirect(redirectTo, { error: authError.message }));
    }
  }

  revalidatePath("/dashboard/usuarios");
  redirect(
    buildActionRedirect(redirectTo, {
      success: nextStatus === 1 ? "Usuario activado correctamente." : "Usuario desactivado correctamente.",
    }),
  );
}
