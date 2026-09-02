"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";

import { compressImage } from "@/lib/compress-image";

type Preview = { file: File; url: string };

const MAX_FOTOS = 5;

export function FotosUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Preview[]>([]);

  const syncInput = (previews: Preview[]) => {
    if (!inputRef.current) return;
    const dt = new DataTransfer();
    previews.forEach((p) => dt.items.add(p.file));
    inputRef.current.files = dt.files;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);

    setItems((prev) => {
      // Reset input while we process — will be re-synced after compression
      if (inputRef.current) inputRef.current.value = "";
      return prev;
    });

    const compressed = await Promise.all(incoming.map(compressImage));

    setItems((prev) => {
      const merged = [...prev];
      for (const file of compressed) {
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
    <div>
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant px-4 py-8 text-center transition hover:border-primary"
        htmlFor="fotos-input"
      >
        <Camera className="size-6 text-on-surface-variant" />
        <span className="text-sm font-medium text-on-surface-variant">
          {items.length > 0
            ? `${items.length} foto${items.length !== 1 ? "s" : ""} seleccionada${items.length !== 1 ? "s" : ""}`
            : "Añadir"}
        </span>
      </label>
      <input
        ref={inputRef}
        accept="image/*"
        className="hidden"
        id="fotos-input"
        multiple
        name="imagenes"
        type="file"
        onChange={handleChange}
      />
      {items.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {items.map((p, i) => (
            <div key={p.url} className="relative aspect-square">
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
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
