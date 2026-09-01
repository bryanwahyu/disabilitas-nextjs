
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link, createFileRoute } from '@tanstack/react-router';
import { jsonLdScript } from '@/lib/seo/head';
import { env } from '@/lib/env';

export const Route = createFileRoute('/_public/forum/')({
  // Canonical halaman daftar; dipindah dari layout supaya tidak ikut
  // menempel di halaman detail (lihat catatan di route.tsx).
  /*
   * Breadcrumb JSON-LD ada di halaman daftar, bukan di layout induknya.
   *
   * Saat masih di layout, halaman detail menerima DUA BreadcrumbList: milik
   * layout (Beranda › Forum) dan miliknya sendiri (Beranda › Forum › judul).
   * Dua breadcrumb yang saling bertentangan di satu halaman membuat mesin
   * pencari memilih sendiri mana yang dipakai.
   */
  head: () => ({
    links: [{ rel: 'canonical', href: 'https://disabilitasku.id/forum' }],
    scripts: [
      jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: env.siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Forum', item: `${env.siteUrl}/forum` },
        ],
      }),
    ],
  }),

  /*
   * Isi daftar diambil di loader supaya ikut ter-render di HTML server.
   *
   * Tanpa ini `isPending` selalu true saat SSR: HTML yang dikirim cuma
   * spinner "Memuat…" — tanpa `<h1>` dan tanpa satu pun item. Cache-nya
   * disalurkan ke klien oleh `setupRouterSsrQueryIntegration` di router.tsx,
   * jadi tidak ada request ganda setelah hidrasi.
   */
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: qk.forum.list(),
      queryFn: () => unwrap(apiClient.forum.listThreads()),
    }),

  component: ForumPage,
});


function ForumPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [asAnonymous, setAsAnonymous] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: threads = [], isPending } = useQuery({
    queryKey: qk.forum.list(),
    queryFn: () => unwrap(apiClient.forum.listThreads()),
  });

  const createMutation = useMutation({
    mutationFn: (data: { user_id: string; title: string; body: string; is_anonymous: boolean }) =>
      unwrap(apiClient.forum.createThread(data)),
    onSuccess: () => {
      setTitle('');
      setBody('');
      setAsAnonymous(false);
      queryClient.invalidateQueries({ queryKey: qk.forum.lists() });
      toast({ title: 'Berhasil', description: 'Diskusi dibuat' });
    },
    onError: (err: Error) => {
      toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    },
  });

  const createThread = () => {
    if (!user) {
      toast({ title: 'Perlu login', description: 'Silakan login terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (!title || !body) {
      toast({ title: 'Lengkapi form', description: 'Judul dan isi wajib diisi', variant: 'destructive' });
      return;
    }
    createMutation.mutate({ user_id: user.id, title, body, is_anonymous: asAnonymous });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-12 px-4 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Forum Komunitas <span className="text-primary">DisabilitasKu</span></h1>
        <p className="text-gray-600 mb-8">Tempat berbagi pengalaman, bertanya, dan saling mendukung.</p>

        {user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Buat Diskusi Baru</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input aria-label="Judul diskusi" placeholder="Judul diskusi" value={title} onChange={e => setTitle(e.target.value)} />
              <Textarea placeholder="Tulis isi diskusi" value={body} onChange={e => setBody(e.target.value)} />
              <div className="flex items-start gap-2">
                <Checkbox
                  id="thread_anonymous"
                  checked={asAnonymous}
                  onCheckedChange={(v) => setAsAnonymous(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="thread_anonymous" className="font-normal text-xs text-gray-600 leading-snug">
                  Kirim sebagai anonim — nama Anda tidak ditampilkan. Tidak semua hal mudah
                  diceritakan dengan nama terbuka, dan itu tidak apa-apa.
                </Label>
              </div>
              <div className="text-right">
                <Button onClick={createThread} className="bg-primary hover:bg-primary/90">Kirim</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {isPending ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat diskusi...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.length === 0 && (
              <div className="text-center py-12 text-gray-600">Belum ada diskusi. Jadilah yang pertama membuat diskusi!</div>
            )}
            {threads.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">
                    <Link to="/forum/$id" params={{ id: t.id }} className="text-primary hover:underline">{t.title}</Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 line-clamp-3">{t.body}</p>
                  <div className="text-xs text-gray-500 mt-2">Oleh: {t.user?.full_name || t.user?.email || 'Pengguna'} • {new Date(t.created_at).toLocaleString('id-ID')}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
