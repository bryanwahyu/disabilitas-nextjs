import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { SITE_URL } from '@/lib/api/seo';

export const Route = createFileRoute('/_public/keamanan')({
  head: () => metaFrom(metadata),
  component: KeamananLayout,
});


const metadata = {
  title: 'Keamanan & Privasi',
  description:
    'Pelajari bagaimana DisabilitasKu melindungi data dan privasi pengguna. Komitmen kami terhadap keamanan informasi penyandang disabilitas.',
  robots: {
    index: true,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/keamanan`,
  },
};

function KeamananLayout() {
  return <><Outlet /></>;
}
