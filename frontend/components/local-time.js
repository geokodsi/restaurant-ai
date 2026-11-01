'use client';

// Render a timestamp in the viewer's own timezone/locale. The server render
// uses the server's zone, so the hydration warning is suppressed on purpose.
export function LocalTime({ value, mode = 'datetime', className }) {
  if (!value) return <span className={className}>—</span>;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span className={className}>—</span>;

  const options =
    mode === 'date'
      ? { dateStyle: 'medium' }
      : { dateStyle: 'medium', timeStyle: 'short' };

  return (
    <time dateTime={date.toISOString()} className={className} suppressHydrationWarning>
      {date.toLocaleString(undefined, options)}
    </time>
  );
}
