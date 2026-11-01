'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Catches unexpected errors in any dashboard page so the shell (sidebar) stays
// usable and the user gets a friendly message instead of a crash.
export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
    toast.error('Something went wrong loading this page.');
  }, [error]);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertTriangle className="size-10 text-red-400" />
        <h2 className="text-lg font-semibold">Something went wrong</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          We hit a problem loading this page. Your data is safe — please try again.
        </p>
        <Button onClick={() => reset()} className="mt-2">
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
