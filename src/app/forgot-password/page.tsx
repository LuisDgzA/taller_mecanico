import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Wrench } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Recuperar acceso | Taller Mecánico",
};

export default function ForgotPasswordPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 py-12">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          <Wrench className="size-7 text-on-primary" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-on-surface">
          WorkshopPro
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Sistema de gestión del taller
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        <h2 className="mb-1 text-center text-base font-semibold text-on-surface">
          Restablecer contraseña
        </h2>
        <p className="mb-5 text-center text-sm text-on-surface-variant">
          Te enviaremos un enlace para recuperar el acceso.
        </p>

        {configured ? (
          <ResetPasswordForm />
        ) : (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
            Configura{" "}
            <code className="rounded bg-surface-container px-1 text-xs">
              .env.local
            </code>{" "}
            primero para habilitar el flujo con Supabase.
          </div>
        )}

        <div className="mt-5 text-center">
          <Link
            className="inline-flex items-center gap-1 text-sm text-primary"
            href="/login"
          >
            <ChevronLeft className="size-4" />
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    </main>
  );
}
