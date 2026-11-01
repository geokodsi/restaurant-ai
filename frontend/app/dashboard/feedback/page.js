import { MessageSquareText } from 'lucide-react';
import { getRestaurant, listFeedback } from '@/lib/data';
import { LoadError, NoRestaurant, PageHeader } from '@/components/dashboard/common';
import { FeedbackList } from '@/components/dashboard/feedback-list';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'Feedback — RepAI' };

export default async function FeedbackPage() {
  const header = (
    <PageHeader title="Feedback" description="Every WhatsApp message your guests sent." />
  );

  const { restaurant, error: restaurantError } = await getRestaurant();
  if (restaurantError) return <>{header}<LoadError /></>;
  if (!restaurant) return <>{header}<NoRestaurant /></>;

  const { rows, error } = await listFeedback(restaurant.id);
  if (error) {
    return <>{header}<LoadError message="We couldn't load your feedback. Please refresh the page." /></>;
  }

  return (
    <>
      {header}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <MessageSquareText className="size-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No feedback yet</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              When a guest messages{' '}
              <span className="text-foreground">
                {restaurant.twilio_number || 'your WhatsApp number'}
              </span>
              , RepAI analyzes it, replies, and lists it here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <FeedbackList rows={rows} />
      )}
    </>
  );
}
