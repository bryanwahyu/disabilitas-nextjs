import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { SITE_URL } from '@/lib/api/seo';

export const Route = createFileRoute('/_public/pelatihan')({
  head: () => metaFrom(metadata),
  component: PelatihanLayout,
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
  title: 'Pelatihan & Kursus Inklusif untuk Penyandang Disabilitas',
  description:
    'Temukan program pelatihan dan kursus inklusif yang dirancang untuk pengembangan keterampilan penyandang disabilitas di Indonesia — dari digital, vokasi, hingga kewirausahaan.',
  keywords: [
    'pelatihan disabilitas',
    'kursus inklusif',
    'pengembangan skill disabilitas',
    'pelatihan vokasi disabilitas',
    'kursus online disabilitas',
  ],
  openGraph: {
    title: 'Pelatihan & Kursus Inklusif | DisabilitasKu',
    description: 'Program pelatihan inklusif untuk pengembangan skill penyandang disabilitas.',
    url: `${SITE_URL}/pelatihan`,
    type: 'website',
    locale: 'id_ID',
    siteName: 'DisabilitasKu',
  },
};

function PelatihanLayout() {
  return <Outlet />;
}
