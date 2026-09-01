import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { SITE_URL } from '@/lib/api/seo';

export const Route = createFileRoute('/_public/bantuan')({
  head: () => metaFrom(metadata),
  component: BantuanLayout,
});


const metadata = {
  title: 'Pusat Bantuan',
  description:
    'Butuh bantuan menggunakan DisabilitasKu? Temukan panduan, kontak dukungan, dan jawaban atas pertanyaan umum di Pusat Bantuan kami.',
  keywords: ['bantuan disabilitasku', 'pusat bantuan', 'dukungan pengguna', 'panduan disabilitasku'],
  openGraph: {
    title: 'Pusat Bantuan | DisabilitasKu',
    description: 'Panduan, kontak dukungan, dan jawaban atas pertanyaan umum DisabilitasKu.',
    url: `${SITE_URL}/bantuan`,
    type: 'website',
    locale: 'id_ID',
    siteName: 'DisabilitasKu',
  },
  alternates: {
    canonical: `${SITE_URL}/bantuan`,
  },
};

function BantuanLayout() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Beranda', url: SITE_URL },
          { name: 'Bantuan', url: `${SITE_URL}/bantuan` },
        ]}
      />
      <Outlet />
    </>
  );
}
