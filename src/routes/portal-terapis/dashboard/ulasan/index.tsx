import { metaFrom } from '@/lib/seo/head';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Star } from 'lucide-react';
import { api } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/ulasan/')({
  head: () => metaFrom(metadata),
  component: UlasanPage,
});

const metadata = { title: 'Ulasan Klien' };

function Stars({ rating, label }: { rating: number; label?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={label ?? `${rating} dari 5 bintang`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={`h-4 w-4 ${i <= rounded ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
        />
      ))}
    </span>
  );
}

/**
 * Ulasan yang diterima terapis.
 *
 * Backend-nya lengkap sejak lama (`/reviews/:targetId` dan `/summary`), tapi
 * tidak ada satu pun pembungkus di klien — halaman ini stub dan kartu "Rating"
 * di dashboard tidak mungkin terisi. Ulasan hanya dibaca di sini: yang menulis
 * adalah klien, dan terapis tidak boleh menghapus penilaian tentang dirinya.
 */
function UlasanPage() {
  const { data: me } = useQuery({
    queryKey: qk.terapis.profile.detail('me'),
    queryFn: () => api.getMe(),
  });
  const uid = me?.ID ?? '';

  const { data: summary } = useQuery({
    queryKey: qk.terapis.reviews.of('summary', { uid }),
    queryFn: () => api.getReviewSummary(uid),
    enabled: !!uid,
  });

  const { data: reviews, isPending } = useQuery({
    queryKey: qk.terapis.reviews.list({ uid }),
    queryFn: () => api.getReviews(uid),
    enabled: !!uid,
  });

  const items = reviews?.data ?? [];

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Ulasan Klien</h1>
      <p className="text-slate-400 text-sm mb-8">
        Penilaian dari keluarga yang pernah menjalani sesi bersama Anda.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8 flex items-center gap-6">
        <div>
          <p className="text-4xl font-bold text-white leading-none">
            {summary && summary.total_reviews > 0 ? summary.average_rating.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">dari 5</p>
        </div>
        <div>
          <Stars rating={summary?.average_rating ?? 0} />
          <p className="text-sm text-slate-400 mt-1.5">
            {summary?.total_reviews
              ? `${summary.total_reviews} ulasan`
              : 'Belum ada ulasan'}
          </p>
        </div>
      </div>

      {isPending && uid ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat ulasan…
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">
          Belum ada ulasan. Ulasan biasanya masuk setelah sesi ditandai selesai.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white text-sm font-medium">{r.reviewer_name || 'Klien'}</p>
                <Stars rating={r.rating} label={`${r.rating} dari 5 bintang`} />
              </div>
              {r.comment && <p className="text-sm text-slate-300 leading-relaxed">{r.comment}</p>}
              <p className="text-xs text-slate-500 mt-2">
                {new Date(r.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
