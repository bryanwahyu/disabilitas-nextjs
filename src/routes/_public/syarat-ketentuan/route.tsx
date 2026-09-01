import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { SITE_URL } from '@/lib/api/seo';

export const Route = createFileRoute('/_public/syarat-ketentuan')({
  head: () => metaFrom(metadata),
  component: SyaratKetentuanLayout,
});


const metadata = {
  title: 'Syarat & Ketentuan',
  description:
    'Syarat dan ketentuan penggunaan platform DisabilitasKu. Pelajari hak, kewajiban, dan kebijakan layanan kami.',
  robots: {
    index: true,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/syarat-ketentuan`,
  },
};

function SyaratKetentuanLayout() {
  return <><Outlet /></>;
}
