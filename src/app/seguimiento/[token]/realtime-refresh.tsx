"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RealtimeRefresh({ servicioId }: { servicioId: number }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`seguimiento-${servicioId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "servicios",
          filter: `id=eq.${servicioId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bitacoras",
          filter: `servicio_id=eq.${servicioId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [servicioId, router]);

  return null;
}
