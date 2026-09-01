import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/komunitas')({
  head: () => metaFrom(metadata),
  component: KomunitasLayout,
});


/*
 * Canonical TIDAK ditulis di layout ini.
 *
 * `head` route induk ikut terpasang di semua anaknya, dan `links` tidak
 * di-dedup seperti `meta` — canonical daftar akan menempel juga di halaman
 * detail, berdampingan dengan canonical detail itu sendiri. Next dulu
 * menimpanya; TanStack menggabungkannya. Jadi canonical dipindahkan ke route
 * daftar (`index.tsx`), yang memang halaman pemiliknya.
 */
const metadata = {
  title: 'Komunitas Disabilitas',
  description: 'Bergabung dengan komunitas penyandang disabilitas di Indonesia. Temukan dukungan, berbagi pengalaman, dan bangun koneksi.',
  keywords: ['komunitas disabilitas', 'grup disabilitas', 'dukungan disabilitas', 'jaringan disabilitas Indonesia'],
  openGraph: {
    title: 'Komunitas Disabilitas | DisabilitasKu',
    description: 'Bergabung dengan komunitas penyandang disabilitas di Indonesia.',
  },
};

function KomunitasLayout() {
  return <Outlet />;
}
