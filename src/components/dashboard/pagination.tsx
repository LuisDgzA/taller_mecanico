import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
};

export function Pagination({ page, pageCount, buildHref }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-4 pb-2">
      <p className="text-xs text-on-surface-variant">
        Página {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            page <= 1
              ? "pointer-events-none border-outline-variant text-on-surface-variant/40"
              : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
          }`}
          href={buildHref(Math.max(1, page - 1))}
        >
          Anterior
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
            page >= pageCount
              ? "pointer-events-none border-outline-variant text-on-surface-variant/40"
              : "border-outline-variant text-on-surface hover:border-primary hover:text-primary"
          }`}
          href={buildHref(Math.min(pageCount, page + 1))}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
