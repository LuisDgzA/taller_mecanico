import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

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

    if (staff) {
      redirect("/dashboard");
    }
  }

  const params = await searchParams;
  const configured = isSupabaseConfigured();
  const setupMode = params.setup === "1" || !configured;

  return (
    <main className="flex min-h-screen bg-[radial-gradient(circle_at_top,#f59e0b_0%,#f6f3ee_38%,#e7e0d4_100%)] text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-10 px-6 py-10 lg:flex-row lg:px-10">
        <div className="flex max-w-2xl flex-1 flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center rounded-full border border-amber-900/15 bg-white/70 px-4 py-1 text-sm font-medium text-amber-950 shadow-sm backdrop-blur">
              Migración Flutter → Next.js + Supabase
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-900/70">
                Bros Valley Workshop
              </p>
              <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Controla servicios, clientes y entregas desde una sola cabina.
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
                Esta base ya quedó preparada para autenticación con Supabase,
                guardas de rutas y el dashboard administrativo del taller.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Servicios", "Recepción, seguimiento y entrega."],
              ["Clientes", "Historial y vehículos vinculados."],
              ["Portal", "Base lista para acceso público por token."],
            ].map(([title, copy]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/60 bg-white/60 p-4 shadow-sm backdrop-blur"
              >
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-md shrink-0">
          <div className="rounded-[2rem] border border-slate-900/10 bg-white/90 p-7 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Iniciar sesión
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Usa la cuenta del personal para entrar al panel privado.
              </p>
            </div>

            {setupMode ? (
              <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Falta configurar Supabase.</p>
                <p>
                  Crea tu archivo `.env.local` con
                  ` NEXT_PUBLIC_SUPABASE_URL` y
                  `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
                </p>
                <p>
                  Cuando eso esté listo, el login real empezará a funcionar con
                  las acciones ya preparadas.
                </p>
              </div>
            ) : (
              <LoginForm />
            )}

            <div className="mt-6 flex items-center justify-between gap-3 text-sm text-slate-600">
              <Link
                className="font-medium text-amber-950 underline-offset-4 hover:underline"
                href="/forgot-password"
              >
                Olvidé mi contraseña
              </Link>
              <span>Acceso solo para personal</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
