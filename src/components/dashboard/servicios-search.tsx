"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

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
    <div className={cn("transition-opacity", isPending && "opacity-50")}>
      <div className="flex gap-2 overflow-x-auto px-4 lg:px-8 py-3 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => navigate(search, tab.value)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              defaultStatus === tab.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4 lg:px-8 pb-3">
        <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-on-surface-variant" />
        <input
          className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-4 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
          placeholder="Buscar por placa o descripción…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") navigate(search, defaultStatus);
          }}
        />
        </div>
      </div>
    </div>
  );
}
