import { metaFrom } from '@/lib/seo/head';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Users } from 'lucide-react';
import { api } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/komunitas/')({
  head: () => metaFrom(metadata),
  component: KomunitasPage,
});

const metadata = { title: 'Komunitas Saya' };

/**
 * Komunitas yang diikuti terapis.
 *
 * Bergabung dan berdiskusi tetap dilakukan di situs publik — portal ini hanya
 * menampilkan keanggotaan supaya terapis tahu ruang mana yang ia ikuti, dan
 * punya jalan masuk ke sana. Halaman sebelumnya stub tanpa isi apa pun.
 */
function KomunitasPage() {
  const { data, isPending, isError } = useQuery({
    queryKey: qk.terapis.myCommunities.list(),
    queryFn: () => api.getMyCommunities(),
  });

  const communities = (data?.data ?? []).map((c) => ({
    id: c.ID ?? c.id ?? '',
    name: c.Name ?? c.name ?? 'Komunitas',
    description: c.Description ?? c.description ?? '',
  }));

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Komunitas Saya</h1>
      <p className="text-slate-400 text-sm mb-8">
        Ruang komunitas yang Anda ikuti di DisabilitasKu.
      </p>

      {isPending ? (
        <div className="flex items-center gap-3 text-slate-400 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Memuat komunitas…
        </div>
      ) : isError ? (
        <p className="text-sm text-rose-400">Gagal memuat komunitas. Coba muat ulang halaman.</p>
      ) : communities.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <p className="text-white font-medium mb-1">Belum bergabung ke komunitas mana pun</p>
          <p className="text-sm text-slate-400">
            Komunitas dibuka di situs publik.{' '}
            <a
              href="https://disabilitasku.id/komunitas"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2"
            >
              Lihat daftar komunitas
            </a>{' '}
            untuk bergabung.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {communities.map((c) => (
            <li key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-slate-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-white font-medium">{c.name}</p>
                  {c.description && (
                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">{c.description}</p>
                  )}
                  <a
                    href={`https://disabilitasku.id/komunitas/${c.id}`}
                    className="inline-block text-sm text-teal-400 hover:text-teal-300 mt-2"
                  >
                    Buka diskusi →
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
