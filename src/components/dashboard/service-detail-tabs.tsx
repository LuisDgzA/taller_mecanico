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
      {/* ── Mobile: tabs + single panel ── */}
      <div className="lg:hidden">
        <div className="flex border-b border-outline-variant">
          <button
            type="button"
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "info"
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant",
            )}
            onClick={() => setActiveTab("info")}
          >
            Información
          </button>
          <button
            type="button"
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors",
              activeTab === "bitacora"
                ? "border-b-2 border-primary text-primary"
                : "text-on-surface-variant",
            )}
            onClick={() => setActiveTab("bitacora")}
          >
            Bitácora ({bitacoraCount})
          </button>
        </div>
        <div>
          {activeTab === "info" ? infoContent : bitacoraContent}
        </div>
      </div>

      {/* ── Desktop: two columns ── */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start lg:px-8 lg:py-6">
        <div className="rounded-2xl border border-outline-variant overflow-hidden bg-surface-container-lowest">
          {infoContent}
        </div>
        <div className="rounded-2xl border border-outline-variant overflow-hidden bg-surface-container-lowest">
          {bitacoraContent}
        </div>
      </div>
    </>
  );
}
