import { createFileRoute } from '@tanstack/react-router';
import { getForumThreadForSEO, SITE_URL, truncate, parseTags } from '@/lib/api/seo';
import { metaFrom } from '@/lib/seo/head';
import { ForumPostingJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';
import ThreadClient from './-components/ThreadClient';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';

/**
 * Detail diskusi forum — dari `app/(public)/forum/[id]/page.tsx`.
 *
 * `generateMetadata` + server component async digabung jadi `loader` sekali
 * jalan; `head` dan komponen sama-sama membaca hasilnya.
 */
export const Route = createFileRoute('/_public/forum/$id/')({

  /*
   * Selain data untuk `head`, cache Query ikut dipanaskan supaya isi halaman
   * ter-render di HTML server. Tanpa itu `head`-nya benar tapi `<body>`-nya
   * kosong sampai hidrasi.
   */
  loader: async ({ params, context }) => {
    const [thread] = await Promise.all([
      getForumThreadForSEO(params.id),
      context.queryClient.ensureQueryData({
        queryKey: qk.forum.detail(params.id),
        queryFn: () => unwrap(apiClient.forum.getThread(params.id)),
      }),
    ]);
    return thread;
  },

  head: ({ loaderData: thread, params }) => {
    const url = `${SITE_URL}/forum/${params.id}`;

    if (!thread) {
      return metaFrom({
        title: 'Diskusi Tidak Ditemukan',
        description: 'Diskusi forum yang Anda cari tidak ditemukan di DisabilitasKu.',
      });
    }

    const description =
      truncate(thread.body) || `Diskusi "${thread.title}" di forum komunitas DisabilitasKu.`;
    const author = thread.user?.full_name || 'Pengguna DisabilitasKu';

    return metaFrom({
      title: thread.title,
      description,
      keywords: [
        'forum disabilitas',
        'diskusi disabilitas',
        'komunitas disabilitas',
        ...parseTags(thread.tags),
      ],
      authors: [{ name: author }],
      openGraph: {
        title: thread.title,
        description,
        url,
        type: 'article',
        locale: 'id_ID',
        siteName: 'DisabilitasKu',
        publishedTime: thread.created_at,
        modifiedTime: thread.updated_at,
        authors: [author],
      },
      twitter: { card: 'summary', title: thread.title, description },
      alternates: { canonical: url },
    });
  },

  component: ThreadPage,
});

function ThreadPage() {
  const { id } = Route.useParams();
  const thread = Route.useLoaderData();

  return (
    <>
      {thread && (
        <>
          <ForumPostingJsonLd
            headline={thread.title}
            text={thread.body}
            url={`${SITE_URL}/forum/${id}`}
            datePublished={thread.created_at}
            dateModified={thread.updated_at}
            authorName={thread.user?.full_name}
            commentCount={thread.comments?.length ?? thread.reply_count}
            comments={thread.comments?.slice(0, 10).map((c) => ({
              body: c.body,
              created_at: c.created_at,
              authorName: c.user?.full_name,
            }))}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Beranda', url: SITE_URL },
              { name: 'Forum', url: `${SITE_URL}/forum` },
              { name: thread.title, url: `${SITE_URL}/forum/${id}` },
            ]}
          />
        </>
      )}
      <ThreadClient />
    </>
  );
}
