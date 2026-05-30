export default function Loading() {
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="border-b border-slate-200 pb-6">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-9 w-52 animate-pulse rounded bg-slate-200" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.6fr]">
        <div className="space-y-5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-7 w-28 animate-pulse rounded-full bg-slate-200" />
              <div className="mt-4 h-4 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-28 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-200 p-5"
                >
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-full animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
