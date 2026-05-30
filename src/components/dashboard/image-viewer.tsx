"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import { cn } from "@/lib/utils";

type ImageViewerProps = {
  images: string[];
  altPrefix?: string;
  className?: string;
  columnsClassName?: string;
};

export function ImageViewer({
  images,
  altPrefix = "Imagen",
  className,
  columnsClassName,
}: ImageViewerProps) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (index === null) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIndex(null);
      }

      if (event.key === "ArrowRight") {
        setIndex((current) =>
          current === null ? current : (current + 1) % images.length,
        );
      }

      if (event.key === "ArrowLeft") {
        setIndex((current) =>
          current === null ? current : (current - 1 + images.length) % images.length,
        );
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [images.length, index]);

  if (images.length === 0) {
    return null;
  }

  return (
    <>
      <div className={cn("grid gap-2", columnsClassName, className)}>
        {images.map((url, imageIndex) => (
          <button
            key={`${url}-${imageIndex}`}
            className="overflow-hidden rounded-2xl"
            type="button"
            onClick={() => setIndex(imageIndex)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`${altPrefix} ${imageIndex + 1}`}
              className="aspect-square w-full object-cover transition hover:scale-[1.02]"
              src={url}
            />
          </button>
        ))}
      </div>

      {index !== null ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            type="button"
            onClick={() => setIndex(null)}
          >
            <X className="size-5" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                className="absolute left-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                type="button"
                onClick={() =>
                  setIndex((current) =>
                    current === null ? current : (current - 1 + images.length) % images.length,
                  )
                }
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
                type="button"
                onClick={() =>
                  setIndex((current) =>
                    current === null ? current : (current + 1) % images.length,
                  )
                }
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={`${altPrefix} ${index + 1}`}
            className="max-h-[88vh] max-w-full rounded-3xl object-contain"
            src={images[index]}
          />
        </div>
      ) : null}
    </>
  );
}
