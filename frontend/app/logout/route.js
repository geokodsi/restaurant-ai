import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function logout(request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Logout failed:', err);
  }
  // 303 so a POST from the sidebar form becomes a GET of /login.
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}

// The sidebar submits a POST form; GET is supported so /logout works as a link.
export const POST = logout;
export const GET = logout;
