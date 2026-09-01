import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

export const Route = createFileRoute('/_public/tentang')({
  head: () => metaFrom(metadata),
  component: TentangLayout,
});


const metadata = {
  title: 'Tentang Kami',
  description: 'DisabilitasKu adalah platform inklusif yang didirikan untuk menghubungkan penyandang disabilitas dengan layanan terapi profesional dan dukungan komunitas di Indonesia.',
  keywords: ['tentang DisabilitasKu', 'platform disabilitas Indonesia', 'misi DisabilitasKu'],
  openGraph: {
    title: 'Tentang Kami | DisabilitasKu',
    description: 'DisabilitasKu adalah platform inklusif untuk penyandang disabilitas di Indonesia.',
  },
  alternates: {
    canonical: 'https://disabilitasku.id/tentang',
  },
};

function TentangLayout() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Beranda', url: 'https://disabilitasku.id' },
          { name: 'Tentang', url: 'https://disabilitasku.id/tentang' },
        ]}
      />
      <Outlet />
    </>
  );
}
