'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, Menu, MessageSquareText, QrCode, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/feedback', label: 'Feedback', icon: MessageSquareText },
  { href: '/dashboard/qr-code', label: 'QR Code', icon: QrCode },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

function NavLinks({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}

      {/* POST form, not a <Link>: link prefetching must never log anyone out. */}
      <form action="/logout" method="post" className="mt-auto">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </form>
    </nav>
  );
}

function RestaurantLabel({ restaurantName, email }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card/50 px-3 py-2">
      <p className="truncate text-sm font-medium">{restaurantName || 'Your restaurant'}</p>
      {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
    </div>
  );
}

export function Sidebar({ restaurantName, email }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Logo href="/dashboard" className="px-3 pt-2" />
        <RestaurantLabel restaurantName={restaurantName} email={email} />
        <NavLinks />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo href="/dashboard" />
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="dark flex w-72 flex-col gap-6 bg-sidebar p-4 text-foreground">
            <SheetTitle className="px-3 pt-2">
              Rep<span className="text-emerald-400">AI</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Dashboard navigation</SheetDescription>
            <RestaurantLabel restaurantName={restaurantName} email={email} />
            <NavLinks onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
