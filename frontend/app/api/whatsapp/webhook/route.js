import Anthropic from '@anthropic-ai/sdk';
import twilio from 'twilio';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizePhone } from '@/lib/phone';

// The Twilio SDK is a Node library (http/crypto), so pin this route to the
// Node runtime rather than the edge.
export const runtime = 'nodejs';

const NEGATIVE_REPLY =
  'Thank you for your feedback, our manager will reach out shortly';

function positiveReply(reviewLink) {
  return reviewLink
    ? `Thank you so much for your visit! 🌟 We'd really appreciate it if you shared your experience in a Google review: ${reviewLink}`
    : 'Thank you so much for your visit! 🌟 We really appreciate your kind words.';
}

// GET: Twilio doesn't do a verification handshake. Kept so that pinging the
// webhook URL in a browser or an uptime check gets a 200 instead of a 405.
export async function GET() {
  return new Response('OK', { status: 200 });
}

// POST: incoming WhatsApp messages from Twilio. Always answers 200 — a non-2xx
// makes Twilio retry and report errors, and none of our failures are fixed by
// a retry.
export async function POST(request) {
  // Twilio posts application/x-www-form-urlencoded, not JSON.
  let form;
  try {
    form = await request.formData();
  } catch (err) {
    console.error('Failed to parse Twilio form body:', err);
    return new Response('OK', { status: 200 });
  }

  const message = extractIncomingMessage(form);

  console.log('Incoming Twilio WhatsApp webhook:', {
    from: form.get('From'),
    to: form.get('To'),
    profileName: form.get('ProfileName'),
    body: form.get('Body'),
    messageSid: form.get('MessageSid'),
  });

  // Presence check only — never log the actual secret values.
  console.log('WhatsApp webhook env check:', {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    twilioSid: Boolean(process.env.TWILIO_ACCOUNT_SID),
    twilioToken: Boolean(process.env.TWILIO_AUTH_TOKEN),
    twilioNumber: Boolean(process.env.TWILIO_WHATSAPP_NUMBER),
    supabaseUrl: Boolean(
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    ),
    supabaseServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });

  try {
    if (message) {
      await handleMessage(message);
    }
  } catch (err) {
    // Never fail the webhook — log and still return 200 so Twilio doesn't
    // retry-storm.
    console.error('Failed to process WhatsApp message:', err);
  }

  return new Response('OK', { status: 200 });
}

async function handleMessage(message) {
  const supabase = createAdminClient();
  if (!supabase) {
    console.error(
      'Supabase admin client unavailable: set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY'
    );
    return;
  }

  // a) Which restaurant owns the number the guest messaged?
  const restaurantNumber = normalizePhone(message.to);
  const { data: restaurant, error: lookupError } = await supabase
    .from('restaurants')
    .select('id, name, google_review_link')
    .eq('twilio_number', restaurantNumber)
    .maybeSingle();

  if (lookupError) {
    console.error('Restaurant lookup failed:', lookupError);
    return;
  }
  // b) Unknown number: nothing to do, but don't error.
  if (!restaurant) {
    console.warn('No restaurant registered for Twilio number:', restaurantNumber);
    return;
  }
  console.log('Matched restaurant:', { id: restaurant.id, name: restaurant.name });

  // c) Claude sentiment. If it fails, fall back to the safe (manager) reply and
  // store the feedback with no sentiment so it still shows up.
  let sentiment = null;
  try {
    sentiment = await analyzeSentiment(message.text);
    console.log('Sentiment classification:', sentiment);
  } catch (err) {
    console.error('Sentiment analysis failed:', err);
  }

  // e/f) Reply with this restaurant's review link when positive.
  const reviewLink = restaurant.google_review_link?.trim() || null;
  const isPositive = sentiment === 'positive';
  const reply = isPositive ? positiveReply(reviewLink) : NEGATIVE_REPLY;

  let replySent = false;
  try {
    await sendWhatsAppReply(message.from, reply, message.to);
    replySent = true;
  } catch (err) {
    console.error('Failed to send WhatsApp reply:', err);
  }

  // d) Save the feedback row.
  const { error: insertError } = await supabase.from('feedback').insert({
    restaurant_id: restaurant.id,
    customer_phone: normalizePhone(message.from),
    customer_message: message.text,
    sentiment,
    ai_reply: replySent ? reply : null,
    review_link_sent: Boolean(isPositive && reviewLink && replySent),
  });

  if (insertError) {
    console.error('Failed to save feedback:', insertError);
  } else {
    console.log('Feedback saved for restaurant', restaurant.id);
  }
}

// Pull the sender's channel address and text out of a Twilio inbound message
// webhook. `From` arrives as a channel address (`whatsapp:+15551234567`) and is
// passed through verbatim so the reply goes back over the same channel.
// Returns null for anything that isn't an inbound text message (e.g. status
// callbacks, media-only messages).
function extractIncomingMessage(form) {
  const from = form.get('From');
  const to = form.get('To');
  const text = form.get('Body');
  const profileName = form.get('ProfileName');

  if (!from || !to || !text) {
    return null;
  }

  return { from, to, text, profileName: profileName || null };
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

// Send a text reply through the Twilio WhatsApp API.
// Replies go out from the number the guest messaged (`replyFrom`, Twilio's
// "To"), falling back to TWILIO_WHATSAPP_NUMBER.
async function sendWhatsAppReply(to, bodyText, replyFrom) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const whatsappNumber = replyFrom || process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !whatsappNumber) {
    throw new Error(
      'TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN or TWILIO_WHATSAPP_NUMBER is not set'
    );
  }

  const client = twilio(accountSid, authToken);

  try {
    // createWithHttpInfo returns the HTTP status alongside the message, so the
    // diagnostic log can report the real API response status.
    const { statusCode, body } = await client.messages.createWithHttpInfo({
      from: toChannelAddress(whatsappNumber),
      to: toChannelAddress(to),
      body: bodyText,
    });

    console.log('Twilio API response status:', statusCode, {
      sid: body?.sid,
      status: body?.status,
      errorCode: body?.errorCode,
      errorMessage: body?.errorMessage,
    });
  } catch (err) {
    // Twilio throws RestException with { status, code, message, moreInfo }.
    console.error('Twilio API error response:', {
      status: err?.status,
      code: err?.code,
      message: err?.message,
      moreInfo: err?.moreInfo,
      details: err?.details,
    });

    throw new Error(
      `Twilio send failed (${err?.status ?? 'unknown'}): ${err?.message}`
    );
  }
}

// Twilio addresses WhatsApp senders/recipients as `whatsapp:+15551234567`.
// Accept a bare E.164 number in TWILIO_WHATSAPP_NUMBER and add the prefix.
function toChannelAddress(value) {
  const trimmed = String(value).trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}
