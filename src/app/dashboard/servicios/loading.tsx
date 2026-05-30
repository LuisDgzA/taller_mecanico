function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-3">
          <div className="h-7 w-24 animate-pulse rounded-full bg-slate-200" />
          <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-4 h-4 w-56 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

export default function Loading() {
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="border-b border-slate-200 pb-6">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-9 w-40 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="mt-6 space-y-4">
        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-100" />
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-11 w-28 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </main>
  );
}
