export default function Loading() {
  return (
    <main className="flex-1 px-6 py-8 sm:px-8">
      <div className="border-b border-slate-200 pb-6">
        <div className="h-4 w-16 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-9 w-40 animate-pulse rounded bg-slate-200" />
      </div>

      <section className="mt-8 grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-11 w-full animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-11 w-full animate-pulse rounded-2xl bg-slate-100" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-200 p-5"
              >
                <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
                <div className="mt-3 h-4 w-32 animate-pulse rounded bg-slate-100" />
                <div className="mt-4 h-20 animate-pulse rounded-2xl bg-slate-50" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
