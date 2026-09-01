import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

export const Route = createFileRoute('/_public/cara-kerja')({
  head: () => metaFrom(metadata),
  component: CaraKerjaLayout,
});


const metadata = {
  title: 'Cara Kerja Platform',
  description: 'Pelajari cara menggunakan platform DisabilitasKu untuk menemukan layanan terapi, bergabung dengan komunitas, dan mendapatkan dukungan.',
  keywords: ['cara kerja DisabilitasKu', 'panduan DisabilitasKu', 'tutorial platform disabilitas'],
  openGraph: {
    title: 'Cara Kerja Platform | DisabilitasKu',
    description: 'Pelajari cara menggunakan platform DisabilitasKu untuk menemukan layanan terapi.',
  },
  alternates: {
    canonical: 'https://disabilitasku.id/cara-kerja',
  },
};

function CaraKerjaLayout() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Beranda', url: 'https://disabilitasku.id' },
          { name: 'Cara Kerja', url: 'https://disabilitasku.id/cara-kerja' },
        ]}
      />
      <Outlet />
    </>
  );
}
