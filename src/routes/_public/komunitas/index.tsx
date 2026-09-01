
import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { CommunityCreate } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Users, Plus, Search, MessageSquare, Clock } from 'lucide-react';
import { jsonLdScript } from '@/lib/seo/head';
import { env } from '@/lib/env';

export const Route = createFileRoute('/_public/komunitas/')({
  // Canonical halaman daftar; dipindah dari layout supaya tidak ikut
  // menempel di halaman detail (lihat catatan di route.tsx).
  /*
   * Breadcrumb JSON-LD ada di halaman daftar, bukan di layout induknya.
   *
   * Saat masih di layout, halaman detail menerima DUA BreadcrumbList: milik
   * layout (Beranda › Komunitas) dan miliknya sendiri (Beranda › Komunitas › judul).
   * Dua breadcrumb yang saling bertentangan di satu halaman membuat mesin
   * pencari memilih sendiri mana yang dipakai.
   */
  head: () => ({
    links: [{ rel: 'canonical', href: 'https://disabilitasku.id/komunitas' }],
    scripts: [
      jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: env.siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Komunitas', item: `${env.siteUrl}/komunitas` },
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
      queryKey: qk.communities.list({ q: '' }),
      queryFn: () => unwrap(apiClient.communities.publicList({ per_page: 50 })),
    }),

  component: CommunitiesPage,
});


function parseTags(tagsString?: string): string[] {
  if (!tagsString) return [];
  const cleaned = tagsString.replace(/^\{|\}$/g, '');
  return cleaned ? cleaned.split(',').map((t) => t.trim()).filter(Boolean) : [];
}

function lastActivityLabel(iso?: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return null;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 60) return 'aktif baru saja';
  if (mins < 60 * 24) return `aktif ${Math.floor(mins / 60)} jam lalu`;
  const days = Math.floor(mins / (60 * 24));
  if (days < 30) return `aktif ${days} hari lalu`;
  return `aktif ${new Date(iso).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
}

function CommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CommunityCreate>({
    name: '',
    description: '',
    tags: [],
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: communities = [], isPending } = useQuery({
    queryKey: qk.communities.list({ q: searchQuery }),
    queryFn: () =>
      unwrap(
        apiClient.communities.publicList({
          q: searchQuery || undefined,
          per_page: 50,
        })
      ),
    // Kata kunci yang pernah diketik kembali instan dari cache, tanpa layar kosong.
    placeholderData: keepPreviousData,
  });

  const { data: myCommunities = [] } = useQuery({
    queryKey: qk.communities.of('mine'),
    queryFn: () => unwrap(apiClient.communities.mine()),
    enabled: !!user,
  });

  const { mutate: createCommunity } = useMutation({
    mutationFn: (body: CommunityCreate) => unwrap(apiClient.communities.create(body)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Komunitas berhasil dibuat",
      });
      setDialogOpen(false);
      setFormData({ name: '', description: '', tags: [] });
      qc.invalidateQueries({ queryKey: qk.communities.all() });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat komunitas",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Nama komunitas harus diisi",
        variant: "destructive",
      });
      return;
    }
    createCommunity(formData);
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat komunitas...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Komunitas</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Bergabung dengan komunitas untuk berbagi pengalaman, mendapatkan dukungan, dan terhubung dengan sesama
            </p>
          </div>

          {myCommunities.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Komunitas Saya</h2>
              <div className="flex flex-wrap gap-2">
                {myCommunities.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => navigate({ to: `/komunitas/${c.id}` })}
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    {c.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                aria-label="Cari komunitas"
                placeholder="Cari komunitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {user && (user.role === 'admin' || user.role === 'therapy') && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Komunitas
              </Button>
            )}
          </div>

          {communities.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Komunitas</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? 'Tidak ditemukan komunitas dengan kata kunci tersebut'
                    : 'Belum ada komunitas yang dibuat'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <Card
                  key={community.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate({ to: `/komunitas/${community.id}` })}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {community.member_count} anggota
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {community.thread_count} diskusi
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {community.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {community.description}
                      </p>
                    )}
                    {community.tags && (
                      <div className="flex flex-wrap gap-1">
                        {parseTags(community.tags).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="flex items-center text-primary">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Lihat Diskusi
                      </span>
                      {lastActivityLabel(community.last_activity_at) && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {lastActivityLabel(community.last_activity_at)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Komunitas Baru</DialogTitle>
            <DialogDescription>
              Buat komunitas untuk mengumpulkan orang-orang dengan minat yang sama
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="komunitas-nama">Nama Komunitas *</Label>
              <Input
                id="komunitas-nama"
                placeholder="Nama komunitas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi komunitas"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="komunitas-tags">Tags (pisahkan dengan koma)</Label>
              <Input
                id="komunitas-tags"
                placeholder="aksesibilitas, dukungan, terapi"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Komunitas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
