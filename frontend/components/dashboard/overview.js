'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Link2, MessageSquareText, ThumbsDown, ThumbsUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  positive: { label: 'Positive', color: 'var(--color-emerald-500)' },
  negative: { label: 'Negative', color: 'var(--color-red-500)' },
};

// Bucket rows into the last 7 days in the viewer's local timezone (today and
// the 6 days before it) and compute the stat-card totals over the same window.
function summarize(rows) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    days.push({
      key: day.toDateString(),
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      fullLabel: day.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
      positive: 0,
      negative: 0,
    });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));

  const totals = { total: 0, positive: 0, negative: 0, reviewLinks: 0 };
  for (const row of rows ?? []) {
    const created = new Date(row?.created_at);
    if (Number.isNaN(created.getTime())) continue;
    const bucket = byKey.get(new Date(created).toDateString());
    if (!bucket) continue;

    totals.total += 1;
    if (row.sentiment === 'positive') {
      totals.positive += 1;
      bucket.positive += 1;
    } else if (row.sentiment === 'negative') {
      totals.negative += 1;
      bucket.negative += 1;
    }
    if (row.review_link_sent) totals.reviewLinks += 1;
  }

  return { days, totals };
}

function StatCard({ title, value, icon: Icon, hint, accent }) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wide sm:text-sm sm:normal-case sm:tracking-normal">
          {title}
        </CardDescription>
        <Icon className={accent ?? 'size-4 text-muted-foreground'} />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function Overview({ rows }) {
  const { days, totals } = useMemo(() => summarize(rows), [rows]);
  const positiveRate = totals.total ? Math.round((totals.positive / totals.total) * 100) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          title="Feedback this week"
          value={totals.total}
          icon={MessageSquareText}
          hint="Last 7 days"
        />
        <StatCard
          title="Positive"
          value={totals.positive}
          icon={ThumbsUp}
          accent="size-4 text-emerald-400"
          hint={positiveRate === null ? 'No feedback yet' : `${positiveRate}% of feedback`}
        />
        <StatCard
          title="Negative"
          value={totals.negative}
          icon={ThumbsDown}
          accent="size-4 text-red-400"
          hint="Your manager follows up"
        />
        <StatCard
          title="Review links sent"
          value={totals.reviewLinks}
          icon={Link2}
          accent="size-4 text-emerald-400"
          hint="Happy guests sent to Google"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feedback over the last 7 days</CardTitle>
          <CardDescription>Daily messages by sentiment</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {totals.total === 0 ? (
            <div className="flex h-[240px] flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium">No feedback yet this week</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                When customers message your WhatsApp number, their feedback shows up here.
              </p>
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
              <BarChart data={days} margin={{ left: -20, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ''}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="positive"
                  stackId="sentiment"
                  fill="var(--color-positive)"
                  radius={[0, 0, 4, 4]}
                />
                <Bar
                  dataKey="negative"
                  stackId="sentiment"
                  fill="var(--color-negative)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
