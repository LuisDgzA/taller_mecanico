const STATUS_CONFIG = {
  0: { label: "Pendiente",   bg: "#FEF3C7", color: "#92400E" },
  1: { label: "En Progreso", bg: "#DBEAFE", color: "#1E40AF" },
  2: { label: "Finalizado",  bg: "#D1FAE5", color: "#065F46" },
  3: { label: "Entregado",   bg: "#E0E7FF", color: "#3730A3" },
} as const;

type ServicioStatus = keyof typeof STATUS_CONFIG;

export function ServicioStatusBadge({ status }: { status: number }) {
  const config = STATUS_CONFIG[status as ServicioStatus] ?? STATUS_CONFIG[0];

  return (
    <span
      className="shrink-0 rounded px-2 py-0.5 text-xs font-medium"
      style={{ background: config.bg, color: config.color }}
    >
      {config.label}
    </span>
  );
}
