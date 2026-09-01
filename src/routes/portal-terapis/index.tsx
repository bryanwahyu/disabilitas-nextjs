import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Akar portal terapis → dashboard.
 *
 * Prefix `/portal-terapis` sekarang tampil di URL (rewrite host milik
 * `middleware.ts` Next tidak punya padanan di TanStack), jadi tujuannya
 * ditulis lengkap. Guard di `dashboard/route.tsx` yang menentukan apakah
 * user boleh masuk atau dilempar ke halaman masuk.
 */
export const Route = createFileRoute('/portal-terapis/')({
  beforeLoad: () => {
    throw redirect({ to: '/portal-terapis/dashboard' });
  },
});
