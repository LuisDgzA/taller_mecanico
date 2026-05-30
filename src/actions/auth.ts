"use server";

import { isAuthApiError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { createSupabaseServerActionClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

function getAuthErrorMessage(error: unknown) {
  if (isAuthApiError(error)) {
    switch (error.status) {
      case 400:
      case 401:
      case 403:
      case 422:
        return "Credenciales incorrectas o cuenta no disponible.";
      case 429:
        return "Demasiados intentos. Espera un momento e inténtalo otra vez.";
      default:
        return "No se pudo completar la autenticación en este momento.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Ocurrió un error inesperado al autenticar la sesión.";
}

async function safeSignOut() {
  const supabase = await createSupabaseServerActionClient();

  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore session cleanup failures so auth guards can continue gracefully.
  }
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const correo = String(formData.get("correo") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!correo || !password) {
    return { error: "Ingresa correo y contraseña." };
  }

  try {
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
      await safeSignOut();
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
      await safeSignOut();
      return { error: "Tu cuenta no tiene acceso al panel del taller." };
    }

    if (staffProfile.auth_id !== authUserId) {
      const { error: syncError } = await supabase
        .from("usuarios")
        .update({ auth_id: authUserId })
        .eq("id", staffProfile.id);

      if (syncError) {
        await safeSignOut();
        return {
          error: "No se pudo enlazar tu cuenta interna. Intenta de nuevo.",
        };
      }
    }
  } catch (error) {
    await safeSignOut();
    return { error: getAuthErrorMessage(error) };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  await safeSignOut();
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

  try {
    const supabase = await createSupabaseServerActionClient();

    await supabase.auth.resetPasswordForEmail(correo);

    return {
      success:
        "Si el correo existe, Supabase enviará instrucciones para restablecer la contraseña.",
    };
  } catch (error) {
    return { error: getAuthErrorMessage(error) };
  }
}
