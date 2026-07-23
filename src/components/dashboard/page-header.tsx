import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  backHref?: string;
  action?: ReactNode;
};

export function PageHeader({ title, backHref, action }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-12 lg:h-16 items-center gap-1 border-b border-outline-variant bg-surface px-2 lg:px-6">
      {backHref && (
        <>
          {/* Botón circular — solo mobile */}
          <Link
            href={backHref}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors active:bg-surface-container lg:hidden"
            aria-label="Volver"
          >
            <ChevronLeft className="size-5" />
          </Link>
          {/* Link textual — solo desktop */}
          <Link
            href={backHref}
            className="hidden lg:flex items-center gap-0.5 mr-3 shrink-0 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <ChevronLeft className="size-4" />
            Volver
          </Link>
        </>
      )}
      <h1
        className={cn(
          "flex-1 truncate text-base lg:text-lg font-semibold tracking-tight text-on-surface",
          !backHref && "pl-3 lg:pl-0",
        )}
      >
        {title}
      </h1>
      {action && <div className="shrink-0 pr-1 lg:pr-0">{action}</div>}
    </header>
  );
}
