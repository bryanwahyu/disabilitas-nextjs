import { createFileRoute, redirect } from '@tanstack/react-router';

/** Akar portal admin hanya pintu masuk ke dashboard. */
export const Route = createFileRoute('/admin/')({
  beforeLoad: () => {
    throw redirect({ to: '/admin/dashboard' });
  },
});
