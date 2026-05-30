"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type ServiceDetailTabsProps = {
  bitacoraCount: number;
  infoContent: React.ReactNode;
  bitacoraContent: React.ReactNode;
};

export function ServiceDetailTabs({
  bitacoraCount,
  infoContent,
  bitacoraContent,
}: ServiceDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"info" | "bitacora">("info");

  return (
    <>
      <div className="mt-8 flex rounded-[1.5rem] border border-slate-200 bg-slate-50 p-1 lg:hidden">
        <button
          className={cn(
            "flex-1 rounded-[1.15rem] px-4 py-3 text-sm font-medium transition",
            activeTab === "info"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500",
          )}
          type="button"
          onClick={() => setActiveTab("info")}
        >
          Información
        </button>
        <button
          className={cn(
            "flex-1 rounded-[1.15rem] px-4 py-3 text-sm font-medium transition",
            activeTab === "bitacora"
              ? "bg-white text-slate-950 shadow-sm"
              : "text-slate-500",
          )}
          type="button"
          onClick={() => setActiveTab("bitacora")}
        >
          Bitácora ({bitacoraCount})
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:items-start">
        <div className={cn(activeTab === "info" ? "block" : "hidden", "lg:block")}>
          {infoContent}
        </div>
        <div
          className={cn(
            activeTab === "bitacora" ? "block" : "hidden",
            "lg:block",
          )}
        >
          {bitacoraContent}
        </div>
      </div>
    </>
  );
}
