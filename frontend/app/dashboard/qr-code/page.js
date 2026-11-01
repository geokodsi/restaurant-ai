import Link from 'next/link';
import { Phone } from 'lucide-react';
import { getCustomQrMessage, getRestaurant } from '@/lib/data';
import { LoadError, NoRestaurant, PageHeader } from '@/components/dashboard/common';
import { QrCodePanel } from '@/components/dashboard/qr-code-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = { title: 'QR Code — RepAI' };

export default async function QrCodePage() {
  const { restaurant, error } = await getRestaurant();

  let body;
  if (error) {
    body = <LoadError message="We couldn't load your restaurant. Please refresh the page." />;
  } else if (!restaurant) {
    body = <NoRestaurant />;
  } else if (!restaurant.twilio_number) {
    body = (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Phone className="size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Add your WhatsApp number first</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            Your QR code opens a WhatsApp chat with your restaurant&apos;s number. Add it in
            Settings to generate the code.
          </p>
          <Button asChild className="mt-2">
            <Link href="/dashboard/settings">Go to settings</Link>
          </Button>
        </CardContent>
      </Card>
    );
  } else {
    const customMessage = await getCustomQrMessage(restaurant.id);
    body = (
      <QrCodePanel
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        twilioNumber={restaurant.twilio_number}
        customMessage={customMessage}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Your Restaurant QR Code"
        description="Print this and put it on tables, receipts, or near the exit. Customers scan it to leave feedback."
      />
      {body}
    </>
  );
}
