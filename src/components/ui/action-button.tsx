"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type ActionButtonProps = {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
};

export function ActionButton({ children, className, disabled }: ActionButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className} disabled={pending || disabled} type="submit">
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
