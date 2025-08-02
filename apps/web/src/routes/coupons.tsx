import { createFileRoute } from '@tanstack/react-router';
import { RequireAuth } from '../auth/components/AuthGuard';
import { CouponsPage } from '../components/coupons/CouponsPage';

export const Route = createFileRoute('/coupons')({
  component: CouponsRoute,
});

function CouponsRoute() {
  return (
    <RequireAuth>
      <CouponsPage />
    </RequireAuth>
  );
}
