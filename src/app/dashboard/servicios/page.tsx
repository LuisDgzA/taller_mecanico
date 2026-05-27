import Link from "next/link";

export default function ServiciosPlaceholderPage() {
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-orange-700/70">
          Fase 4 pendiente
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          El módulo de servicios sigue después de esta fase
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
          La fase 3 ya dejó listo el core administrativo. En la siguiente etapa
          montamos alta de servicios, seguimiento, bitácora e imágenes.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/dashboard/clientes"
          >
            Ir a clientes
          </Link>
          <Link
            className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium transition hover:border-slate-950"
            href="/dashboard"
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
