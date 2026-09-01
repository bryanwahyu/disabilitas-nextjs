import { createFileRoute } from '@tanstack/react-router';
import { SITE_URL } from '@/lib/api/seo';
import { metaFrom } from '@/lib/seo/head';
import { BreadcrumbJsonLd, HealthServiceJsonLd } from '@/components/JsonLd';
import ServiceDetailClient from './-components/ServiceDetailClient';



const serviceMetadata: Record<string, { title: string; description: string; serviceType: string }> = {
  'konsultasi-aksesibilitas': {
    title: 'Konsultasi Aksesibilitas',
    description: 'Layanan konsultasi gratis tentang aksesibilitas dan dukungan. Evaluasi kebutuhan, rekomendasi alat bantu, dan panduan implementasi untuk penyandang disabilitas.',
    serviceType: 'Konsultasi Aksesibilitas',
  },
  'layanan-kesehatan': {
    title: 'Layanan Kesehatan',
    description: 'Akses mudah ke layanan kesehatan ramah disabilitas: terapi fisik, terapi okupasi, dan konseling psikologi di Indonesia.',
    serviceType: 'Layanan Kesehatan',
  },
  'komunitas-support': {
    title: 'Komunitas Support',
    description: 'Bergabung dengan komunitas saling mendukung melalui forum diskusi, grup support, dan program mentoring untuk penyandang disabilitas.',
    serviceType: 'Dukungan Komunitas',
  },
  'sumber-belajar': {
    title: 'Sumber Belajar',
    description: 'Kumpulan materi belajar dan informasi pengembangan diri: video edukasi, artikel, dan e-book gratis untuk penyandang disabilitas.',
    serviceType: 'Edukasi',
  },
  'peluang-kerja': {
    title: 'Peluang Kerja',
    description: 'Platform pencarian kerja inklusif ramah disabilitas: lowongan kerja, pelatihan skill, dan career coaching.',
    serviceType: 'Peluang Kerja',
  },
  'program-pelatihan': {
    title: 'Program Pelatihan',
    description: 'Berbagai program pelatihan pengembangan skill: soft skill, hard skill, dan program sertifikasi untuk penyandang disabilitas.',
    serviceType: 'Pelatihan',
  },
};

/**
 * Detail layanan — dari `app/(public)/layanan/[serviceId]/page.tsx`.
 *
 * Isinya statis (peta `serviceMetadata` di atas), jadi tidak butuh `loader`:
 * `head` cukup membaca `params`. `generateStaticParams` dibuang karena
 * prerender tidak dipakai — keputusan founder: SSR penuh.
 */
export const Route = createFileRoute('/_public/layanan/$serviceId/')({
  head: ({ params }) => {
    const service = serviceMetadata[params.serviceId];

    if (!service) {
      return metaFrom({
        title: 'Layanan Tidak Ditemukan',
        description: 'Layanan yang Anda cari tidak ditemukan di DisabilitasKu.',
      });
    }

    const url = `${SITE_URL}/layanan/${params.serviceId}`;

    return metaFrom({
      title: service.title,
      description: service.description,
      keywords: ['layanan disabilitas', service.title, service.serviceType],
      openGraph: {
        title: `${service.title} | DisabilitasKu`,
        description: service.description,
        url,
        type: 'website',
        locale: 'id_ID',
        siteName: 'DisabilitasKu',
      },
      twitter: {
        card: 'summary',
        title: service.title,
        description: service.description,
      },
      alternates: { canonical: url },
    });
  },

  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { serviceId } = Route.useParams();
  const service = serviceMetadata[serviceId];

  return (
    <>
      {service && (
        <>
          <HealthServiceJsonLd
            name={service.title}
            description={service.description}
            serviceType={service.serviceType}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Beranda', url: SITE_URL },
              { name: 'Layanan', url: `${SITE_URL}/layanan` },
              { name: service.title, url: `${SITE_URL}/layanan/${serviceId}` },
            ]}
          />
        </>
      )}
      <ServiceDetailClient />
    </>
  );
}
