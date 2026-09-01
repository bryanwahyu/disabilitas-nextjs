import { createFileRoute } from '@tanstack/react-router';
import { getArticleForSEO, parseTags, truncate } from '@/lib/api/seo';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { env } from '@/lib/env';
import ArticleDetailClient from '../../../-components/ArticleDetailClient';
import { displayAuthorName } from '@/lib/article-utils';

/**
 * Detail artikel — dari `app/(public)/artikel/[slug]/page.tsx`.
 *
 * Route SEO paling berat di app ini, jadi dipakai sebagai pembuktian pola:
 * `head` yang bergantung data hasil `loader` (padanan `generateMetadata` async
 * Next), lengkap dengan JSON-LD Article + Breadcrumb.
 *
 * Penting: data yang dipakai `head` **tidak boleh** di-defer/stream. Yang
 * di-stream baru resolve setelah shell HTML dikirim, jadi tag-nya tidak akan
 * ikut di HTML awal — dan crawler membaca HTML awal.
 */
export const Route = createFileRoute('/_public/artikel/$slug/')({
  /*
   * Dua hal sekaligus: data untuk `head`, dan pemanasan cache Query supaya
   * badan artikel ikut ter-render di HTML server.
   *
   * Sebelumnya `head` punya judul, canonical, dan JSON-LD yang benar, tapi
   * `<body>`-nya hanya kerangka — `ArticleDetailClient` menunggu `useQuery`
   * yang baru jalan setelah hidrasi. Artinya halaman artikel terindeks tanpa
   * satu paragraf pun isi.
   */
  loader: async ({ params, context }) => {
    const [article] = await Promise.all([
      getArticleForSEO(params.slug),
      context.queryClient.ensureQueryData({
        queryKey: qk.articles.detail(params.slug),
        queryFn: () => unwrap(apiClient.publicArticles.get(params.slug)),
      }),
    ]);
    return { article };
  },

  head: ({ loaderData, params }) => {
    const article = loaderData?.article;
    const url = `${env.siteUrl}/artikel/${params.slug}`;

    if (!article) {
      return {
        meta: [
          { title: 'Artikel Tidak Ditemukan | DisabilitasKu' },
          {
            name: 'description',
            content: 'Artikel yang Anda cari tidak ditemukan di DisabilitasKu.',
          },
          { name: 'robots', content: 'noindex, follow' },
        ],
      };
    }

    const description =
      article.excerpt || truncate(`Baca artikel "${article.title}" di DisabilitasKu.`);
    const image = article.cover_image;

    return {
      meta: [
        // Tidak ada `title.template` di TanStack — sufiksnya ditulis manual.
        { title: `${article.title} | DisabilitasKu` },
        { name: 'description', content: description },
        {
          name: 'keywords',
          content: ['artikel disabilitas', ...parseTags(article.tags)].join(', '),
        },
        { name: 'author', content: displayAuthorName(article.author_name) },

        { property: 'og:type', content: 'article' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:site_name', content: 'DisabilitasKu' },
        { property: 'og:title', content: article.title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },
        {
          property: 'article:published_time',
          content: article.published_at || article.created_at,
        },
        { property: 'article:author', content: displayAuthorName(article.author_name) },
        ...(image ? [{ property: 'og:image', content: image }] : []),

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: article.title },
        { name: 'twitter:description', content: description },
        ...(image ? [{ name: 'twitter:image', content: image }] : []),
      ],

      links: [{ rel: 'canonical', href: url }],

      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: article.title,
            description,
            url,
            datePublished: article.published_at || article.created_at,
            author: {
              '@type': 'Person',
              name: displayAuthorName(article.author_name),
            },
            ...(image && { image }),
          }),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Beranda', item: env.siteUrl },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Artikel',
                item: `${env.siteUrl}/artikel`,
              },
              { '@type': 'ListItem', position: 3, name: article.title, item: url },
            ],
          }),
        },
      ],
    };
  },

  component: ArticleDetailClient,
});
