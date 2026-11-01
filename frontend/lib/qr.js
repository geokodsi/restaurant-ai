// Helpers for the WhatsApp "click to chat" QR code.

export function defaultQrMessage(restaurantName) {
  const name = String(restaurantName ?? '').trim() || 'your restaurant';
  return `Hi! I just visited ${name} 😊`;
}

// https://wa.me/<digits>?text=<message>. wa.me wants the number as raw digits:
// no "+", spaces, dashes or "whatsapp:" prefix. Returns null without a number.
export function buildWhatsAppLink(phone, message) {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const text = String(message ?? '').trim();
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}
