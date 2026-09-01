import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * /konsultasi bukan halaman sendiri — arahkan ke form intake.
 *
 * Dilakukan di `beforeLoad`, bukan di dalam komponen: redirect terjadi sebelum
 * apa pun dirender, jadi tidak ada kedipan halaman kosong dan crawler langsung
 * menerima 301 dari server.
 */
export const Route = createFileRoute('/_public/konsultasi/')({
  beforeLoad: () => {
    throw redirect({ to: '/konsultasi/mulai' });
  },
});
