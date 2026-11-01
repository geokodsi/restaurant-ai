// Supabase connection settings. The browser can only see NEXT_PUBLIC_* vars,
// so those are the primary names; SUPABASE_URL / SUPABASE_ANON_KEY are
// accepted as server-side fallbacks.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
