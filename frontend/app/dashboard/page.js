import { getRecentFeedback, getRestaurant } from '@/lib/data';
import { LoadError, NoRestaurant, PageHeader } from '@/components/dashboard/common';
import { Overview } from '@/components/dashboard/overview';

export default async function DashboardPage() {
  const { restaurant, error: restaurantError } = await getRestaurant();

  if (restaurantError) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <LoadError />
      </>
    );
  }
  if (!restaurant) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <NoRestaurant />
      </>
    );
  }

  const { rows, error } = await getRecentFeedback(restaurant.id);

  return (
    <>
      <PageHeader
        title={restaurant.name ? `${restaurant.name}` : 'Dashboard'}
        description="How your guests felt this week."
      />
      {error && (
        <div className="mb-6">
          <LoadError message="We couldn't load this week's feedback. Please refresh the page." />
        </div>
      )}
      <Overview rows={rows} />
    </>
  );
}
