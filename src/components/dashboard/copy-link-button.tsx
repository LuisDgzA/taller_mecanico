"use client";

import { useState } from "react";

export function CopyLinkButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/seguimiento/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      className={`mt-4 w-full rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
        copied
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : "border-slate-300 hover:border-slate-950 hover:bg-slate-50"
      }`}
      onClick={handleCopy}
      type="button"
    >
      {copied ? "¡Link copiado!" : "Copiar link de seguimiento"}
    </button>
  );
}
