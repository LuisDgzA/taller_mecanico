export default function Loading() {
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="flex items-end justify-between border-b border-slate-200 pb-6">
        <div className="h-9 w-40 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-24 animate-pulse rounded-2xl bg-slate-100" />
      </div>

      <div className="mx-auto mt-8 max-w-2xl space-y-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-11 w-full animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-3 h-11 w-full animate-pulse rounded-2xl bg-slate-100" />
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-11 w-full animate-pulse rounded-2xl bg-slate-100" />
        </div>

        <div className="h-12 w-full animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </main>
  );
}
