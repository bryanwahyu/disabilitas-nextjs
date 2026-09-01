import { createFileRoute } from '@tanstack/react-router';
import {
  getAllArticleSlugs,
  getAllEventIds,
  getAllCommunityIds,
  getAllForumThreadIds,
  getAllTrainingIds,
  getAllTherapistIds,
} from '@/lib/api/seo';
import { env } from '@/lib/env';

/**
 * `/sitemap.xml` — dari `app/sitemap.ts`.
 *
 * Next mengubah objek `MetadataRoute.Sitemap` jadi XML sendiri; di sini XML-nya
 * ditulis tangan. Isi dan prioritasnya dipertahankan persis supaya peta situs
 * yang sudah diindeks Google tidak berubah bentuk.
 *
 * Nama berkas `sitemap[.]xml.ts`: kurung siku memberi tahu generator route
 * bahwa titiknya bagian dari path, bukan pemisah segmen.
 */

type ChangeFreq = 'daily' | 'weekly' | 'monthly';

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFreq;
  priority: number;
}

/** Tanggal pertama yang bisa diurai; kalau semua gagal, pakai hari ini. */
function safeDate(...candidates: (string | undefined)[]): Date {
  for (const c of candidates) {
    if (!c) continue;
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

const serviceIds = [
  'konsultasi-aksesibilitas',
  'layanan-kesehatan',
  'komunitas-support',
  'program-pelatihan',
  // Kartu "Sumber Belajar" tampil di /layanan tapi tidak pernah ikut sitemap.
  'sumber-belajar',
];

/*
 * Halaman inti produk sempat tidak ada di sini sama sekali: /terapis (halaman
 * pencarian terapis, tujuan utama platform), /tumbuh-kembang, /skrining-denver,
 * /rekomendasi, dan /kemitraan. Yang terindeks hanya halaman statis dan konten
 * — jalur discovery-nya sendiri tidak pernah diberikan ke crawler.
 *
 * /auth, /profil, /dashboard, /jadwal sengaja TIDAK ada di sini; robots.txt
 * melarangnya dan halamannya memang bukan untuk pencarian.
 */
const STATIC_ROUTES: ReadonlyArray<[path: string, freq: ChangeFreq, priority: number]> = [
  ['', 'daily', 1],
  ['/terapis', 'daily', 0.95],
  ['/layanan', 'weekly', 0.9],
  ['/tumbuh-kembang', 'weekly', 0.85],
  ['/skrining-denver', 'monthly', 0.8],
  ['/konsultasi/mulai', 'monthly', 0.8],
  ['/rekomendasi', 'weekly', 0.7],
  ['/artikel', 'daily', 0.8],
  ['/forum', 'daily', 0.8],
  ['/acara', 'weekly', 0.7],
  ['/komunitas', 'weekly', 0.7],
  ['/pelatihan', 'weekly', 0.7],
  ['/tentang', 'monthly', 0.6],
  ['/cara-kerja', 'monthly', 0.6],
  ['/faq', 'monthly', 0.5],
  ['/bantuan', 'monthly', 0.5],
  ['/aksesibilitas', 'monthly', 0.4],
  ['/keamanan', 'monthly', 0.4],
  ['/kemitraan', 'monthly', 0.4],
  ['/keluhan', 'monthly', 0.3],
  ['/syarat-ketentuan', 'monthly', 0.3],
];

/** Lolos-kan karakter yang tidak sah di dalam XML (& di query string, dll). */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toXml(entries: ReadonlyArray<SitemapEntry>): string {
  const body = entries
    .map(
      (e) =>
        `  <url>\n` +
        `    <loc>${escapeXml(e.url)}</loc>\n` +
        `    <lastmod>${e.lastModified.toISOString()}</lastmod>\n` +
        `    <changefreq>${e.changeFrequency}</changefreq>\n` +
        `    <priority>${e.priority}</priority>\n` +
        `  </url>`
    )
    .join('\n');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
}

async function buildSitemap(): Promise<string> {
  const baseUrl = env.siteUrl;
  const now = new Date();

  const staticRoutes: SitemapEntry[] = STATIC_ROUTES.map(([path, changeFrequency, priority]) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const serviceRoutes: SitemapEntry[] = serviceIds.map((id) => ({
    url: `${baseUrl}/layanan/${id}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const [articles, events, communities, threads, trainings, therapists] = await Promise.all([
    getAllArticleSlugs(),
    getAllEventIds(),
    getAllCommunityIds(),
    getAllForumThreadIds(),
    getAllTrainingIds(),
    getAllTherapistIds(),
  ]);

  return toXml([
    ...staticRoutes,
    ...serviceRoutes,
    ...articles.map((a) => ({
      url: `${baseUrl}/artikel/${a.slug}`,
      lastModified: safeDate(a.updated_at, a.published_at, a.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...events.map((e) => ({
      url: `${baseUrl}/acara/${e.id}`,
      lastModified: safeDate(e.updated_at, e.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...communities.map((c) => ({
      url: `${baseUrl}/komunitas/${c.id}`,
      lastModified: safeDate(c.updated_at, c.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...threads.map((t) => ({
      url: `${baseUrl}/forum/${t.id}`,
      lastModified: safeDate(t.updated_at, t.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.5,
    })),
    ...trainings.map((t) => ({
      url: `${baseUrl}/pelatihan/${t.id}`,
      lastModified: safeDate(t.updated_at, t.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...therapists.map((t) => ({
      url: `${baseUrl}/terapis/${t.id}`,
      lastModified: safeDate(t.updated_at, t.created_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]);
}

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () =>
        new Response(await buildSitemap(), {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            // `revalidate = 3600` versi Next diganti cache header: satu jam di
            // CDN/proxy, dan boleh disajikan basi selagi diperbarui.
            'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
          },
        }),
    },
  },
});
