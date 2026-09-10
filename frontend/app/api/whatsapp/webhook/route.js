const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'repai_webhook_2024';

// GET: Meta webhook verification handshake.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// POST: incoming WhatsApp messages.
export async function POST(request) {
  const raw = await request.text();

  let body = raw;
  try {
    body = JSON.parse(raw);
  } catch {
    // Not JSON — keep the raw text for logging.
  }

  console.log('Incoming WhatsApp webhook:', JSON.stringify(body));

  return new Response('OK', { status: 200 });
}
