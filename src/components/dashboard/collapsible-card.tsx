"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleCardProps {
  label: string;
  title: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function CollapsibleCard({
  label,
  title,
  defaultOpen = true,
  children,
  className = "",
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        </div>
        <button
          aria-expanded={open}
          className="flex size-9 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-slate-400 xl:hidden"
          type="button"
          onClick={() => setOpen((v) => !v)}
        >
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      <div className={`mt-5 xl:!block ${open ? "block" : "hidden"}`}>
        {children}
      </div>
    </div>
  );
}
