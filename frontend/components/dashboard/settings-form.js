'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isValidPhone, isValidUrl, normalizePhone } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SettingsForm({ userId, restaurant }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const reviewLink = String(form.get('reviewLink') ?? '').trim();
    const whatsappNumber = String(form.get('whatsappNumber') ?? '').trim();

    if (!name) return toast.error('Enter your restaurant name.');
    if (reviewLink && !isValidUrl(reviewLink)) {
      return toast.error('Enter a valid Google review link starting with https://');
    }
    if (whatsappNumber && !isValidPhone(whatsappNumber)) {
      return toast.error('Enter the WhatsApp number with country code, e.g. +15551234567.');
    }
    if (!userId) return toast.error('Your session expired. Please log in again.');

    setSaving(true);
    try {
      const supabase = createClient();
      const twilioNumber = normalizePhone(whatsappNumber);

      if (twilioNumber) {
        const { data: available, error: rpcError } = await supabase.rpc(
          'is_twilio_number_available',
          { number: twilioNumber }
        );
        if (rpcError) {
          console.error('Number availability check failed:', rpcError);
        } else if (available === false) {
          toast.error('That WhatsApp number is already connected to another restaurant.');
          return;
        }
      }

      const values = {
        name,
        google_review_link: reviewLink || null,
        twilio_number: twilioNumber,
      };

      // Update the existing row, or create one if signup didn't (e.g. an
      // account made before restaurants existed).
      const { data: saved, error } = restaurant?.id
        ? await supabase.from('restaurants').update(values).eq('id', restaurant.id).select('id')
        : await supabase.from('restaurants').insert({ ...values, user_id: userId }).select('id');

      if (error) {
        console.error('Failed to save settings:', error);
        toast.error(
          error.code === '23505'
            ? 'That WhatsApp number is already connected to another restaurant.'
            : "We couldn't save your settings. Please try again."
        );
        return;
      }

      // RLS turns a disallowed update into "0 rows", not an error.
      if (!saved?.length) {
        toast.error('Your session expired. Please log in again and retry.');
        return;
      }

      toast.success('Settings saved');
      router.refresh();
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error("We couldn't save your settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Restaurant details</CardTitle>
        <CardDescription>
          Happy guests get your Google review link; the WhatsApp number routes incoming
          messages to your restaurant.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Restaurant name</Label>
            <Input id="name" name="name" defaultValue={restaurant?.name ?? ''} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reviewLink">Google review link</Label>
            <Input
              id="reviewLink"
              name="reviewLink"
              type="url"
              inputMode="url"
              placeholder="https://g.page/r/.../review"
              defaultValue={restaurant?.google_review_link ?? ''}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsappNumber">WhatsApp number</Label>
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              type="tel"
              inputMode="tel"
              placeholder="+15551234567"
              defaultValue={restaurant?.twilio_number ?? ''}
            />
            <p className="text-xs text-muted-foreground">
              Your Twilio WhatsApp number, with country code.
            </p>
          </div>
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" size="lg" disabled={saving} className="w-full sm:w-auto">
            {saving && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
