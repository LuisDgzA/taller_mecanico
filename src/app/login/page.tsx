import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Wrench } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";
import { getCurrentStaffProfile } from "@/lib/current-staff";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Iniciar sesión | Taller Mecánico",
};

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (isSupabaseConfigured()) {
    const staff = await getCurrentStaffProfile();
    if (staff) redirect("/dashboard");
  }

  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const setupMode = params.setup === "1" || !configured;

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

      {/* Form card */}
      <div className="w-full max-w-sm">
        <h2 className="mb-5 text-center text-base font-semibold text-on-surface">
          Iniciar sesión
        </h2>

        {setupMode ? (
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 text-sm text-on-surface-variant">
            <p className="font-semibold text-on-surface">
              Falta configurar Supabase.
            </p>
            <p className="mt-2">
              Crea tu archivo{" "}
              <code className="rounded bg-surface-container px-1 text-xs">
                .env.local
              </code>{" "}
              con{" "}
              <code className="rounded bg-surface-container px-1 text-xs">
                NEXT_PUBLIC_SUPABASE_URL
              </code>{" "}
              y{" "}
              <code className="rounded bg-surface-container px-1 text-xs">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>
              .
            </p>
          </div>
        ) : (
          <LoginForm />
        )}

        <div className="mt-5 flex items-center justify-between text-sm">
          <Link className="text-primary" href="/forgot-password">
            Olvidé mi contraseña
          </Link>
          <span className="text-on-surface-variant">Solo personal</span>
        </div>
      </div>
    </main>
  );
}
