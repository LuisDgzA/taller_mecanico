"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { dashboardNavItems } from "./navigation-items";

type BottomNavProps = {
  className?: string;
};

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn("fixed inset-x-0 bottom-0 z-50 px-4 pb-4", className)}>
      <nav className="bottom-nav-safe mx-auto flex max-w-md items-stretch rounded-[1.75rem] border border-slate-900/10 bg-slate-950 px-2 pt-2 text-white shadow-[0_24px_60px_-36px_rgba(15,23,42,0.9)]">
        {dashboardNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              className={cn(
                "relative flex min-h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 pb-2 pt-3 text-xs font-medium transition",
                active
                  ? "text-orange-400"
                  : "text-slate-400 hover:text-slate-200",
              )}
              href={item.href}
            >
              <span
                className={cn(
                  "absolute top-1 size-1.5 rounded-full bg-transparent transition",
                  active && "bg-orange-400",
                )}
              />
              <Icon className="size-[1.15rem]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
