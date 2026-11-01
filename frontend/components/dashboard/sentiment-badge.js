import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function SentimentBadge({ sentiment, className }) {
  if (sentiment === 'positive') {
    return (
      <Badge className={cn('border-emerald-500/30 bg-emerald-500/15 text-emerald-400', className)}>
        Positive
      </Badge>
    );
  }
  if (sentiment === 'negative') {
    return (
      <Badge className={cn('border-red-500/30 bg-red-500/15 text-red-400', className)}>
        Negative
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={cn('text-muted-foreground', className)}>
      Unknown
    </Badge>
  );
}
