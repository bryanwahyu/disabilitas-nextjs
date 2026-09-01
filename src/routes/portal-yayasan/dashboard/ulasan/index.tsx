import { createFileRoute } from '@tanstack/react-router';

import { useQuery } from '@tanstack/react-query';
import { Star, Loader2 } from 'lucide-react';
import { api } from '@/lib/yayasan/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-yayasan/dashboard/ulasan/')({
  component: UlasanPage,
});


function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i < n ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
      ))}
    </div>
  );
}

function UlasanPage() {
  const { data: me, isPending: loadingMe } = useQuery({
    queryKey: qk.me(),
    queryFn: () => api.getMe(),
  });
  const uid = me?.ID ?? '';

  const { data: reviews = [], isPending: loadingReviews } = useQuery({
    queryKey: qk.yayasan.reviews.list({ uid }),
    queryFn: () => api.getReviews(uid),
    enabled: !!uid,
    // Backend bisa mengirim null saat belum ada ulasan.
    select: data => (Array.isArray(data) ? data : []),
  });

  const loading = loadingMe || (!!uid && loadingReviews);

  const avg = reviews.length > 0
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Ulasan</h1>
        <p className="text-slate-400 text-sm">Rating dari pengguna layanan yayasan Anda</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Star className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-slate-400 text-sm">Belum ada ulasan.</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 flex items-center gap-8">
            <div className="text-center">
              <p className="text-5xl font-bold text-white">{avg.toFixed(1)}</p>
              <div className="mt-1 flex justify-center"><Stars n={Math.round(avg)} /></div>
              <p className="text-xs text-slate-500 mt-1">{reviews.length} ulasan</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map(n => {
                const c = reviews.filter(r => r.rating === n).length;
                return (
                  <div key={n} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-3">{n}</span>
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(c / reviews.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-4">{c}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-white font-mono text-xs">{r.reviewer_id.slice(0, 8)}…</p>
                  </div>
                  <div className="text-right">
                    <Stars n={r.rating} />
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                {r.comment && <p className="text-sm text-slate-400 italic">"{r.comment}"</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
