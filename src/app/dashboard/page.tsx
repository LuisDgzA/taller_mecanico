import Link from "next/link";
import { Wrench, ClipboardList, Users, UserRound, ArrowRight, Gauge } from "lucide-react";

const cards = [
  {
    href: "/dashboard/servicios/nuevo",
    title: "Agregar Servicio",
    description: "Registra el ingreso de una moto y sus evidencias iniciales.",
    icon: Wrench,
    accent: "from-orange-500 to-amber-300",
  },
  {
    href: "/dashboard/servicios",
    title: "Continuar Servicio",
    description: "Consulta servicios activos y actualiza su progreso.",
    icon: ClipboardList,
    accent: "from-sky-500 to-cyan-300",
  },
  {
    href: "/dashboard/usuarios",
    title: "Usuarios",
    description: "Administra las cuentas internas del personal.",
    icon: Users,
    accent: "from-violet-500 to-fuchsia-300",
  },
  {
    href: "/dashboard/clientes",
    title: "Clientes",
    description: "Gestiona clientes, vehículos y futuros links del portal.",
    icon: UserRound,
    accent: "from-emerald-500 to-lime-300",
  },
];

export default function DashboardPage() {
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Operación central del taller
        </h1>
      </div>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#f97316_140%)] p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-balance">
                Panel administrativo
              </h2>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <Gauge className="size-8" />
            </div>
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
            Atajos utiles
          </p>
          <div className="mt-4 space-y-3">
            <Link
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-medium transition hover:border-slate-950"
              href="/dashboard/clientes"
            >
              Buscar cliente o registrar uno nuevo
              <ArrowRight className="size-4" />
            </Link>
            <Link
              className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-sm font-medium transition hover:border-slate-950"
              href="/dashboard/usuarios"
            >
              Revisar personal activo e inactivo
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <Link
              key={card.href}
              className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              href={card.href}
            >
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`}
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {card.title}
                  </h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950 p-3 text-white transition group-hover:scale-105">
                  <Icon className="size-5" />
                </div>
              </div>
            </Link>
          );
        })}
      </section>
    </main>
  );
}
