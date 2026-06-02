"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPwaButton({ mobile = false }: { mobile?: boolean }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    const installedHandler = () => setPrompt(null);

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  if (!prompt) return null;

  const handleInstall = async () => {
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  };

  if (mobile) {
    return (
      <button
        aria-label="Instalar app"
        className="rounded-2xl bg-white/10 p-2 text-slate-200 transition hover:bg-white/20"
        type="button"
        onClick={handleInstall}
      >
        <Download className="size-5" />
      </button>
    );
  }

  return (
    <button
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:text-white"
      type="button"
      onClick={handleInstall}
    >
      <Download className="size-4" />
      Instalar app
    </button>
  );
}
