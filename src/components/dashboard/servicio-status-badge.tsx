const STATUS_CONFIG = {
  0: { label: "Pendiente", className: "bg-orange-100 text-orange-700" },
  1: { label: "En Progreso", className: "bg-blue-100 text-blue-700" },
  2: { label: "Finalizado", className: "bg-emerald-100 text-emerald-700" },
  3: { label: "Entregado", className: "bg-slate-200 text-slate-600" },
} as const;

type ServicioStatus = keyof typeof STATUS_CONFIG;

export function ServicioStatusBadge({ status }: { status: number }) {
  const config = STATUS_CONFIG[status as ServicioStatus] ?? STATUS_CONFIG[0];

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}
