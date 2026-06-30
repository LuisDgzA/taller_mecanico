const STATUS_CONFIG = {
  0: { label: "Pendiente",   bg: "#73560014", color: "#735600" },
  1: { label: "En Progreso", bg: "#004ac614", color: "#004ac6" },
  2: { label: "Finalizado",  bg: "#00573314", color: "#005a33" },
  3: { label: "Entregado",   bg: "#43455614", color: "#434655" },
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
