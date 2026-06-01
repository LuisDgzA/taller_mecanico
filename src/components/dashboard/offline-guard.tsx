"use client";

import type { ReactNode } from "react";
import { WifiOff } from "lucide-react";

import { useNetworkStatus } from "@/lib/offline/use-network-status";

export function OfflineGuard({ children }: { children: ReactNode }) {
  const isOnline = useNetworkStatus();

  return (
    <>
      {children}
      {!isOnline && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-white/10 bg-slate-900 px-10 py-8 text-center shadow-2xl">
            <div className="flex size-16 items-center justify-center rounded-full bg-orange-500/15">
              <WifiOff className="size-8 text-orange-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-white">Sin conexión a internet</p>
              <p className="mt-1 max-w-xs text-sm text-slate-400">
                Verifica tu conexión para continuar usando el sistema.
              </p>
            </div>
            <div className="h-px w-full bg-white/10" />
            <p className="text-xs text-slate-500">
              Los cambios no se pueden guardar sin conexión.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
