"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";

type Preview = { url: string; name: string };

export function FotosUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Preview[]>([]);

  const syncFromFiles = (files: File[]) => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews(files.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let files = Array.from(e.target.files ?? []);
    if (files.length > 5) {
      files = files.slice(0, 5);
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      e.target.files = dt.files;
    }
    syncFromFiles(files);
  };

  const removeImage = (index: number) => {
    if (!inputRef.current) return;
    const files = Array.from(inputRef.current.files ?? []).filter((_, i) => i !== index);
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    inputRef.current.files = dt.files;
    syncFromFiles(files);
  };

  return (
    <div>
      <label
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-outline-variant px-4 py-8 text-center transition hover:border-primary"
        htmlFor="fotos-input"
      >
        <Camera className="size-6 text-on-surface-variant" />
        <span className="text-sm font-medium text-on-surface-variant">
          {previews.length > 0 ? `${previews.length} foto${previews.length !== 1 ? "s" : ""} seleccionada${previews.length !== 1 ? "s" : ""}` : "Añadir"}
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
      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square">
              <img
                src={p.url}
                alt={p.name}
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
