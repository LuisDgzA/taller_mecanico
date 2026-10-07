export default function Loading() {
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex items-end justify-between border-b border-slate-200 pb-6">
        <div className="h-9 w-52 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-32 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 space-y-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
              <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-200" />
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50 p-5">
            <div className="h-3 w-28 animate-pulse rounded bg-emerald-200" />
            <div className="mt-2 h-5 w-44 animate-pulse rounded bg-emerald-200" />
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-64 w-full animate-pulse rounded-2xl bg-slate-50" />
          <div className="mt-4 h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    </main>
  );
}
