import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { BreadcrumbJsonLd } from '@/components/JsonLd';
import { SITE_URL } from '@/lib/api/seo';

/**
 * Layout /terapis.
 *
 * Sebelum file ini ada, seluruh cabang /terapis tidak punya metadata sendiri:
 * judulnya jatuh ke default root ("DisabilitasKu - Platform Inklusif…") dan
 * canonical-nya kosong. Ini halaman pencarian terapis — jalur discovery utama
 * platform — jadi ia mewarisi judul generik yang sama dengan halaman lain.
 */
export const Route = createFileRoute('/_public/terapis')({
  head: () => metaFrom(metadata),
  component: TerapisLayout,
});

/*
 * Canonical TIDAK ditulis di layout ini — `links` route induk ikut menempel di
 * halaman detail dan tidak di-dedup seperti `meta`, jadi canonical daftar akan
 * berdampingan dengan canonical profil terapis. Canonical daftar ada di
 * `index.tsx`, canonical profil di `$id/index.tsx`.
 */
const metadata = {
  title: 'Cari Terapis & Lokasi Terapi Anak Disabilitas',
  description:
    'Temukan terapis dan lokasi terapi terverifikasi di Indonesia — filter berdasarkan metode konsultasi, biaya per sesi, dan penerimaan BPJS.',
  keywords: [
    'cari terapis anak',
    'terapis disabilitas',
    'lokasi terapi anak',
    'terapi wicara',
    'terapi okupasi',
    'terapis BPJS',
  ],
  openGraph: {
    title: 'Cari Terapis & Lokasi Terapi | DisabilitasKu',
    description:
      'Direktori terapis dan lokasi terapi terverifikasi untuk anak penyandang disabilitas di Indonesia.',
    url: `${SITE_URL}/terapis`,
    type: 'website',
    locale: 'id_ID',
    siteName: 'DisabilitasKu',
  },
};

function TerapisLayout() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Beranda', url: SITE_URL },
          { name: 'Terapis', url: `${SITE_URL}/terapis` },
        ]}
      />
      <Outlet />
    </>
  );
}
