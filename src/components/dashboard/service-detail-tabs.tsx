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
    </>
  );
}
