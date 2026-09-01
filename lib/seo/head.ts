/**
 * Jembatan metadata Next → `head` TanStack Router.
 *
 * Alasan file ini ada: 26 halaman + 5 `generateMetadata` menulis metadata-nya
 * dalam bentuk objek Next (`{ title, description, openGraph, alternates }`).
 * Menulis ulang 31 objek itu satu per satu ke bentuk array `meta[]` adalah
 * pekerjaan mekanis yang gampang salah ketik dan diam-diam menghapus tag SEO.
 * Jadi bentuk objeknya dipertahankan apa adanya, dan fungsi di sinilah yang
 * menerjemahkannya sekali, di satu tempat, dengan hasil yang bisa diuji.
 *
 * Yang TIDAK ditiru dari Next dan harus diingat:
 * - Tidak ada pewarisan metadata dari layout induk. TanStack menggabungkan
 *   `head` sepanjang rantai route, tapi hanya berdasarkan kesamaan `name`/
 *   `property`, jadi apa yang tidak ditulis anak akan memakai punya induk.
 * - Tidak ada `title.template`. Sufiks judul ditulis eksplisit lewat `template`.
 */

export interface OpenGraphMeta {
  title?: string;
  description?: string;
  url?: string;
  type?: string;
  locale?: string;
  siteName?: string;
  images?: ReadonlyArray<string | { url: string; width?: number; height?: number; alt?: string }>;
  /** Khusus `type: 'article'` — jadi `article:published_time` dst. */
  publishedTime?: string;
  modifiedTime?: string;
  authors?: ReadonlyArray<string>;
}

export interface TwitterMeta {
  card?: string;
  title?: string;
  description?: string;
  images?: ReadonlyArray<string>;
}

/** Subset Metadata Next yang benar-benar dipakai repo ini. */
export interface PageMetadata {
  title?: string | { default: string; template?: string };
  description?: string;
  keywords?: ReadonlyArray<string>;
  authors?: ReadonlyArray<{ name: string }>;
  robots?: { index?: boolean; follow?: boolean };
  openGraph?: OpenGraphMeta;
  twitter?: TwitterMeta;
  alternates?: { canonical?: string };
}

type MetaTag = Record<string, string>;

export interface HeadOptions {
  /**
   * Pola judul, `%s` diganti judul halaman. Padanan `title.template` Next yang
   * dulu diwarisi dari layout root. Beri `null` untuk memakai judul apa adanya.
   */
  template?: string | null;
}

const DEFAULT_TEMPLATE = '%s | DisabilitasKu';

function applyTemplate(title: string, template: string | null | undefined): string {
  if (template === null) return title;
  return (template ?? DEFAULT_TEMPLATE).replace('%s', title);
}

/**
 * Ubah objek metadata gaya Next menjadi `{ meta, links }` untuk `head` route.
 *
 * Tag kosong dibuang, bukan dikirim bernilai `undefined`: `<meta content>`
 * kosong lebih buruk daripada tidak ada tag sama sekali karena crawler
 * membacanya sebagai deskripsi kosong yang disengaja.
 */
export function metaFrom(m: PageMetadata, options: HeadOptions = {}) {
  const meta: MetaTag[] = [];
  const links: MetaTag[] = [];

  const rawTitle = typeof m.title === 'string' ? m.title : m.title?.default;
  const title =
    rawTitle === undefined
      ? undefined
      : typeof m.title === 'string'
        ? applyTemplate(rawTitle, options.template)
        : // Bentuk `{ default, template }` dipakai layout portal: `default`
          // adalah judul jadi, bukan potongan yang perlu disufiks.
          rawTitle;

  if (title) meta.push({ title });
  if (m.description) meta.push({ name: 'description', content: m.description });
  if (m.keywords?.length) meta.push({ name: 'keywords', content: m.keywords.join(', ') });
  if (m.authors?.length) {
    meta.push({ name: 'author', content: m.authors.map((a) => a.name).join(', ') });
  }

  if (m.robots) {
    const index = m.robots.index === false ? 'noindex' : 'index';
    const follow = m.robots.follow === false ? 'nofollow' : 'follow';
    meta.push({ name: 'robots', content: `${index}, ${follow}` });
  }

  const og = m.openGraph;
  if (og) {
    const ogTitle = og.title ?? title;
    if (ogTitle) meta.push({ property: 'og:title', content: ogTitle });
    if (og.description ?? m.description) {
      meta.push({ property: 'og:description', content: (og.description ?? m.description)! });
    }
    if (og.url) meta.push({ property: 'og:url', content: og.url });
    meta.push({ property: 'og:type', content: og.type ?? 'website' });
    meta.push({ property: 'og:locale', content: og.locale ?? 'id_ID' });
    meta.push({ property: 'og:site_name', content: og.siteName ?? 'DisabilitasKu' });
    if (og.publishedTime) {
      meta.push({ property: 'article:published_time', content: og.publishedTime });
    }
    if (og.modifiedTime) {
      meta.push({ property: 'article:modified_time', content: og.modifiedTime });
    }
    for (const author of og.authors ?? []) {
      meta.push({ property: 'article:author', content: author });
    }
    for (const img of og.images ?? []) {
      const url = typeof img === 'string' ? img : img.url;
      meta.push({ property: 'og:image', content: url });
      if (typeof img !== 'string') {
        if (img.width) meta.push({ property: 'og:image:width', content: String(img.width) });
        if (img.height) meta.push({ property: 'og:image:height', content: String(img.height) });
        if (img.alt) meta.push({ property: 'og:image:alt', content: img.alt });
      }
    }
  }

  const tw = m.twitter;
  if (tw) {
    meta.push({ name: 'twitter:card', content: tw.card ?? 'summary_large_image' });
    const twTitle = tw.title ?? og?.title ?? title;
    if (twTitle) meta.push({ name: 'twitter:title', content: twTitle });
    const twDesc = tw.description ?? og?.description ?? m.description;
    if (twDesc) meta.push({ name: 'twitter:description', content: twDesc });
    for (const img of tw.images ?? []) meta.push({ name: 'twitter:image', content: img });
  }

  if (m.alternates?.canonical) {
    links.push({ rel: 'canonical', href: m.alternates.canonical });
  }

  return { meta, links };
}

/** Entri `head.scripts` untuk satu blok JSON-LD. */
export function jsonLdScript(data: Record<string, unknown>) {
  return { type: 'application/ld+json', children: JSON.stringify(data) };
}
