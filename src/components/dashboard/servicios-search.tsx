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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="h-12 flex-1 rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
          placeholder="Buscar por placa o descripción…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(search, defaultStatus);
          }}
        />
        <button
          className="h-12 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400 sm:min-w-32"
          disabled={isPending}
          type="button"
          onClick={() => navigate(search, defaultStatus)}
        >
          Buscar
        </button>
      </div>

      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              className={`snap-start whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-medium transition ${
                defaultStatus === tab.value
                  ? "bg-slate-950 text-white"
                  : "border border-slate-300 bg-white hover:border-slate-950"
              }`}
              type="button"
              onClick={() => navigate(search, tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
