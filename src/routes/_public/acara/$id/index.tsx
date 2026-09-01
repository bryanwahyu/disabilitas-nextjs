import { createFileRoute } from '@tanstack/react-router';
import { getEventForSEO, SITE_URL } from '@/lib/api/seo';
import { metaFrom } from '@/lib/seo/head';
import { EventJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import AcaraDetailClient from './-components/AcaraDetailClient';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';

/**
 * Detail acara — dari `app/(public)/acara/[id]/page.tsx`.
 *
 * Server component async + `generateMetadata` Next digantikan `loader` +
 * `head({ loaderData })`: keduanya dulu memanggil `getEventForSEO` sendiri-
 * sendiri, sekarang cukup sekali per request dan hasilnya dipakai berdua.
 *
 * `loader` tidak boleh di-defer di sini — data yang di-stream baru sampai
 * setelah shell HTML dikirim, sementara tag SEO harus sudah ada di HTML awal.
 */
export const Route = createFileRoute('/_public/acara/$id/')({

  /*
   * Selain data untuk `head`, cache Query ikut dipanaskan supaya isi halaman
   * ter-render di HTML server. Tanpa itu `head`-nya benar tapi `<body>`-nya
   * kosong sampai hidrasi.
   */
  loader: async ({ params, context }) => {
    const [event] = await Promise.all([
      getEventForSEO(params.id),
      context.queryClient.ensureQueryData({
        queryKey: qk.events.detail(params.id),
        queryFn: () => unwrap(apiClient.events.get(params.id)),
      }),
    ]);
    return event;
  },

  head: ({ loaderData: event, params }) => {
    const url = `${SITE_URL}/acara/${params.id}`;

    if (!event) {
      return metaFrom({
        title: 'Acara Tidak Ditemukan',
        description: 'Acara yang Anda cari tidak ditemukan di DisabilitasKu.',
      });
    }

    const startDate = new Date(event.start_at).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const description = `${event.title} - ${startDate}. ${event.location ? `Lokasi: ${event.location}.` : `Mode: ${event.mode}.`} Ikuti acara disabilitas di DisabilitasKu.`;

    return metaFrom({
      title: event.title,
      description,
      keywords: ['event disabilitas', 'acara disabilitas', event.title],
      openGraph: {
        title: event.title,
        description,
        url,
        type: 'website',
        locale: 'id_ID',
        siteName: 'DisabilitasKu',
      },
      twitter: { card: 'summary', title: event.title, description },
      alternates: { canonical: url },
    });
  },

  component: AcaraDetailPage,
});

function AcaraDetailPage() {
  const { id } = Route.useParams();
  const event = Route.useLoaderData();

  return (
    <>
      {event && (
        <>
          <EventJsonLd
            name={event.title}
            description={`Event disabilitas: ${event.title}`}
            startDate={event.start_at}
            endDate={event.end_at}
            location={event.location}
            url={`${SITE_URL}/acara/${id}`}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Beranda', url: SITE_URL },
              { name: 'Acara', url: `${SITE_URL}/acara` },
              { name: event.title, url: `${SITE_URL}/acara/${id}` },
            ]}
          />
        </>
      )}
      <AcaraDetailClient />
    </>
  );
}
