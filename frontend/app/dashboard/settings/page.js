import { getCurrentUser, getRestaurant } from '@/lib/data';
import { LoadError, PageHeader } from '@/components/dashboard/common';
import { SettingsForm } from '@/components/dashboard/settings-form';

export const metadata = { title: 'Settings — RepAI' };

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const { restaurant, error } = await getRestaurant();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your restaurant details, used in every WhatsApp reply."
      />
      {error ? (
        <LoadError message="We couldn't load your settings. Please refresh the page." />
      ) : (
        <SettingsForm userId={user?.id} restaurant={restaurant} />
      )}
    </>
  );
}
