import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Landing point for Supabase email links (signup confirmation). Supports both
// the PKCE `code` flow and `token_hash` links, then sends the user on.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const nextParam = searchParams.get('next') ?? '/dashboard';
  const next =
    nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';

  try {
    const supabase = await createClient();
    let error = null;

    if (code) {
      ({ error } = await supabase.auth.exchangeCodeForSession(code));
    } else if (tokenHash && type) {
      ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
    } else {
      error = new Error('Missing code or token_hash');
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error('Auth callback failed:', error);
  } catch (err) {
    console.error('Auth callback crashed:', err);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
