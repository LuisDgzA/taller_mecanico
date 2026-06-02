"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          className="flex h-11 shrink-0 items-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950 disabled:opacity-50"
          disabled={isPending}
          type="button"
          onClick={() => navigate(search, defaultStatus)}
        >
          <Search className="size-4" />
          <span className="hidden sm:inline">Buscar</span>
        </button>
      </div>
      <select
        className="h-11 rounded-2xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-950"
        value={defaultStatus}
        onChange={(e) => navigate(search, e.target.value)}
      >
        {STATUS_TABS.map((tab) => (
          <option key={tab.value} value={tab.value}>
            {tab.label}
          </option>
        ))}
      </select>
    </div>
  );
}
