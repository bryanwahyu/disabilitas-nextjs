
import React from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ArticleSummary } from '@/lib/api/types';
import { Calendar, User, ArrowRight, Eye } from 'lucide-react';

const categoryBadgeClass = (category: string) => {
  const map: Record<string, string> = {
    'Kesehatan': 'badge-kesehatan',
    'Terapi': 'badge-terapi',
    'Hukum & Hak': 'badge-hukum',
    'Teknologi': 'badge-teknologi',
    'Pendidikan': 'badge-pendidikan',
    'Karir': 'badge-karir',
    'Sosial': 'badge-sosial',
    'Aksesibilitas': 'badge-aksesibilitas',
    'Olahraga': 'badge-olahraga',
    'Keluarga': 'badge-keluarga',
  };
  return map[category] || 'bg-primary/10 text-primary';
};

interface ArticlesSectionProps {
  initialArticles?: ArticleSummary[];
}

const ArticlesSection = ({ initialArticles }: ArticlesSectionProps = {}) => {
  const { data: articles = [], isPending } = useQuery({
    queryKey: qk.articles.list({ limit: 6, scope: 'beranda' }),
    queryFn: () => unwrap(apiClient.publicArticles.list({ limit: 6 })),
    initialData: initialArticles,
    // Blok beranda: konten jarang berubah, balik ke beranda harus instan dari cache.
    staleTime: 30 * 60 * 1000,
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  };

  if (isPending) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-purple-50/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-500 text-sm">Memuat artikel...</p>
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-purple-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Artikel & Edukasi
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Wawasan Terbaru
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Informasi terpercaya seputar disabilitas, terapi, hak hukum, dan tips kesehatan
          </p>
        </div>

        {/* Featured + grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Featured card (large) */}
          {featured && (
            <Link to="/artikel/$slug" params={{ slug: featured.slug }} className="block">
              <div className="article-card h-full flex flex-col">
                <div className="card-image aspect-[16/10]">
                  {featured.cover_image ? (
                    <img
                      src={featured.cover_image}
                      alt={featured.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <span className="text-4xl opacity-30">📖</span>
                    </div>
                  )}
                </div>
                <div className="card-body flex flex-col flex-1">
                  {featured.category && (
                    <span className={`inline-block self-start px-3 py-1 rounded-full text-xs font-semibold mb-3 ${categoryBadgeClass(featured.category)}`}>
                      {featured.category}
                    </span>
                  )}
                  <h3 className="card-title text-xl sm:text-2xl line-clamp-2 mb-2">
                    {featured.title}
                  </h3>
                  <p className="text-gray-500 text-sm line-clamp-3 mb-4 flex-1">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {featured.author_name || 'Admin'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(featured.published_at || featured.created_at)}
                    </span>
                    {featured.view_count > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {featured.view_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Right side: stacked cards */}
          <div className="flex flex-col gap-4">
            {rest.map((article) => (
              <Link key={article.id} to="/artikel/$slug" params={{ slug: article.slug }} className="block">
                <div className="article-card flex flex-row h-full">
                  <div className="card-image w-32 sm:w-40 flex-shrink-0">
                    {article.cover_image ? (
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        style={{ minHeight: '100%' }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center min-h-[100px]">
                        <span className="text-2xl opacity-30">📖</span>
                      </div>
                    )}
                  </div>
                  <div className="card-body flex flex-col justify-center py-3 px-4 flex-1 min-w-0">
                    {article.category && (
                      <span className={`inline-block self-start px-2.5 py-0.5 rounded-full text-[10px] font-semibold mb-2 ${categoryBadgeClass(article.category)}`}>
                        {article.category}
                      </span>
                    )}
                    <h3 className="card-title text-sm sm:text-base line-clamp-2 mb-1.5">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 text-[11px] text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.published_at || article.created_at)}
                      </span>
                      {article.view_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {article.view_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link
            to="/artikel"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-purple-700 text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            Lihat Semua Artikel
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ArticlesSection;
