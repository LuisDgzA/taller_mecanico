"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const correo = String(formData.get("correo") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!correo || !password) {
    return { error: "Ingresa correo y contraseña." };
  }

  const supabase = await createSupabaseServerActionClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo,
    password,
  });

  if (error) {
    return { error: "Credenciales incorrectas o cuenta no disponible." };
  }

  const authUserId = data.user?.id;

  if (!authUserId) {
    await supabase.auth.signOut();
    return { error: "No se pudo validar la cuenta del personal." };
  }

  const { data: staffProfile, error: profileError } = await supabase
    .from("usuarios")
    .select("id, auth_id, correo, status")
    .or(`auth_id.eq.${authUserId},correo.eq.${correo}`)
    .maybeSingle<{
      id: number;
      auth_id: string | null;
      correo: string;
      status: number;
    }>();

  if (profileError || !staffProfile || staffProfile.status !== 1) {
    await supabase.auth.signOut();
    return { error: "Tu cuenta no tiene acceso al panel del taller." };
  }

  if (staffProfile.auth_id !== authUserId) {
    const { error: syncError } = await supabase
      .from("usuarios")
      .update({ auth_id: authUserId })
      .eq("id", staffProfile.id);

    if (syncError) {
      await supabase.auth.signOut();
      return {
        error: "No se pudo enlazar tu cuenta interna. Intenta de nuevo.",
      };
    }
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerActionClient();

  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const correo = String(formData.get("correo") ?? "").trim();

  if (!correo) {
    return { error: "Ingresa un correo válido." };
  }

  const supabase = await createSupabaseServerActionClient();

  await supabase.auth.resetPasswordForEmail(correo);

  return {
    success:
      "Si el correo existe, Supabase enviará instrucciones para restablecer la contraseña.",
  };
}
