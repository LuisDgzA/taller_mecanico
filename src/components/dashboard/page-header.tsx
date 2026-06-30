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
    <header className="sticky top-0 z-40 flex h-12 items-center gap-1 border-b border-outline-variant bg-surface px-2">
      {backHref && (
        <Link
          href={backHref}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface transition-colors active:bg-surface-container"
          aria-label="Volver"
        >
          <ChevronLeft className="size-5" />
        </Link>
      )}
      <h1
        className={cn(
          "flex-1 truncate text-base font-semibold tracking-tight text-on-surface",
          !backHref && "pl-3",
        )}
      >
        {title}
      </h1>
      {action && <div className="shrink-0 pr-1">{action}</div>}
    </header>
  );
}

