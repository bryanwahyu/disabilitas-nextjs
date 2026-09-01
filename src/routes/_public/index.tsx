import { createFileRoute } from '@tanstack/react-router';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import TrustSection from '@/components/TrustSection';
import FounderStorySection from '@/components/FounderStorySection';
import ArticlesSection from '@/components/ArticlesSection';
import CommunitySection from '@/components/CommunitySection';
import ContactSection from '@/components/ContactSection';
import HowItWorks from '@/components/HowItWorks';
import CTASection from '@/components/CTASection';
import {
  getHomepageStats,
  getHomepageArticles,
  getHomepageThreads,
  getHomepageEvents,
} from '@/lib/api/seo';
import { env } from '@/lib/env';

const TITLE =
  'DisabilitasKu.id — Skrining Tumbuh Kembang & Terapis Anak Disabilitas Indonesia';
const DESCRIPTION =
  'Skrining tumbuh kembang anak (Denver II & KPSP), deteksi dini keterlambatan, dan terapis terpercaya di seluruh Indonesia. Kerja sama dengan Kitty Center. Untuk penyandang disabilitas, orang tua, dan keluarga.';

/**
 * Beranda — dari `app/(public)/page.tsx`.
 *
 * Dulu ini React Server Component `async` yang mengambil 4 endpoint sebelum
 * render. Di TanStack, pekerjaan itu pindah ke `loader`: dijalankan di server
 * saat SSR (jadi HTML awal tetap berisi data — SEO aman) dan di klien saat
 * navigasi antar-halaman.
 *
 * JSON-LD tidak lagi dirender sebagai `<script dangerouslySetInnerHTML>` di
 * dalam body, melainkan lewat `head.scripts` — di TanStack, isi head adalah
 * data, bukan komponen.
 */
export const Route = createFileRoute('/_public/')({
  loader: async () => {
    const [stats, articles, threads, events] = await Promise.all([
      getHomepageStats(),
      getHomepageArticles(6),
      getHomepageThreads(4),
      getHomepageEvents(3),
    ]);
    return { stats, articles, threads, events };
  },

  head: () => ({
    meta: [
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      {
        name: 'keywords',
        content: [
          'skrining tumbuh kembang anak',
          'deteksi dini keterlambatan perkembangan',
          'tes Denver II anak',
          'skrining KPSP online',
          'terapi autisme',
          'terapi cerebral palsy',
          'terapi wicara',
          'terapi fisik',
          'terapi okupasi',
          'terapi sensori integrasi',
          'platform disabilitas Indonesia',
          'penyandang disabilitas',
          'komunitas disabilitas',
          'lowongan kerja disabilitas',
          'DisabilitasKu',
          'Kitty Center',
          'cari terapis anak',
          'yayasan disabilitas',
          'inklusi disabilitas Indonesia',
        ].join(', '),
      },
      { property: 'og:title', content: TITLE },
      {
        property: 'og:description',
        content:
          'Skrining tumbuh kembang anak (Denver II & KPSP) dan terapis terpercaya. Kerja sama dengan Kitty Center. Dibangun oleh penyandang Cerebral Palsy, untuk komunitasnya.',
      },
      { property: 'og:url', content: env.siteUrl },
      { property: 'og:image', content: `${env.siteUrl}/og-home.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: TITLE },
      { name: 'twitter:title', content: TITLE },
      {
        name: 'twitter:description',
        content:
          'Skrining tumbuh kembang anak (Denver II & KPSP) dan terapis terpercaya di seluruh Indonesia. Kerja sama dengan Kitty Center.',
      },
    ],
    links: [{ rel: 'canonical', href: env.siteUrl }],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Organization',
              '@id': `${env.siteUrl}/#org`,
              name: 'DisabilitasKu',
              url: env.siteUrl,
              description:
                'Platform discovery layanan disabilitas & skrining tumbuh kembang anak di Indonesia. Kerja sama dengan Kitty Center.',
              memberOf: { '@type': 'Organization', name: 'Kitty Center' },
            },
            {
              '@type': 'WebSite',
              '@id': `${env.siteUrl}/#website`,
              url: env.siteUrl,
              name: 'DisabilitasKu.id',
              publisher: { '@id': `${env.siteUrl}/#org` },
              potentialAction: {
                '@type': 'SearchAction',
                target: `${env.siteUrl}/terapis?search={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            },
            {
              '@type': 'MedicalWebPage',
              name: 'Skrining Tumbuh Kembang Anak (Denver II & KPSP)',
              url: `${env.siteUrl}/tumbuh-kembang`,
              about: 'Deteksi dini keterlambatan perkembangan anak',
              audience: { '@type': 'PeoplePerson', name: 'Orang tua & pengasuh' },
            },
          ],
        }),
      },
    ],
  }),

  component: HomePage,
});

function HomePage() {
  const { stats, articles, threads, events } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-white">
      <HeroSection initialStats={stats} />
      <ServicesSection />
      <HowItWorks />
      <TrustSection />
      <FounderStorySection />
      <ArticlesSection initialArticles={articles} />
      <CommunitySection initialThreads={threads} initialEvents={events} />
      <CTASection />
      <ContactSection />
    </div>
  );
}
