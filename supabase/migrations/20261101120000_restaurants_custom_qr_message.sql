-- Optional owner-edited pre-filled WhatsApp message for the dashboard QR code.
-- NULL means "use the default" ("Hi! I just visited <name> 😊").
alter table public.restaurants
  add column if not exists custom_qr_message text;
