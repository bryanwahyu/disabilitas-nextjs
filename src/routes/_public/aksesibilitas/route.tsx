import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

export const Route = createFileRoute('/_public/aksesibilitas')({
  head: () => metaFrom(metadata),
  component: AksesibilitasLayout,
});


const metadata = {
  title: 'Aksesibilitas',
  description: 'Komitmen DisabilitasKu terhadap aksesibilitas digital. Platform kami mematuhi standar WCAG 2.1 AA untuk memastikan akses bagi semua pengguna.',
  keywords: ['aksesibilitas', 'WCAG', 'aksesibilitas digital', 'inklusi digital', 'desain inklusif'],
  openGraph: {
    title: 'Aksesibilitas | DisabilitasKu',
    description: 'Komitmen DisabilitasKu terhadap aksesibilitas digital dan standar WCAG 2.1 AA.',
  },
  alternates: {
    canonical: 'https://disabilitasku.id/aksesibilitas',
  },
};

function AksesibilitasLayout() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Beranda', url: 'https://disabilitasku.id' },
          { name: 'Aksesibilitas', url: 'https://disabilitasku.id/aksesibilitas' },
        ]}
      />
      <Outlet />
    </>
  );
}
