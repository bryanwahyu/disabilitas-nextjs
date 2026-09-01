import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/artikel')({
  head: () => metaFrom(metadata),
  component: ArtikelLayout,
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
  title: 'Artikel & Edukasi Disabilitas',
  description: 'Baca artikel terbaru seputar disabilitas, tips kesehatan, panduan terapi, dan informasi edukasi untuk penyandang disabilitas dan keluarga.',
  keywords: ['artikel disabilitas', 'edukasi disabilitas', 'tips kesehatan disabilitas', 'panduan terapi'],
  openGraph: {
    title: 'Artikel & Edukasi Disabilitas | DisabilitasKu',
    description: 'Baca artikel terbaru seputar disabilitas, tips kesehatan, dan panduan terapi.',
  },
};

function ArtikelLayout() {
  return <Outlet />;
}
