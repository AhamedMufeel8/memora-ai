export const Skeleton = ({ className = '', count = 1 }) => {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse bg-slate-200 dark:bg-slate-700/60 rounded ${className}`}
        />
      ))}
    </>
  );
};

export const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32" count={3} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-96 lg:col-span-2" />
        <Skeleton className="h-96" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-20" count={2} />
        </div>
      </div>
    </div>
  );
};

export const SummarySkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" count={4} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Skeleton className="h-24" count={3} />
      </div>
    </div>
  );
};

export const ChatSkeleton = () => {
  return (
    <div className="space-y-4 py-4">
      <div className="flex justify-start">
        <div className="flex gap-3 max-w-[70%]">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <div className="flex gap-3 max-w-[70%] justify-end">
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        </div>
      </div>
      <div className="flex justify-start">
        <div className="flex gap-3 max-w-[70%]">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-64" />
          </div>
        </div>
      </div>
    </div>
  );
};
