import { createFileRoute } from '@tanstack/react-router';
import DenverScreening from '@/components/anak/DenverScreening';
import { metaFrom } from '@/lib/seo/head';
import { env } from '@/lib/env';

const metadata = {
  title: 'Skrining Denver II — Cek Perkembangan Anak',
  description:
    'Skrining Denver II daring untuk memeriksa perkembangan anak di empat sektor: personal sosial, motorik halus, bahasa, dan motorik kasar.',
  keywords: [
    'skrining denver',
    'denver ii',
    'tes perkembangan anak',
    'deteksi dini anak',
    'skrining perkembangan online',
  ],
  openGraph: {
    title: 'Skrining Denver II | DisabilitasKu',
    description: 'Periksa perkembangan anak lewat skrining Denver II daring.',
    url: `${env.siteUrl}/skrining-denver`,
  },
};

/**
 * Skrining Denver II.
 *
 * `useSearchParams` Next diganti `validateSearch` + `Route.useSearch()`:
 * query string diurai sekali di sini, jadi komponen menerima nilai yang sudah
 * bertipe dan tidak perlu lagi `parseInt` di tengah render. Pembungkus
 * `<Suspense>` versi Next juga hilang — dulu wajib karena `useSearchParams`
 * mem-bail-out prerender, sementara di sini search sudah tersedia saat render.
 */
export const Route = createFileRoute('/_public/skrining-denver/')({
  head: () => {
    const head = metaFrom(metadata);
    return {
      ...head,
      // Canonical tanpa query: `?age=`/`?child=` menghasilkan URL tak terbatas
      // untuk satu halaman yang sama.
      links: [...head.links, { rel: 'canonical', href: `${env.siteUrl}/skrining-denver` }],
    };
  },
  validateSearch: (search: Record<string, unknown>): { age?: number; child?: string } => {
    const age = Number(search.age);
    return {
      // `undefined`, bukan `0`: mengembalikan 0 membuat TanStack menormalkan
      // URL dan memantulkan setiap kunjungan `/skrining-denver` ke
      // `/skrining-denver?age=0` lewat 307 — satu redirect percuma di pintu
      // masuk skrining, dan dua URL untuk satu halaman yang sama.
      age: Number.isFinite(age) && age > 0 ? age : undefined,
      child: typeof search.child === 'string' && search.child ? search.child : undefined,
    };
  },
  component: SkriningDenverPage,
});

function SkriningDenverPage() {
  const { age, child } = Route.useSearch();
  return (
    <DenverScreening ageMonth={age ?? 0} childId={child} mode={child ? 'save' : 'public'} />
  );
}
