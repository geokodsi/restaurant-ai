import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function QrCodeLoading() {
  return (
    <div aria-busy="true" aria-label="Loading QR code">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-[32rem] max-w-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="flex flex-col items-center gap-5 py-6">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="size-[240px] sm:size-[300px]" />
            <Skeleton className="h-4 w-80 max-w-full" />
            <div className="flex w-full flex-wrap justify-center gap-2">
              <Skeleton className="h-9 w-36" />
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6">
            <Skeleton className="mx-auto h-[480px] w-[260px] rounded-[2rem]" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
