"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const STATUS_TABS = [
  { value: "", label: "Todos" },
  { value: "0", label: "Pendiente" },
  { value: "1", label: "En Progreso" },
  { value: "2", label: "Finalizado" },
  { value: "3", label: "Entregado" },
];

export function ServiciosSearch({
  defaultSearch,
  defaultStatus,
}: {
  defaultSearch: string;
  defaultStatus: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultSearch);
  const [isPending, startTransition] = useTransition();

  const navigate = (newSearch: string, newStatus: string) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    if (newStatus) params.set("status", newStatus);
    startTransition(() => {
      router.push(`/dashboard/servicios?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <div className="flex flex-1 gap-2">
        <input
          className="h-11 flex-1 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
          placeholder="Buscar por placa o descripción…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(search, defaultStatus);
          }}
        />
        <button
          className="h-11 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
          disabled={isPending}
          onClick={() => navigate(search, defaultStatus)}
        >
          Buscar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              defaultStatus === tab.value
                ? "bg-slate-950 text-white"
                : "border border-slate-300 hover:border-slate-950"
            }`}
            onClick={() => navigate(search, tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
