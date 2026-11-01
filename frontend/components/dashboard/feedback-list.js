'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { LocalTime } from '@/components/local-time';
import { SentimentBadge } from '@/components/dashboard/sentiment-badge';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function preview(text, max = 90) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return '(no message)';
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function FeedbackList({ rows }) {
  const router = useRouter();

  return (
    <>
      {/* Desktop / tablet: table with clickable rows */}
      <Card className="hidden overflow-hidden py-0 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Customer</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Sentiment</TableHead>
              <TableHead className="pr-4 text-right">Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const href = `/dashboard/feedback/${row.id}`;
              return (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => router.push(href)}
                >
                  <TableCell className="pl-4 font-medium tabular-nums">
                    {/* Real link for keyboard users and middle-click. */}
                    <Link href={href} onClick={(e) => e.stopPropagation()} className="hover:underline">
                      {row.customer_phone || 'Unknown'}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground">
                    {preview(row.customer_message)}
                  </TableCell>
                  <TableCell>
                    <SentimentBadge sentiment={row.sentiment} />
                  </TableCell>
                  <TableCell className="pr-4 text-right text-muted-foreground">
                    <LocalTime value={row.created_at} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: stacked cards */}
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/dashboard/feedback/${row.id}`}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium tabular-nums">
                    {row.customer_phone || 'Unknown'}
                  </span>
                  <SentimentBadge sentiment={row.sentiment} />
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {preview(row.customer_message, 140)}
                </p>
                <LocalTime value={row.created_at} className="block text-xs text-muted-foreground" />
              </div>
              <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
