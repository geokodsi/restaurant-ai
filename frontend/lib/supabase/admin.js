import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

// Service-role client for trusted server code with no signed-in user (the
// Twilio webhook). It bypasses Row Level Security — never import this from
// client code. Returns null if the key isn't configured.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) {
    return null;
  }

  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
