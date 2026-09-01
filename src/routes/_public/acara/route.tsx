import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/acara')({
  head: () => metaFrom(metadata),
  component: AcaraLayout,
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
  title: 'Event & Workshop Disabilitas',
  description: 'Temukan event, workshop, dan kegiatan untuk penyandang disabilitas di Indonesia. Pelatihan, seminar, dan acara komunitas.',
  keywords: ['event disabilitas', 'workshop disabilitas', 'pelatihan disabilitas', 'seminar inklusi'],
  openGraph: {
    title: 'Event & Workshop Disabilitas | DisabilitasKu',
    description: 'Temukan event, workshop, dan kegiatan untuk penyandang disabilitas di Indonesia.',
  },
};

function AcaraLayout() {
  return <Outlet />;
}
