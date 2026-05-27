import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Recuperar acceso | Taller Mecánico",
};

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#111827_0%,#1f2937_42%,#f97316_160%)] px-6 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950/70 p-7 text-white shadow-2xl backdrop-blur">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-orange-300/80">
            Recuperación
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Restablecer contraseña
          </h1>
          <p className="text-sm leading-6 text-slate-300">
            Te enviaremos un enlace para recuperar el acceso del taller.
          </p>
        </div>

        <div className="mt-6">
          {configured ? (
            <ResetPasswordForm />
          ) : (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              Configura `.env.local` primero para habilitar el flujo con
              Supabase.
            </div>
          )}
        </div>

        <div className="mt-6">
          <Link
            className="text-sm font-medium text-orange-300 underline-offset-4 hover:underline"
            href="/login"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
