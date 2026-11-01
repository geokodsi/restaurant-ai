'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Loader2,
  Mic,
  RefreshCw,
  SendHorizontal,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { buildWhatsAppLink, defaultQrMessage } from '@/lib/qr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const QR_OPTIONS = {
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#0a0a0a', light: '#ffffff' },
};

function fileSlug(name) {
  return (
    String(name ?? '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'restaurant'
  );
}

function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// jsPDF's built-in fonts can't draw emoji or non-Latin scripts, so text lines
// are rendered to a canvas with system fonts and embedded as images.
function renderTextImage(text, { fontSize, weight = 400, color, maxWidth }) {
  const scale = 3;
  const family =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let size = fontSize;
  ctx.font = `${weight} ${size * scale}px ${family}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth * scale) {
    size -= 2;
    ctx.font = `${weight} ${size * scale}px ${family}`;
  }

  const width = Math.min(ctx.measureText(text).width, maxWidth * scale);
  const height = size * scale * 1.4;
  canvas.width = Math.ceil(width) + 4;
  canvas.height = Math.ceil(height);
  ctx.font = `${weight} ${size * scale}px ${family}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 2, canvas.height / 2, maxWidth * scale);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: canvas.width / scale,
    height: canvas.height / scale,
  };
}

async function buildPdf({ restaurantName, link }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - 120;
  const PT_PER_PX = 0.75;

  const addCentered = (img, y) => {
    const w = img.width * PT_PER_PX;
    const h = img.height * PT_PER_PX;
    doc.addImage(img.dataUrl, 'PNG', (pageW - w) / 2, y, w, h);
    return y + h;
  };

  // Restaurant name
  const title = renderTextImage(restaurantName || 'Our restaurant', {
    fontSize: 48,
    weight: 700,
    color: '#0a0a0a',
    maxWidth: contentW / PT_PER_PX,
  });
  let y = addCentered(title, 110);

  // Accent rule
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(3);
  doc.line(pageW / 2 - 40, y + 16, pageW / 2 + 40, y + 16);
  y += 50;

  // QR code
  const qrSize = 320;
  const qrDataUrl = await QRCode.toDataURL(link, { ...QR_OPTIONS, width: 1200 });
  doc.addImage(qrDataUrl, 'PNG', (pageW - qrSize) / 2, y, qrSize, qrSize);
  y += qrSize + 28;

  // Instructions
  const tagline = renderTextImage('Scan to share your experience 🍽️', {
    fontSize: 28,
    weight: 600,
    color: '#171717',
    maxWidth: contentW / PT_PER_PX,
  });
  y = addCentered(tagline, y);

  const hint = renderTextImage('Open your phone camera and point it at the code', {
    fontSize: 16,
    color: '#525252',
    maxWidth: contentW / PT_PER_PX,
  });
  addCentered(hint, y + 6);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  doc.text('Powered by RepAI', pageW / 2, pageH - 40, { align: 'center' });

  return doc;
}

function PhonePreview({ restaurantName, twilioNumber, message }) {
  return (
    <div className="mx-auto w-full max-w-[260px] rounded-[2.25rem] border-4 border-neutral-700 bg-neutral-900 p-2 shadow-2xl shadow-emerald-950/40">
      <div className="overflow-hidden rounded-[1.75rem] bg-[#0b141a]">
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-2 pb-1 text-[10px] text-neutral-400">
          <span>9:41</span>
          <span className="h-4 w-16 rounded-full bg-black" aria-hidden />
          <span>100%</span>
        </div>
        {/* Chat header */}
        <div className="flex items-center gap-2 bg-[#202c33] px-3 py-2">
          <ArrowLeft className="size-4 text-neutral-300" />
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            {(restaurantName || 'R').trim().charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-neutral-100">
              {restaurantName || 'Your restaurant'}
            </p>
            <p className="truncate text-[10px] text-neutral-400">{twilioNumber}</p>
          </div>
        </div>
        {/* Conversation */}
        <div className="flex h-[300px] flex-col justify-between bg-[#0b141a] bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:12px_12px] p-3">
          <div className="mx-auto rounded-md bg-[#182229] px-2 py-1 text-center text-[9px] leading-snug text-[#ffd279]">
            Messages are end-to-end encrypted.
          </div>
          <p className="text-center text-[10px] text-neutral-500">
            The message is pre-filled — the customer just taps send.
          </p>
        </div>
        {/* Compose bar */}
        <div className="flex items-end gap-2 bg-[#0b141a] px-2 pb-3">
          <div className="min-w-0 flex-1 rounded-2xl bg-[#202c33] px-3 py-2 text-xs break-words whitespace-pre-wrap text-neutral-100">
            {message || <span className="text-neutral-500">Message</span>}
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[#0b141a]">
            {message ? <SendHorizontal className="size-4" /> : <Mic className="size-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export function QrCodePanel({ restaurantId, restaurantName, twilioNumber, customMessage }) {
  const router = useRouter();
  const fallback = defaultQrMessage(restaurantName);

  const [draft, setDraft] = useState(customMessage || fallback);
  const [message, setMessage] = useState(customMessage || fallback);
  const [qr, setQr] = useState({ link: null, dataUrl: null, error: false });
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(null); // 'png' | 'pdf' | null

  const link = useMemo(() => buildWhatsAppLink(twilioNumber, message), [twilioNumber, message]);
  const generating = !!link && qr.link !== link;
  const dirty = draft.trim() !== message.trim();

  useEffect(() => {
    if (!link) return;
    let cancelled = false;
    QRCode.toDataURL(link, { ...QR_OPTIONS, width: 640 })
      .then((dataUrl) => {
        if (!cancelled) setQr({ link, dataUrl, error: false });
      })
      .catch((err) => {
        console.error('QR generation failed:', err);
        if (!cancelled) setQr({ link, dataUrl: null, error: true });
      });
    return () => {
      cancelled = true;
    };
  }, [link]);

  async function onUpdate(event) {
    event.preventDefault();
    const next = draft.trim() || fallback;
    // Store NULL for the default so it follows future restaurant renames.
    const toSave = next === fallback ? null : next;

    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('restaurants')
        .update({ custom_qr_message: toSave })
        .eq('id', restaurantId)
        .select('id');

      if (error) {
        console.error('Failed to save QR message:', error);
        toast.error("We couldn't save your message. Please try again.");
        return;
      }
      if (!data?.length) {
        toast.error('Your session expired. Please log in again and retry.');
        return;
      }

      setDraft(next);
      setMessage(next);
      toast.success('QR code updated');
      router.refresh();
    } catch (err) {
      console.error('Failed to save QR message:', err);
      toast.error("We couldn't save your message. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onDownloadPng() {
    setBusy('png');
    try {
      const dataUrl = await QRCode.toDataURL(link, { ...QR_OPTIONS, width: 1024 });
      downloadDataUrl(dataUrl, `${fileSlug(restaurantName)}-qr-code.png`);
    } catch (err) {
      console.error('PNG download failed:', err);
      toast.error("Couldn't create the PNG. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function onDownloadPdf() {
    setBusy('pdf');
    try {
      const doc = await buildPdf({ restaurantName, link });
      doc.save(`${fileSlug(restaurantName)}-qr-code.pdf`);
    } catch (err) {
      console.error('PDF download failed:', err);
      toast.error("Couldn't create the PDF. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied to clipboard');
    } catch (err) {
      console.error('Copy failed:', err);
      toast.error("Couldn't copy the link. Select it and copy it manually.");
    }
  }

  const ready = !!qr.dataUrl && !generating;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardContent className="flex flex-col gap-6">
          <form onSubmit={onUpdate} className="grid gap-2">
            <Label htmlFor="qrMessage">Custom message (optional)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="qrMessage"
                value={draft}
                maxLength={500}
                placeholder={fallback}
                onChange={(e) => setDraft(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={saving || (!dirty && !!draft.trim())}>
                {saving ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                Update QR code
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Pre-filled in WhatsApp when a customer scans. Leave empty to use the default.
            </p>
          </form>

          <div className="flex flex-col items-center gap-4">
            <div className="relative flex size-[240px] items-center justify-center rounded-2xl bg-white p-3 ring-1 ring-emerald-500/30 sm:size-[320px]">
              {qr.dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qr.dataUrl}
                  alt={`QR code that opens a WhatsApp chat with ${restaurantName || 'your restaurant'}`}
                  className={`size-full transition-opacity ${generating ? 'opacity-30' : ''}`}
                />
              )}
              {(generating || (!qr.dataUrl && !qr.error)) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-neutral-600">
                  <Loader2 className="size-8 animate-spin text-emerald-600" />
                  <span className="text-xs">Generating QR code…</span>
                </div>
              )}
              {qr.error && !generating && (
                <p className="px-4 text-center text-sm text-red-600">
                  Couldn&apos;t generate the QR code. Try a shorter message.
                </p>
              )}
            </div>

            <p className="w-full max-w-xl rounded-lg border border-border bg-muted/40 px-3 py-2 text-center font-mono text-xs break-all text-muted-foreground select-all">
              {link}
            </p>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center">
              <Button onClick={onDownloadPng} disabled={!ready || !!busy}>
                {busy === 'png' ? <Loader2 className="animate-spin" /> : <Download />}
                Download PNG
              </Button>
              <Button variant="outline" onClick={onDownloadPdf} disabled={!ready || !!busy}>
                {busy === 'pdf' ? <Loader2 className="animate-spin" /> : <FileText />}
                Download PDF (printable)
              </Button>
              <Button variant="outline" onClick={onCopy} disabled={!link}>
                <Copy />
                Copy link
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What customers see</CardTitle>
          <CardDescription>
            Scanning opens WhatsApp with your message ready to send.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhonePreview
            restaurantName={restaurantName}
            twilioNumber={twilioNumber}
            message={message}
          />
        </CardContent>
      </Card>
    </div>
  );
}
