export default function Loading() {
  return (
    <>
      {/* PageHeader */}
      <div className="flex h-14 items-center border-b border-outline-variant px-4">
        <div className="h-5 w-20 animate-pulse rounded bg-surface-container" />
      </div>

      {/* Section label */}
      <div className="h-8 animate-pulse bg-surface-container-low" />
      <div className="px-4 py-3">
        <div className="h-4 w-64 animate-pulse rounded bg-surface-container-low" />
      </div>

      {/* User search card */}
      <div className="mx-4 mt-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
        <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
        <div className="mt-2 h-10 w-full animate-pulse rounded-lg bg-surface-container-low" />
        <div className="mt-4 h-12 w-full animate-pulse rounded-lg border border-outline-variant bg-surface-container-low" />
      </div>

      {/* Modules label */}
      <div className="mt-3 h-8 animate-pulse bg-surface-container-low" />

      {/* Module cards */}
      <div className="grid gap-3 px-4 py-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex h-16 items-center gap-3 animate-pulse rounded-2xl border border-outline-variant bg-surface-container-lowest px-4"
          >
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-surface-container" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded bg-surface-container" />
              <div className="h-3 w-16 animate-pulse rounded bg-surface-container-low" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
