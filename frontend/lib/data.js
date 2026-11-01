import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

// Data access for the dashboard. Every query runs as the signed-in user, so
// Row Level Security limits results to their own restaurant. Functions return
// safe fallbacks plus an `error` flag instead of throwing, so pages can show a
// friendly message rather than crashing.

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: claims.email ?? null };
});

export const getRestaurant = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return { restaurant: null, error: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, google_review_link, twilio_number, created_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load restaurant:', error);
    return { restaurant: null, error: true };
  }
  return { restaurant: data, error: false };
});

// Feedback from the start of the day 6 days ago until now (7 calendar days,
// UTC). The chart re-buckets by the viewer's local day.
export async function getRecentFeedback(restaurantId) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 7);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('feedback')
    .select('id, sentiment, review_link_sent, created_at')
    .eq('restaurant_id', restaurantId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true })
    .limit(5000);

  if (error) {
    console.error('Failed to load recent feedback:', error);
    return { rows: [], error: true };
  }
  return { rows: data ?? [], error: false };
}

export async function listFeedback(restaurantId, limit = 200) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('feedback')
    .select('id, customer_phone, customer_message, sentiment, created_at')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to list feedback:', error);
    return { rows: [], error: true };
  }
  return { rows: data ?? [], error: false };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getFeedback(id) {
  if (!UUID_RE.test(String(id))) return { feedback: null, error: false };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('feedback')
    .select(
      'id, customer_phone, customer_message, sentiment, ai_reply, review_link_sent, created_at'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to load feedback:', error);
    return { feedback: null, error: true };
  }
  return { feedback: data, error: false };
}

// Fetched separately from getRestaurant() so the rest of the dashboard keeps
// working even if the custom_qr_message migration hasn't been applied yet.
export async function getCustomQrMessage(restaurantId) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('restaurants')
    .select('custom_qr_message')
    .eq('id', restaurantId)
    .maybeSingle();

  if (error) {
    console.error('Failed to load custom QR message:', error);
    return null;
  }
  return data?.custom_qr_message ?? null;
}
