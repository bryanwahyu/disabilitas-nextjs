'use client';

import { useEffect, useState } from 'react';
import { apiClient, type ForumThread } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function ForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [asAnonymous, setAsAnonymous] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const res = await apiClient.forum.listThreads();
    if (!res.error && Array.isArray(res.data)) setThreads(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const createThread = async () => {
    if (!user) {
      toast({ title: 'Perlu login', description: 'Silakan login terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (!title || !body) {
      toast({ title: 'Lengkapi form', description: 'Judul dan isi wajib diisi', variant: 'destructive' });
      return;
    }
    const res = await apiClient.forum.createThread({ user_id: user.id, title, body, is_anonymous: asAnonymous });
    if (res.error) {
      toast({ title: 'Gagal', description: res.error, variant: 'destructive' });
      return;
    }
    setTitle('');
    setBody('');
    setAsAnonymous(false);
    await load();
    toast({ title: 'Berhasil', description: 'Diskusi dibuat' });
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
              <Input placeholder="Judul diskusi" value={title} onChange={e => setTitle(e.target.value)} />
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

        {loading ? (
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
                    <Link href={`/forum/${t.id}`} className="text-primary hover:underline">{t.title}</Link>
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
