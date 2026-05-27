import Link from "next/link";
import { Wrench, ClipboardList, Users, UserRound, ArrowRight, Gauge, Search } from "lucide-react";

import { getCurrentStaffProfile } from "@/lib/current-staff";

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

const milestones = [
  "Dashboard privado enlazado con la sesión real del personal.",
  "CRUD de usuarios con sincronización entre Auth y public.usuarios.",
  "Clientes con búsqueda, paginación y edición inline.",
  "Vehículos administrados dentro del detalle del cliente.",
  "Lookup de placas listo para reutilizarse en la fase de servicios.",
];

export default async function DashboardPage() {
  const staff = await getCurrentStaffProfile();

  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-6">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
          Fase 3 · Core Admin
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-balance">
          Operación central del taller
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          {staff?.nombre
            ? `${staff.nombre}, ya quedó lista la base administrativa para seguir con servicios en la siguiente fase. Desde aquí puedes administrar personal, clientes y vehículos sin salir del panel.`
            : "Ya quedó lista la base administrativa para seguir con servicios en la siguiente fase."}
        </p>
      </div>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#f97316_140%)] p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-orange-200/80">
                Resumen
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
                El panel ya cubre la operación administrativa base
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
                La migración ya no está solo en login: ahora también tiene módulos
                reales para capturar y mantener la información principal del taller.
              </p>
            </div>
            <div className="rounded-3xl bg-white/10 p-4">
              <Gauge className="size-8" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {milestones.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-slate-100"
              >
                {item}
              </div>
            ))}
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
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Search className="size-4" />
                Plate lookup listo
              </div>
              <p className="mt-2">
                La búsqueda por placa ya queda disponible dentro del detalle del cliente.
              </p>
            </div>
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
