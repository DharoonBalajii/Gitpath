export function SkeletonCard() {
  return (
    <div className="border border-border rounded-xl p-5 bg-card space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-full" />
      <div className="h-3 bg-muted rounded w-2/3" />
      <div className="h-2 bg-muted rounded w-full mt-4" />
    </div>
  );
}
