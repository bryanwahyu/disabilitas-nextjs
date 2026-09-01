import { createFileRoute } from '@tanstack/react-router';
import { SITE_URL, getTrainingForSEO, truncate } from '@/lib/api/seo';
import { metaFrom } from '@/lib/seo/head';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import TrainingDetailClient from './-components/TrainingDetailClient';

/**
 * Detail pelatihan.
 *
 * Dulu tanpa `loader`: judulnya statis "Detail Pelatihan" untuk SEMUA
 * pelatihan, jadi setiap halaman tampil identik di hasil pencarian dan
 * pratinjau tautan, dan isinya baru muncul setelah hidrasi. Sekarang judul,
 * deskripsi, dan badan halaman berasal dari data pelatihan itu sendiri.
 */
export const Route = createFileRoute('/_public/pelatihan/$id/')({
  loader: async ({ params, context }) => {
    const [training] = await Promise.all([
      getTrainingForSEO(params.id),
      context.queryClient.ensureQueryData({
        queryKey: qk.trainings.detail(params.id),
        queryFn: () => unwrap(apiClient.publicTrainings.get(params.id)),
      }),
    ]);
    return { training };
  },

  head: ({ params, loaderData }) => {
    const training = loaderData?.training;
    const title = training?.title || 'Detail Pelatihan';
    const description = training?.description
      ? truncate(training.description)
      : 'Lihat detail program pelatihan skill untuk penyandang disabilitas di DisabilitasKu.';
    const url = `${SITE_URL}/pelatihan/${params.id}`;

    return metaFrom({
      title,
      description,
      keywords: ['pelatihan disabilitas', 'kursus inklusif', 'pengembangan skill disabilitas'],
      openGraph: {
        title: `${title} | DisabilitasKu`,
        description,
        url,
        type: 'website',
        locale: 'id_ID',
        siteName: 'DisabilitasKu',
        ...(training?.cover_image ? { images: [training.cover_image] } : {}),
      },
      twitter: { card: 'summary', title: `${title} | DisabilitasKu`, description },
      alternates: { canonical: url },
    });
  },

  component: TrainingDetailPage,
});

function TrainingDetailPage() {
  const { id } = Route.useParams();
  const { training } = Route.useLoaderData();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Beranda', url: SITE_URL },
          { name: 'Pelatihan', url: `${SITE_URL}/pelatihan` },
          { name: training?.title || 'Detail Pelatihan', url: `${SITE_URL}/pelatihan/${id}` },
        ]}
      />
      <TrainingDetailClient />
    </>
  );
}
