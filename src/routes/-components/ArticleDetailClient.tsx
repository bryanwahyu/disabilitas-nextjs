

import React, { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Link } from '@tanstack/react-router';
import { sanitizeArticleHtml } from '@/lib/sanitize';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { categoryBadgeClass, estimateReadingMinutes, displayAuthorName } from '@/lib/article-utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  User,
  Eye,
  ArrowLeft,
  Tag,
  Clock,
  Link2,
  Check,
  MessageCircle,
} from 'lucide-react';

export default function ArticleDetailClient() {
  const { slug } = useParams({ from: '/_public/artikel/$slug/' });
  const [copied, setCopied] = useState(false);

  const { data: article, isPending, isError } = useQuery({
    queryKey: qk.articles.detail(slug),
    queryFn: () => unwrap(apiClient.publicArticles.get(slug)),
    enabled: !!slug,
  });

  const error = isError ? 'Gagal memuat artikel' : null;

  const { data: relatedPool = [] } = useQuery({
    queryKey: qk.articles.list({ category: article?.category || undefined, limit: 4 }),
    queryFn: () =>
      unwrap(
        apiClient.publicArticles.list({
          category: article?.category || undefined,
          limit: 4,
        })
      ),
    enabled: !!article,
  });

  const related = relatedPool.filter((a) => a.id !== article?.id).slice(0, 3);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const shareWhatsApp = () => {
    if (!article) return;
    const text = encodeURIComponent(`${article.title}\n${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
          <div className="skeleton h-6 w-28" />
          <div className="skeleton h-10 w-full" />
          <div className="skeleton h-10 w-3/4" />
          <div className="skeleton h-5 w-1/2" />
          <div className="skeleton h-64 w-full !rounded-2xl" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-purple-50/30">
        <div className="text-center px-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-5 flex items-center justify-center">
            <Tag className="w-8 h-8 text-gray-300" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {error || 'Artikel tidak ditemukan'}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Artikel mungkin sudah dihapus atau tautannya berubah.
          </p>
          <Link to="/artikel">
            <Button className="rounded-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Artikel
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tags = article.tags?.split(',').map((t) => t.trim()).filter(Boolean) || [];
  const readingMinutes = estimateReadingMinutes(article.content || '');

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50/30">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-purple-100/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/artikel">
              <Button variant="ghost" size="sm" className="rounded-full -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Semua Artikel
              </Button>
            </Link>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={shareWhatsApp}
                aria-label="Bagikan lewat WhatsApp"
              >
                <MessageCircle className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={handleCopyLink}
                aria-label="Salin tautan artikel"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 sm:mr-2 text-green-600" />
                    <span className="hidden sm:inline text-green-600">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Salin Tautan</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <header className="mb-8">
          {article.category && (
            <span
              className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 ${categoryBadgeClass(article.category)}`}
            >
              {article.category}
            </span>
          )}

          <h1 className="text-3xl md:text-[2.5rem] md:leading-[1.2] font-bold text-gray-900 mb-4 tracking-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {article.excerpt}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-purple-200 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </span>
              <span className="font-medium text-gray-700">
                {displayAuthorName(article.author_name)}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(article.published_at || article.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {readingMinutes} menit baca
            </span>
            {article.view_count > 0 && (
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4" />
                {article.view_count} kali dibaca
              </span>
            )}
          </div>
        </header>

        {/* Cover */}
        {article.cover_image && (
          <figure className="mb-10 -mx-4 sm:mx-0">
            <img
              src={article.cover_image}
              alt={article.title}
              fetchPriority="high"
              decoding="async"
              className="w-full aspect-[16/9] object-cover sm:rounded-2xl shadow-lg shadow-purple-100"
            />
          </figure>
        )}

        {/* Body */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{
            __html: sanitizeArticleHtml(article.content || ''),
          }}
        />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-purple-100">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-500" aria-hidden="true" />
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="rounded-full font-normal text-gray-600"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section
          aria-labelledby="artikel-terkait"
          className="border-t border-purple-100/70 bg-white/60"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 id="artikel-terkait" className="text-xl font-bold text-gray-900">
                Artikel Terkait
              </h2>
              <Link
                to="/artikel"
                className="text-sm font-medium text-primary hover:underline underline-offset-4"
              >
                Lihat semua
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((item) => (
                <Link key={item.id} to="/artikel/$slug" params={{ slug: item.slug }} className="block">
                  <div className="article-card h-full flex flex-col">
                    <div className="card-image aspect-[16/10]">
                      {item.cover_image ? (
                        <img
                          src={item.cover_image}
                          alt={item.title}
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
                      {item.category && (
                        <span
                          className={`inline-block self-start px-3 py-1 rounded-full text-[11px] font-semibold mb-3 ${categoryBadgeClass(item.category)}`}
                        >
                          {item.category}
                        </span>
                      )}
                      <h3 className="card-title text-base line-clamp-2 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2 flex-1">
                        {item.excerpt}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
