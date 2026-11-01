import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { getCurrentUser, getRestaurant } from '@/lib/data';

export const metadata = { title: 'Dashboard — RepAI' };

export default async function DashboardLayout({ children }) {
  // The proxy already gates /dashboard; this is defense in depth.
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const { restaurant } = await getRestaurant();

  return (
    <div className="dark flex min-h-screen flex-1 flex-col bg-background text-foreground md:flex-row">
      <Sidebar restaurantName={restaurant?.name} email={user.email} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
