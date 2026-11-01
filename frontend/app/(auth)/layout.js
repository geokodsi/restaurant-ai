import { Logo } from '@/components/logo';

export default function AuthLayout({ children }) {
  return (
    <div className="dark flex min-h-screen flex-1 flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-5xl items-center px-6 py-6">
        <Logo />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-4 sm:items-center sm:pt-0">
        {children}
      </main>
    </div>
  );
}
