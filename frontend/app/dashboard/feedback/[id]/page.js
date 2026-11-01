import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle2, Phone, User, XCircle } from 'lucide-react';
import { getFeedback } from '@/lib/data';
import { LoadError, SentimentBadge } from '@/components/dashboard/common';
import { LocalTime } from '@/components/local-time';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata = { title: 'Feedback detail — RepAI' };

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
      <Link href="/dashboard/feedback">
        <ArrowLeft />
        All feedback
      </Link>
    </Button>
  );
}

export default async function FeedbackDetailPage({ params }) {
  const { id } = await params;
  const { feedback, error } = await getFeedback(id);

  if (error) {
    return (
      <>
        <BackLink />
        <LoadError message="We couldn't load this feedback. Please refresh the page." />
      </>
    );
  }

  if (!feedback) {
    return (
      <>
        <BackLink />
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">Feedback not found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              It may have been deleted, or it belongs to another restaurant.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <BackLink />
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Feedback</h1>
        <SentimentBadge sentiment={feedback.sentiment} className="self-start sm:self-auto" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="size-4 text-muted-foreground" />
                Customer message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words leading-7">
                {feedback.customer_message || (
                  <span className="text-muted-foreground">(no message)</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="size-4 text-primary" />
                RepAI reply
              </CardTitle>
              <CardDescription>Sent automatically over WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap break-words leading-7">
                {feedback.ai_reply || (
                  <span className="text-muted-foreground">No reply was sent.</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium tabular-nums">
                  <Phone className="size-4 text-muted-foreground" />
                  {feedback.customer_phone || 'Unknown'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Received</dt>
                <dd className="mt-1 font-medium">
                  <LocalTime value={feedback.created_at} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sentiment</dt>
                <dd className="mt-1">
                  <SentimentBadge sentiment={feedback.sentiment} />
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Google review link</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium">
                  {feedback.review_link_sent ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-400" /> Sent
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4 text-muted-foreground" /> Not sent
                    </>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
