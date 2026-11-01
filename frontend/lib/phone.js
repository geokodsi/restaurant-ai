// Normalize a phone number / Twilio channel address to E.164
// ("whatsapp:+1 555-123-4567" -> "+15551234567"). Mirrors
// public.normalize_phone() in the database. Returns null if nothing is left.
export function normalizePhone(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace('whatsapp:', '').replace(/[^0-9+]/g, '');
  return cleaned || null;
}

// Loose E.164 check: leading +, 8–15 digits.
export function isValidPhone(raw) {
  return /^\+[1-9]\d{7,14}$/.test(normalizePhone(raw) ?? '');
}

export function isValidUrl(raw) {
  try {
    const url = new URL(String(raw));
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
