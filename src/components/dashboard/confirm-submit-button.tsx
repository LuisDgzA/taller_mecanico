"use client";

import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

type ConfirmSubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> & {
  confirmMessage: string;
};

export function ConfirmSubmitButton({
  confirmMessage,
  onClick,
  children,
  ...props
}: ConfirmSubmitButtonProps) {
  const { pending } = useFormStatus();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) {
      return;
    }

    event.currentTarget.form?.requestSubmit();
  };

  return (
    <button {...props} disabled={pending || props.disabled} type="button" onClick={handleClick}>
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
