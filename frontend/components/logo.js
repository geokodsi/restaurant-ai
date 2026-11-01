import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Logo({ className, href = '/' }) {
  return (
    <Link href={href} className={cn('text-lg font-semibold tracking-tight', className)}>
      Rep<span className="text-emerald-400">AI</span>
    </Link>
  );
}
