import Link from "next/link";

type PaginationProps = {
  page: number;
  pageCount: number;
  buildHref: (page: number) => string;
};

export function Pagination({ page, pageCount, buildHref }: PaginationProps) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      <p className="text-sm text-slate-500">
        Pagina {page} de {pageCount}
      </p>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
            page <= 1
              ? "pointer-events-none border-slate-200 text-slate-300"
              : "border-slate-300 text-slate-700 hover:border-slate-950 hover:text-slate-950"
          }`}
          href={buildHref(Math.max(1, page - 1))}
        >
          Anterior
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
            page >= pageCount
              ? "pointer-events-none border-slate-200 text-slate-300"
              : "border-slate-300 text-slate-700 hover:border-slate-950 hover:text-slate-950"
          }`}
          href={buildHref(Math.min(pageCount, page + 1))}
        >
          Siguiente
        </Link>
      </div>
    </div>
  );
}
