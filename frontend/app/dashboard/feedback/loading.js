import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function FeedbackLoading() {
  return (
    <div aria-busy="true" aria-label="Loading feedback">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Card className="gap-0 divide-y divide-border py-0">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <Skeleton className="h-4 w-28 shrink-0" />
            <Skeleton className="hidden h-4 flex-1 md:block" />
            <Skeleton className="h-5 w-16 shrink-0" />
            <Skeleton className="ml-auto h-4 w-24 shrink-0 md:ml-0" />
          </div>
        ))}
      </Card>
    </div>
  );
}
