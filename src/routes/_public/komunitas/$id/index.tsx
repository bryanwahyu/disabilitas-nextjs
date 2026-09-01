import { createFileRoute } from '@tanstack/react-router';
import { getCommunityForSEO, SITE_URL } from '@/lib/api/seo';
import { metaFrom } from '@/lib/seo/head';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import KomunitasDetailClient from './-components/KomunitasDetailClient';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';

/** Detail komunitas — dari `app/(public)/komunitas/[id]/page.tsx`. */
export const Route = createFileRoute('/_public/komunitas/$id/')({

  /*
   * Selain data untuk `head`, cache Query ikut dipanaskan supaya isi halaman
   * ter-render di HTML server. Tanpa itu `head`-nya benar tapi `<body>`-nya
   * kosong sampai hidrasi.
   */
  loader: async ({ params, context }) => {
    const [community] = await Promise.all([
      getCommunityForSEO(params.id),
      context.queryClient.ensureQueryData({
        queryKey: qk.communities.detail(params.id),
        queryFn: () => unwrap(apiClient.communities.publicGet(params.id)),
      }),
    ]);
    return community;
  },

  head: ({ loaderData: community, params }) => {
    const url = `${SITE_URL}/komunitas/${params.id}`;

    if (!community) {
      return metaFrom({
        title: 'Komunitas Tidak Ditemukan',
        description: 'Komunitas yang Anda cari tidak ditemukan di DisabilitasKu.',
      });
    }

    const description =
      community.description || `Bergabung dengan komunitas ${community.name} di DisabilitasKu.`;
    const tags = community.tags?.replace(/[{}]/g, '').split(',').filter(Boolean) || [];

    return metaFrom({
      title: community.name,
      description,
      keywords: ['komunitas disabilitas', community.name, ...tags],
      openGraph: {
        title: community.name,
        description,
        url,
        type: 'website',
        locale: 'id_ID',
        siteName: 'DisabilitasKu',
      },
      twitter: { card: 'summary', title: community.name, description },
      alternates: { canonical: url },
    });
  },

  component: KomunitasDetailPage,
});

function KomunitasDetailPage() {
  const { id } = Route.useParams();
  const community = Route.useLoaderData();

  return (
    <>
      {community && (
        <BreadcrumbJsonLd
          items={[
            { name: 'Beranda', url: SITE_URL },
            { name: 'Komunitas', url: `${SITE_URL}/komunitas` },
            { name: community.name, url: `${SITE_URL}/komunitas/${id}` },
          ]}
        />
      )}
      <KomunitasDetailClient />
    </>
  );
}
