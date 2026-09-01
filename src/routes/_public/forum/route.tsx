import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/forum')({
  head: () => metaFrom(metadata),
  component: ForumLayout,
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
  title: 'Forum Komunitas Disabilitas',
  description: 'Bergabung dengan forum komunitas penyandang disabilitas Indonesia. Diskusi, berbagi pengalaman, dan saling mendukung.',
  keywords: ['forum disabilitas', 'komunitas disabilitas', 'diskusi disabilitas', 'dukungan penyandang disabilitas'],
  openGraph: {
    title: 'Forum Komunitas Disabilitas | DisabilitasKu',
    description: 'Bergabung dengan forum komunitas penyandang disabilitas Indonesia.',
  },
};

function ForumLayout() {
  return <Outlet />;
}
