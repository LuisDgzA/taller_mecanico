export default function Loading() {
  return (
    <>
      {/* PageHeader */}
      <div className="flex h-14 items-center border-b border-outline-variant px-4">
        <div className="h-5 w-36 animate-pulse rounded bg-surface-container" />
      </div>

      {/* Ficha general */}
      <div className="h-8 animate-pulse bg-surface-container-low" />
      <div className="divide-y divide-outline-variant">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-container-low" />
            <div className="mt-1.5 h-11 w-full animate-pulse rounded-lg bg-surface-container-low" />
          </div>
        ))}
        <div className="px-4 py-3">
          <div className="h-11 w-full animate-pulse rounded-lg bg-surface-container" />
        </div>
      </div>

      {/* Vehículos asociados */}
      <div className="mt-4 h-8 animate-pulse bg-surface-container-low" />
      <div className="divide-y divide-outline-variant">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-surface-container" />
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-28 animate-pulse rounded bg-surface-container" />
                <div className="ml-auto h-4 w-14 animate-pulse rounded bg-surface-container-low" />
              </div>
              <div className="h-3 w-20 animate-pulse rounded bg-surface-container-low" />
              <div className="mt-3 flex gap-2 border-t border-outline-variant pt-3">
                <div className="h-9 flex-1 animate-pulse rounded-lg bg-surface-container-low" />
                <div className="h-9 flex-1 animate-pulse rounded-lg bg-surface-container" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
