"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Toaster, toast } from "sonner";

export function AppFeedbackToaster() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const success = searchParams.get("success")?.trim();
    const error = searchParams.get("error")?.trim();

    if (!success && !error) {
      lastKeyRef.current = "";
      return;
    }

    const key = `${pathname}|${success ?? ""}|${error ?? ""}`;
    if (lastKeyRef.current === key) {
      return;
    }

    lastKeyRef.current = key;

    if (success) {
      toast.success(success);
    }

    if (error) {
      toast.error(error);
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("success");
    params.delete("error");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <Toaster
      closeButton
      position="top-center"
      richColors
      toastOptions={{
        className: "font-sans",
      }}
    />
  );
}
