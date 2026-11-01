'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, MailCheck } from 'lucide-react';
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

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState(null);

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
      restaurantName: String(form.get('restaurantName') ?? '').trim(),
      reviewLink: String(form.get('reviewLink') ?? '').trim(),
      whatsappNumber: String(form.get('whatsappNumber') ?? '').trim(),
    };

    const problem = validate(values);
    if (problem) {
      toast.error(problem);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const twilioNumber = normalizePhone(values.whatsappNumber);

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

      // The restaurant row is created by a database trigger from this
      // metadata, so it works even when email confirmation is required.
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          data: {
            restaurant_name: values.restaurantName,
            google_review_link: values.reviewLink,
            twilio_number: twilioNumber,
          },
        },
      });

      if (error) {
        toast.error(friendlySignupError(error));
        return;
      }

      // Supabase returns a user with no identities when the email is taken
      // (to avoid leaking which emails exist).
      if (data.user && data.user.identities?.length === 0) {
        toast.error('An account with this email already exists. Try logging in.');
        return;
      }

      if (data.session) {
        toast.success('Account created — welcome to RepAI!');
        router.replace('/dashboard');
        router.refresh();
      } else {
        setConfirmEmail(values.email);
      }
    } catch (err) {
      console.error('Signup failed:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (confirmEmail) {
    return (
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <MailCheck className="mx-auto mb-2 size-10 text-primary" />
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We sent a confirmation link to{' '}
            <span className="text-foreground">{confirmEmail}</span>. Click it to
            activate your account and open your dashboard.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to log in
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-xl">Create your RepAI account</CardTitle>
        <CardDescription>Start turning WhatsApp feedback into Google reviews.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit} noValidate>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="restaurantName">Restaurant name</Label>
            <Input id="restaurantName" name="restaurantName" autoComplete="organization" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reviewLink">Google review link</Label>
            <Input
              id="reviewLink"
              name="reviewLink"
              type="url"
              inputMode="url"
              placeholder="https://g.page/r/.../review"
              required
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
              required
            />
            <p className="text-xs text-muted-foreground">
              The Twilio WhatsApp number your customers message, with country code.
            </p>
          </div>
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            Create account
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function validate(values) {
  if (!values.restaurantName) return 'Enter your restaurant name.';
  if (!/^\S+@\S+\.\S+$/.test(values.email)) return 'Enter a valid email address.';
  if (values.password.length < 8) return 'Password must be at least 8 characters.';
  if (!isValidUrl(values.reviewLink)) {
    return 'Enter a valid Google review link starting with https://';
  }
  if (!isValidPhone(values.whatsappNumber)) {
    return 'Enter the WhatsApp number with country code, e.g. +15551234567.';
  }
  return null;
}

function friendlySignupError(error) {
  const message = error?.message ?? '';
  if (/already registered/i.test(message)) {
    return 'An account with this email already exists. Try logging in.';
  }
  if (/rate limit/i.test(message)) {
    return 'Too many signup attempts. Please wait a few minutes and try again.';
  }
  if (/database error/i.test(message)) {
    return 'We could not set up your restaurant. Please try again.';
  }
  return message || 'Could not create your account. Please try again.';
}
