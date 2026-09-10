import Anthropic from '@anthropic-ai/sdk';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'repai_webhook_2024';

// Placeholder — swap in the restaurant's real Google review link.
const GOOGLE_REVIEW_LINK =
  'https://search.google.com/local/writereview?placeid=YOUR_PLACE_ID';

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

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }

  console.log('Incoming WhatsApp webhook:', JSON.stringify(body));

  try {
    const message = extractIncomingMessage(body);
    if (message) {
      const sentiment = await analyzeSentiment(message.text);
      const reply =
        sentiment === 'positive'
          ? `Thank you so much for your visit! 🌟 We'd really appreciate it if you shared your experience in a Google review: ${GOOGLE_REVIEW_LINK}`
          : 'Thank you for your feedback, our manager will reach out to you shortly';
      await sendWhatsAppReply(message.from, reply);
    }
  } catch (err) {
    // Never fail the webhook — log and still return 200 so Meta doesn't retry-storm.
    console.error('Failed to process WhatsApp message:', err);
  }

  return new Response('OK', { status: 200 });
}

// Pull the sender's phone number and text out of a Meta WhatsApp Cloud API
// payload. Returns null for anything that isn't an inbound text message
// (e.g. delivery/read status receipts, non-text messages).
function extractIncomingMessage(body) {
  const value = body?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];

  if (!message || message.type !== 'text') {
    return null;
  }

  const from = message.from;
  const text = message.text?.body;

  if (!from || !text) {
    return null;
  }

  return { from, text };
}

// Ask Claude whether the customer's feedback is positive or negative.
async function analyzeSentiment(text) {
  const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8,
    system:
      'You classify restaurant customer feedback. Reply with exactly one word: ' +
      'POSITIVE if the feedback is positive, or NEGATIVE if it is negative or ' +
      'neutral. Do not add any other text.',
    output_config: { effort: 'low' },
    messages: [{ role: 'user', content: text }],
  });

  const answer = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join(' ')
    .toUpperCase();

  return answer.includes('POSITIVE') ? 'positive' : 'negative';
}

// Send a text reply through the WhatsApp Cloud API.
async function sendWhatsAppReply(to, bodyText) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    throw new Error(
      'WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN is not set'
    );
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: bodyText },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp send failed (${res.status}): ${errText}`);
  }
}
