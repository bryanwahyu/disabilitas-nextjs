import type { Metadata } from 'next';
import HeroSection from '@/components/HeroSection';
import ServicesSection from '@/components/ServicesSection';
import TherapyLocationFinder from '@/components/TherapistFinder';
import TrustSection from '@/components/TrustSection';
import FounderStorySection from '@/components/FounderStorySection';
import ArticlesSection from '@/components/ArticlesSection';
import CommunitySection from '@/components/CommunitySection';
import TherapyLocationRegistrationForm from '@/components/TherapyLocationRegistrationForm';
import ContactSection from '@/components/ContactSection';
import HowItWorks from '@/components/HowItWorks';
import CTASection from '@/components/CTASection';
import {
  getHomepageStats,
  getHomepageArticles,
  getHomepageThreads,
  getHomepageEvents,
} from '@/lib/api/seo';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'DisabilitasKu.id — Temukan Lokasi Terapi & Layanan Disabilitas di Indonesia',
  description: 'Cari dan temukan 6.000+ lokasi terapi, klinik rehabilitasi, dan terapis di seluruh Indonesia. Platform discovery untuk penyandang disabilitas, orang tua, dan keluarga. Terapi fisik, okupasi, wicara, autisme, CP, dan lebih banyak lagi.',
  keywords: [
    'lokasi terapi disabilitas',
    'klinik rehabilitasi Indonesia',
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
    'cari terapis',
    'yayasan disabilitas',
    'inklusi disabilitas Indonesia',
  ],
  alternates: {
    canonical: 'https://disabilitasku.id',
  },
  openGraph: {
    title: 'DisabilitasKu.id — Temukan Lokasi Terapi & Layanan Disabilitas di Indonesia',
    description: 'Cari 6.000+ lokasi terapi, klinik rehabilitasi, dan terapis di seluruh Indonesia. Dibangun oleh penyandang Cerebral Palsy yang bekerja di teknologi, untuk komunitasnya.',
    url: 'https://disabilitasku.id',
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'DisabilitasKu — Platform Temukan Lokasi Terapi & Layanan Disabilitas Indonesia',
      },
    ],
  },
  twitter: {
    title: 'DisabilitasKu.id — Temukan Lokasi Terapi & Layanan Disabilitas di Indonesia',
    description: 'Cari 6.000+ lokasi terapi di seluruh Indonesia. Platform discovery untuk penyandang disabilitas dan keluarga.',
  },
};

export default async function HomePage() {
  const [stats, articles, threads, events] = await Promise.all([
    getHomepageStats(),
    getHomepageArticles(6),
    getHomepageThreads(4),
    getHomepageEvents(3),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <HeroSection initialStats={stats} />
      <ServicesSection />
      <HowItWorks />
      <TherapyLocationFinder previewLimit={6} />
      <TrustSection />
      <FounderStorySection />
      <ArticlesSection initialArticles={articles} />
      <CommunitySection initialThreads={threads} initialEvents={events} />
      <CTASection />
      <TherapyLocationRegistrationForm />
      <ContactSection />
    </div>
  );
}
