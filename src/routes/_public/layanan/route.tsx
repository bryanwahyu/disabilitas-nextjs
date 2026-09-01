import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/layanan')({
  head: () => metaFrom(metadata),
  component: LayananLayout,
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
  title: 'Layanan Terapi & Rehabilitasi',
  description: 'Temukan layanan terapi profesional untuk penyandang disabilitas di Indonesia. Terapi okupasi, fisioterapi, terapi wicara, dan konsultasi online.',
  keywords: ['layanan terapi', 'rehabilitasi disabilitas', 'terapi okupasi', 'fisioterapi', 'terapi wicara', 'konsultasi online'],
  openGraph: {
    title: 'Layanan Terapi & Rehabilitasi | DisabilitasKu',
    description: 'Temukan layanan terapi profesional untuk penyandang disabilitas di Indonesia.',
  },
};

function LayananLayout() {
  return <Outlet />;
}
