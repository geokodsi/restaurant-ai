import Link from 'next/link';
import { AlertTriangle, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorToast } from './error-toast';

export { SentimentBadge } from './sentiment-badge';

export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// Shown when the signed-in user has no restaurant row yet.
export function NoRestaurant() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <Store className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Finish setting up your restaurant</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Add your restaurant name, Google review link and WhatsApp number to start
          collecting feedback.
        </p>
        <Button asChild className="mt-2">
          <Link href="/dashboard/settings">Go to settings</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Inline notice + toast for a failed data load.
export function LoadError({ message = "We couldn't load your data. Please refresh the page." }) {
  return (
    <>
      <ErrorToast message={message} />
      <Card className="border-red-500/30">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-red-300">
          <AlertTriangle className="size-4 shrink-0" />
          {message}
        </CardContent>
      </Card>
    </>
  );
}
