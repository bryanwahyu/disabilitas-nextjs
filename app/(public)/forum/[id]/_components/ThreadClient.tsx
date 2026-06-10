'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, type ForumThread, type ForumComment } from '@/lib/api/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ReportButton } from '@/components/ReportDialog';
import { ArrowLeft, Lock } from 'lucide-react';

export default function ThreadClient() {
  const params = useParams();
  const id = params.id as string;
  const [thread, setThread] = useState<(ForumThread & { comments: ForumComment[]; is_locked?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [anonName, setAnonName] = useState('');
  const [asAnonymous, setAsAnonymous] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await apiClient.forum.getThread(id);
    if (!res.error && res.data) setThread(res.data as any);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const addComment = async () => {
    if (!id || !comment) return;

    let res;
    if (user) {
      res = await apiClient.forum.addComment(id, {
        user_id: user.id,
        body: comment,
        is_anonymous: asAnonymous,
      });
    } else {
      res = await apiClient.forum.addAnonymousComment(id, {
        body: comment,
        display_name: anonName || undefined,
      });
    }

    if (res.error) {
      toast({ title: 'Gagal', description: res.error, variant: 'destructive' });
      return;
    }
    setComment('');
    setAnonName('');
    setAsAnonymous(false);
    await load();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-12 px-4 max-w-3xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat diskusi...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-12 px-4 max-w-3xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Diskusi tidak ditemukan</h1>
          <Link href="/forum">
            <Button className="bg-primary hover:bg-primary/90">Kembali ke Forum</Button>
          </Link>
        </main>
      </div>
    );
  }

  const isLocked = Boolean(thread.is_locked);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-12 px-4 max-w-3xl mx-auto space-y-6">
        <Link href="/forum" className="inline-flex items-center text-gray-600 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Forum
        </Link>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">{thread.title}</h1>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-gray-800">{thread.body}</p>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t">
              <span>
                Oleh: {thread.user?.full_name || thread.user?.email || 'Pengguna'} • {new Date(thread.created_at).toLocaleString('id-ID')}
              </span>
              <ReportButton targetType="thread" targetId={thread.id} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Komentar ({thread.comments?.length || 0})</h2>
          {thread.comments?.length === 0 && <div className="text-sm text-gray-600 py-4">Belum ada komentar. Jadilah yang pertama berkomentar!</div>}
          {thread.comments?.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-4">
                <div className="text-sm">{c.body}</div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <span>{c.user?.full_name || c.user?.email || 'Pengguna'} • {new Date(c.created_at).toLocaleString('id-ID')}</span>
                  <ReportButton targetType="reply" targetId={c.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isLocked ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 border rounded-lg px-4 py-3">
            <Lock className="w-4 h-4" />
            Diskusi ini sudah dikunci oleh moderator — tidak bisa menambah komentar baru.
          </div>
        ) : (
          <div className="space-y-2">
            {!user && (
              <Input
                placeholder="Nama (opsional, kosongkan untuk anonim)"
                value={anonName}
                onChange={e => setAnonName(e.target.value)}
              />
            )}
            <div className="flex gap-2">
              <Input
                placeholder={user ? 'Tulis komentar...' : 'Tulis komentar sebagai anonim...'}
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()}
              />
              <Button onClick={addComment} className="bg-primary hover:bg-primary/90">Kirim</Button>
            </div>
            {user && (
              <div className="flex items-start gap-2">
                <Checkbox
                  id="comment_anonymous"
                  checked={asAnonymous}
                  onCheckedChange={(v) => setAsAnonymous(v === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="comment_anonymous" className="font-normal text-xs text-gray-600 leading-snug">
                  Kirim sebagai anonim — nama Anda tidak ditampilkan. Tidak semua hal mudah
                  diceritakan dengan nama terbuka, dan itu tidak apa-apa.
                </Label>
              </div>
            )}
            {!user && (
              <p className="text-xs text-gray-500">Komentar akan ditampilkan sebagai anonim. <Link href="/auth" className="text-primary hover:underline">Masuk</Link> untuk komentar dengan identitas.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
