
import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Users,
  Calendar,
  MessageSquare,
  Plus,
  LogIn,
  LogOut,
  MapPin,
  Video,
  Check,
} from 'lucide-react';
import type { RSVPStatus } from '@/lib/api/types';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Link } from '@tanstack/react-router';

export default function KomunitasDetailClient() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showThreadForm, setShowThreadForm] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadBody, setThreadBody] = useState('');
  const [threadAnonymous, setThreadAnonymous] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rsvpedIds, setRsvpedIds] = useState<Set<string>>(new Set());

  const communityId = params.id as string;

  const {
    data: community,
    isPending: communityPending,
    isError: communityError,
  } = useQuery({
    queryKey: qk.communities.detail(communityId),
    queryFn: () => unwrap(apiClient.communities.publicGet(communityId)),
    enabled: !!communityId,
  });

  const { data: threads = [], isPending: threadsPending } = useQuery({
    queryKey: qk.forum.list({ community_id: communityId, limit: 20 }),
    queryFn: () => unwrap(apiClient.forum.listThreads({ community_id: communityId, limit: 20 })),
    enabled: !!communityId,
  });

  const { data: events = [], isPending: eventsPending } = useQuery({
    queryKey: qk.events.list({ community_id: communityId }),
    queryFn: () => unwrap(apiClient.events.list({ community_id: communityId })),
    enabled: !!communityId,
    // Server sudah memfilter by community_id; fallback filter menjaga bila endpoint mengabaikannya.
    select: (list) => list.filter((e) => e.community_id === communityId),
  });

  const { data: myCommunities = [] } = useQuery({
    queryKey: qk.communities.of('mine'),
    queryFn: () => unwrap(apiClient.communities.mine()),
    enabled: !!user && !!communityId,
  });
  const isMember = myCommunities.some((c) => c.id === communityId);

  const loading = communityPending || threadsPending || eventsPending;
  const error = communityError ? 'Komunitas tidak ditemukan' : null;

  const { mutate: joinLeave, isPending: joining } = useMutation({
    mutationFn: (leaving: boolean) =>
      unwrap(
        leaving
          ? apiClient.communities.leave(communityId)
          : apiClient.communities.join(communityId)
      ),
    onSuccess: (_data, leaving) => {
      toast({
        title: 'Berhasil',
        description: leaving
          ? 'Anda keluar dari komunitas ini'
          : `Selamat bergabung di ${community?.name}`,
      });
      // Jumlah anggota di header ikut berubah, jadi detail komunitas ikut disegarkan.
      qc.invalidateQueries({ queryKey: qk.communities.all() });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
    },
  });

  const handleJoinClick = () => {
    if (!user) {
      navigate({ to: '/auth' });
      return;
    }
    if (!isMember) {
      // tampilkan aturan komunitas sebelum gabung pertama kali
      setRulesOpen(true);
      return;
    }
    doJoinLeave();
  };

  const doJoinLeave = () => {
    if (!user) return;
    setRulesOpen(false);
    joinLeave(isMember);
  };

  const { mutate: createThread, isPending: posting } = useMutation({
    mutationFn: (body: { title: string; body: string; is_anonymous: boolean }) =>
      unwrap(apiClient.communities.createThread(communityId, body)),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Diskusi dibuat' });
      setThreadTitle('');
      setThreadBody('');
      setThreadAnonymous(false);
      setShowThreadForm(false);
      qc.invalidateQueries({ queryKey: qk.forum.lists() });
      qc.invalidateQueries({ queryKey: qk.communities.detail(communityId) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal membuat diskusi',
        variant: 'destructive',
      });
    },
  });

  const handleCreateThread = () => {
    if (!threadTitle.trim() || !threadBody.trim()) {
      toast({
        title: 'Error',
        description: 'Judul dan isi diskusi harus diisi',
        variant: 'destructive',
      });
      return;
    }
    createThread({
      title: threadTitle.trim(),
      body: threadBody.trim(),
      is_anonymous: threadAnonymous,
    });
  };

  const { mutate: rsvp, isPending: rsvping, variables: rsvpVars } = useMutation({
    mutationFn: (vars: { eventId: string; status: RSVPStatus }) =>
      unwrap(apiClient.events.rsvp(vars.eventId, vars.status)),
    onSuccess: (_data, vars) => {
      setRsvpedIds((prev) => new Set(prev).add(vars.eventId));
      toast({ title: 'Berhasil', description: 'Kehadiran Anda tercatat. Sampai jumpa!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Gagal', description: error.message || 'Gagal mencatat kehadiran', variant: 'destructive' });
    },
  });
  const rsvpingId = rsvping ? rsvpVars?.eventId ?? null : null;

  // Quick RSVP langsung dari kartu komunitas — tanpa pindah halaman.
  const handleQuickRSVP = (eventId: string, status: RSVPStatus = 'going') => {
    if (!user) {
      navigate({ to: '/auth' });
      return;
    }
    rsvp({ eventId, status });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-48 w-full mb-6" />
            <Skeleton className="h-32 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Komunitas Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate({ to: '/komunitas' })}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Komunitas
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const tags = community.tags ? community.tags.replace(/[{}]/g, '').split(',').filter(Boolean) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/komunitas' })}
            className="mb-6 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Komunitas
          </Button>

          {/* Community Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {community.name}
                  </h1>
                  {community.description && (
                    <p className="text-gray-600 mb-4">{community.description}</p>
                  )}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tags.map((tag, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tag.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {community.member_count} anggota
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {community.thread_count} diskusi
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Dibuat {new Date(community.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={handleJoinClick}
                  disabled={joining}
                  variant={isMember ? 'outline' : 'default'}
                >
                  {isMember ? (
                    <>
                      <LogOut className="w-4 h-4 mr-2" />
                      {joining ? 'Memproses...' : 'Keluar Komunitas'}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      {joining ? 'Memproses...' : 'Gabung Komunitas'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Community events */}
          {events.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Acara Komunitas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {events.slice(0, 3).map((event) => {
                  const rsvped = rsvpedIds.has(event.id);
                  return (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 border rounded-lg p-3 transition-colors hover:bg-gray-50"
                    >
                      {event.mode === 'online' ? (
                        <Video className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                      <Link to="/acara/$id" params={{ id: event.id }} className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate hover:text-primary">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.start_at).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </Link>
                      <Button
                        size="sm"
                        variant={rsvped ? 'outline' : 'default'}
                        disabled={rsvped || rsvpingId === event.id}
                        onClick={() => handleQuickRSVP(event.id)}
                        className="flex-shrink-0"
                      >
                        {rsvped ? (
                          <><Check className="h-4 w-4 mr-1" /> Hadir</>
                        ) : rsvpingId === event.id ? (
                          'Memproses...'
                        ) : (
                          'Saya Hadir'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Threads */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Diskusi Terbaru</h2>
              {user && !showThreadForm && (
                <Button onClick={() => setShowThreadForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Diskusi
                </Button>
              )}
              {!user && (
                <Button variant="outline" onClick={() => navigate({ to: '/auth' })}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Login untuk Berdiskusi
                </Button>
              )}
            </div>

            {showThreadForm && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Diskusi Baru</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="thread_title">Judul *</Label>
                    <Input
                      id="thread_title"
                      placeholder="Apa yang ingin Anda diskusikan?"
                      value={threadTitle}
                      onChange={(e) => setThreadTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thread_body">Isi *</Label>
                    <Textarea
                      id="thread_body"
                      placeholder="Ceritakan lebih detail — pengalaman, pertanyaan, atau hal yang ingin dibagikan"
                      rows={4}
                      value={threadBody}
                      onChange={(e) => setThreadBody(e.target.value)}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="community_thread_anonymous"
                      checked={threadAnonymous}
                      onCheckedChange={(v) => setThreadAnonymous(v === true)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="community_thread_anonymous"
                      className="font-normal text-xs text-gray-600 leading-snug"
                    >
                      Kirim sebagai anonim — nama Anda tidak ditampilkan. Tidak semua hal
                      mudah diceritakan dengan nama terbuka, dan itu tidak apa-apa.
                    </Label>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowThreadForm(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleCreateThread} disabled={posting}>
                      {posting ? 'Mengirim...' : 'Kirim Diskusi'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {threads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Diskusi</h3>
                  <p className="text-gray-500 mb-4">
                    Jadilah yang pertama memulai diskusi di komunitas ini.
                  </p>
                  {user && !showThreadForm && (
                    <Button onClick={() => setShowThreadForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Mulai Diskusi
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <Link key={thread.id} to="/forum/$id" params={{ id: thread.id }} className="block">
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="py-4">
                        <h3 className="font-medium text-gray-900 mb-2">{thread.title}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{thread.body}</p>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>
                            {new Date(thread.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Aturan komunitas — ditampilkan sebelum gabung pertama kali */}
      <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selamat Datang di {community.name}</DialogTitle>
            <DialogDescription>
              Sebelum bergabung, ini kesepakatan kita bersama:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• <strong>Tidak ada penghakiman</strong> — setiap keluarga punya perjalanan berbeda.</li>
            <li>• <strong>Tidak ada nada kasihan atau stigma</strong> — semua orang di sini manusia seutuhnya.</li>
            <li>• <strong>Bukan tempat jualan</strong> — dilarang promosi obat atau janji kesembuhan.</li>
            <li>• <strong>Jaga privasi</strong> — cerita di sini bukan untuk disebarluaskan.</li>
            <li>• <strong>Boleh anonim</strong> — dan laporkan konten yang tidak pada tempatnya.</li>
          </ul>
          <p className="text-xs text-gray-500">
            Selengkapnya di{' '}
            <Link to="/komunitas/aturan" className="text-primary hover:underline" target="_blank">
              Aturan Komunitas
            </Link>
            .
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRulesOpen(false)}>
              Batal
            </Button>
            <Button onClick={doJoinLeave} disabled={joining}>
              Setuju & Gabung
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
