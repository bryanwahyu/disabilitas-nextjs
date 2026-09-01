
import React, { useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Calendar, User, Eye, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { categoryBadgeClass, displayAuthorName } from '@/lib/article-utils';
import { jsonLdScript } from '@/lib/seo/head';
import { env } from '@/lib/env';

/** Query daftar artikel — dipakai `loader` (SSR) dan komponen, harus identik. */
const articlesQuery = (category: string) => ({
  queryKey: qk.articles.list({ category }),
  queryFn: () =>
    unwrap(
      apiClient.publicArticles.list({
        limit: 50,
        ...(category !== 'all' && { category }),
      })
    ),
});

const categoriesQuery = {
  queryKey: qk.articles.of('categories'),
  queryFn: () => unwrap(apiClient.publicArticles.categories()),
};

export const Route = createFileRoute('/_public/artikel/')({
  // Canonical halaman daftar; dipindah dari layout supaya tidak ikut
  // menempel di halaman detail (lihat catatan di route.tsx).
  /*
   * Breadcrumb JSON-LD ada di halaman daftar, bukan di layout induknya.
   *
   * Saat masih di layout, halaman detail menerima DUA BreadcrumbList: milik
   * layout (Beranda › Artikel) dan miliknya sendiri (Beranda › Artikel › judul).
   * Dua breadcrumb yang saling bertentangan di satu halaman membuat mesin
   * pencari memilih sendiri mana yang dipakai.
   */
  head: () => ({
    links: [{ rel: 'canonical', href: 'https://disabilitasku.id/artikel' }],
    scripts: [
      jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: env.siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Artikel', item: `${env.siteUrl}/artikel` },
        ],
      }),
    ],
  }),

  /*
   * Daftar artikel diambil di loader, bukan hanya di `useQuery`.
   *
   * Tanpa ini `isPending` selalu true saat render server, sehingga HTML yang
   * dikirim hanya spinner "Memuat artikel..." — tanpa judul, tanpa satu pun
   * artikel, dan tanpa `<h1>`. Yang membaca HTML awal (crawler, pratinjau
   * tautan, koneksi lambat) tidak pernah melihat isi halaman.
   *
   * `setupRouterSsrQueryIntegration` di router.tsx yang menyalurkan hasilnya ke
   * cache Query klien, jadi tidak ada request ulang setelah hidrasi.
   */
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(articlesQuery('all')),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]);
  },

  component: ArticlesPage,
});


function ArticlesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: articles = [], isPending } = useQuery({
    ...articlesQuery(selectedCategory),
    // Ganti kategori tidak mengosongkan layar: daftar lama tetap tampil sampai
    // data baru datang, dan kategori yang pernah dibuka kembali instan dari cache.
    placeholderData: keepPreviousData,
  });

  const { data: categories = [] } = useQuery({
    ...categoriesQuery,
    // Daftar kategori nyaris tak berubah — cukup sekali per sesi.
    staleTime: 30 * 60 * 1000,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-purple-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-purple-50 to-secondary/5 border-b border-purple-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-700 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Artikel & Edukasi</h1>
              </div>
              <p className="text-gray-500 text-sm ml-[52px]">
                Informasi terpercaya seputar disabilitas, terapi, dan kehidupan inklusif
              </p>
            </div>
            <Link to="/">
              <Button variant="outline" className="rounded-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <Input
              aria-label="Cari artikel" placeholder="Cari artikel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-11 rounded-full border-gray-200 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger aria-label="Filter kategori artikel" className="w-full sm:w-[200px] h-11 rounded-full border-gray-200">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        {!isPending && (
          <p className="text-sm text-gray-500 mb-6">
            {filteredArticles.length} artikel ditemukan
          </p>
        )}

        {filteredArticles.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-5 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Tidak ada artikel</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? 'Tidak ditemukan artikel yang sesuai dengan pencarian Anda'
                : 'Belum ada artikel yang dipublikasikan'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Link key={article.id} to="/artikel/$slug" params={{ slug: article.slug }} className="block">
                <div className="article-card h-full flex flex-col">
                  <div className="card-image aspect-[16/10]">
                    {article.cover_image ? (
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center">
                        <span className="text-3xl opacity-30">📖</span>
                      </div>
                    )}
                  </div>
                  <div className="card-body flex flex-col flex-1">
                    {article.category && (
                      <span className={`inline-block self-start px-3 py-1 rounded-full text-[11px] font-semibold mb-3 ${categoryBadgeClass(article.category)}`}>
                        {article.category}
                      </span>
                    )}
                    <h3 className="card-title text-base sm:text-lg line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {displayAuthorName(article.author_name)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(article.published_at || article.created_at)}
                      </span>
                      {article.view_count > 0 && (
                        <span className="flex items-center gap-1.5 ml-auto">
                          <Eye className="w-3.5 h-3.5" />
                          {article.view_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
