export default function Loading() {
  return (
    <>
      {/* PageHeader */}
      <div className="flex h-14 items-center border-b border-outline-variant px-4">
        <div className="h-5 w-28 animate-pulse rounded bg-surface-container" />
      </div>

      {/* Welcome */}
      <div className="border-b border-outline-variant px-4 py-4">
        <div className="h-5 w-40 animate-pulse rounded bg-surface-container" />
      </div>

      {/* Quick actions label */}
      <div className="h-8 animate-pulse bg-surface-container-low" />

      {/* Quick action grid */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex h-24 animate-pulse flex-col items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-4"
          >
            <div className="h-10 w-10 animate-pulse rounded-full bg-surface-container" />
            <div className="h-3 w-16 animate-pulse rounded bg-surface-container" />
          </div>
        ))}
      </div>

      {/* Recent activity label */}
      <div className="mt-2 h-8 animate-pulse bg-surface-container-low" />

      {/* Recent service items */}
      <div className="divide-y divide-outline-variant">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-14 animate-pulse rounded bg-surface-container" />
              <div className="h-4 w-28 animate-pulse rounded bg-surface-container" />
              <div className="ml-auto h-5 w-20 animate-pulse rounded-full bg-surface-container-low" />
            </div>
            <div className="h-3 w-24 animate-pulse rounded bg-surface-container-low" />
          </div>
        ))}
      </div>
    </>
  );
}
