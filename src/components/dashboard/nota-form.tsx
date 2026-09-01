"use client";

import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";

type Preview = { file: File; url: string };

const MAX_FOTOS = 4;

type NotaFormProps = {
  servicioId: number;
  action: (formData: FormData) => Promise<void>;
};

export function NotaForm({ servicioId, action }: NotaFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Preview[]>([]);

  const syncInput = (previews: Preview[]) => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    previews.forEach((p) => dt.items.add(p.file));
    inputRef.current.files = dt.files;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    setItems((prev) => {
      const merged = [...prev];
      for (const file of incoming) {
        if (merged.length >= MAX_FOTOS) break;
        const isDupe = merged.some(
          (p) => p.file.name === file.name && p.file.size === file.size,
        );
        if (!isDupe) merged.push({ file, url: URL.createObjectURL(file) });
      }
      syncInput(merged);
      return merged;
    });
  };

  const removeImage = (index: number) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].url);
      const next = prev.filter((_, i) => i !== index);
      syncInput(next);
      return next;
    });
  };

  return (
    <form action={action} className="space-y-3 px-4 py-4">
      <input name="servicioId" type="hidden" value={servicioId} />
      <textarea
        className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary"
        minLength={5}
        name="descripcion"
        placeholder="Describe el trabajo realizado…"
        required
        rows={4}
      />

      {/* File picker */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-on-surface-variant">
            Fotografías (máx. {MAX_FOTOS} · JPG, PNG o WebP)
          </span>
          {items.length < MAX_FOTOS && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs font-medium text-primary"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-3.5" />
              Agregar
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          accept="image/*"
          className="hidden"
          multiple
          name="imagenes"
          type="file"
          onChange={handleChange}
        />

        {/* Previews grid + add tile */}
        {items.length > 0 ? (
          <div className="mt-2 grid grid-cols-4 gap-2">
            {items.map((p, i) => (
              <div key={p.url} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.file.name}
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-xs leading-none shadow"
                  onClick={() => removeImage(i)}
                  aria-label="Eliminar imagen"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {items.length < MAX_FOTOS && (
              <button
                type="button"
                className="aspect-square rounded-lg border border-dashed border-outline-variant bg-surface-container-low text-on-surface-variant transition hover:border-primary flex flex-col items-center justify-center gap-1"
                onClick={() => inputRef.current?.click()}
                aria-label="Agregar más fotos"
              >
                <ImagePlus className="size-4" />
                <span className="text-[10px]">Agregar</span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-4 py-5 text-xs text-on-surface-variant transition hover:border-primary"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="size-4" />
            Toca para agregar fotos
          </button>
        )}
      </div>

      <ActionButton className="h-11 w-full rounded-lg bg-primary text-sm font-semibold text-on-primary transition disabled:opacity-60">
        Agregar nota
      </ActionButton>
    </form>
  );
}
