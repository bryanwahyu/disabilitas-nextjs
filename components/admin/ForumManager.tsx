
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ForumThread, ForumComment } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  MessageSquare,
  Search,
  Pin,
  PinOff,
  Trash2,
  Eye,
  MessageCircle,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  XCircle,
  CheckCircle,
  User,
} from 'lucide-react';

const ForumManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('threads');

  // Detail dialog
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'thread' | 'reply'; id: string; title?: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const statsQuery = useQuery({
    queryKey: qk.admin.forum.of('stats'),
    queryFn: () => unwrap(apiClient.adminForum.getStats()),
  });

  const threadsParams = { limit: 100 };
  const threadsQuery = useQuery({
    queryKey: qk.admin.forum.list({ resource: 'threads', ...threadsParams }),
    queryFn: () => unwrap(apiClient.adminForum.listThreads(threadsParams)),
  });

  const repliesParams = { limit: 100 };
  const repliesQuery = useQuery({
    queryKey: qk.admin.forum.list({ resource: 'replies', ...repliesParams }),
    queryFn: () => unwrap(apiClient.adminForum.listReplies(repliesParams)),
  });

  const stats = statsQuery.data ?? { total_threads: 0, total_replies: 0 };
  const threads: ForumThread[] = Array.isArray(threadsQuery.data) ? threadsQuery.data : [];
  const replies: ForumComment[] = Array.isArray(repliesQuery.data) ? repliesQuery.data : [];
  const loading = statsQuery.isPending || threadsQuery.isPending || repliesQuery.isPending;

  const listError = statsQuery.error || threadsQuery.error || repliesQuery.error;
  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching forum data:', listError);
    toast({
      title: 'Error',
      description: 'Gagal mengambil data forum',
      variant: 'destructive',
    });
  }, [listError, toast]);

  const detailQuery = useQuery({
    queryKey: qk.admin.forum.detail(selectedThreadId ?? ''),
    queryFn: () => unwrap(apiClient.adminForum.getThread(selectedThreadId!)),
    enabled: !!selectedThreadId,
  });

  const selectedThread = (detailQuery.data ?? null) as (ForumThread & { comments?: ForumComment[] }) | null;
  const detailLoading = !!selectedThreadId && detailQuery.isPending;

  useEffect(() => {
    if (!detailQuery.error) return;
    console.error('Error fetching thread detail:', detailQuery.error);
    toast({
      title: 'Error',
      description: 'Gagal mengambil detail thread',
      variant: 'destructive',
    });
  }, [detailQuery.error, toast]);

  const refreshForum = () => {
    queryClient.invalidateQueries({ queryKey: qk.admin.forum.all() });
  };

  const handleViewThread = (thread: ForumThread) => {
    setSelectedThreadId(thread.id);
    setDetailDialogOpen(true);
  };

  const { mutate: togglePin } = useMutation({
    mutationFn: (thread: ForumThread) =>
      unwrap(apiClient.adminForum.updateThread(thread.id, { is_pinned: !thread.is_pinned })),
    onSuccess: (_data, thread) => {
      toast({
        title: 'Berhasil',
        description: thread.is_pinned ? 'Thread berhasil di-unpin' : 'Thread berhasil di-pin',
      });
      refreshForum();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengubah status pin',
        variant: 'destructive',
      });
    },
  });

  const handlePinThread = (thread: ForumThread) => togglePin(thread);

  const handleDeleteConfirm = (type: 'thread' | 'reply', id: string, title?: string) => {
    setDeleteTarget({ type, id, title });
    setDeleteDialogOpen(true);
  };

  const { mutate: removeContent, isPending: deleteLoading } = useMutation({
    mutationFn: (target: { type: 'thread' | 'reply'; id: string }) =>
      target.type === 'thread'
        ? unwrap(apiClient.adminForum.deleteThread(target.id))
        : unwrap(apiClient.adminForum.deleteReply(target.id)),
    onSuccess: (_data, target) => {
      toast({
        title: 'Berhasil',
        description: `${target.type === 'thread' ? 'Thread' : 'Balasan'} berhasil dihapus`,
      });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      refreshForum();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menghapus',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    removeContent(deleteTarget);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>;
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-800">Ditutup</Badge>;
      case 'hidden':
        return <Badge className="bg-red-100 text-red-800">Disembunyikan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredThreads = threads.filter(
    (thread) =>
      thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      thread.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReplies = replies.filter(
    (reply) =>
      reply.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reply.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort: pinned first, then by date
  const sortedThreads = [...filteredThreads].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Memuat data forum...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_threads}</p>
                <p className="text-sm text-gray-500">Total Thread</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total_replies}</p>
                <p className="text-sm text-gray-500">Total Balasan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Pin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {threads.filter((t) => t.is_pinned).length}
                </p>
                <p className="text-sm text-gray-500">Thread Dipin</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total_threads > 0
                    ? Math.round(stats.total_replies / stats.total_threads)
                    : 0}
                </p>
                <p className="text-sm text-gray-500">Rata-rata Balasan</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Kelola Forum</CardTitle>
              <CardDescription>Moderasi thread dan balasan forum</CardDescription>
            </div>
            <Button variant="outline" onClick={refreshForum}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Cari thread atau balasan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="threads">
                Thread ({filteredThreads.length})
              </TabsTrigger>
              <TabsTrigger value="replies">
                Balasan ({filteredReplies.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="threads">
              {sortedThreads.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada thread ditemukan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className={`border rounded-lg p-4 ${
                        thread.is_pinned ? 'bg-yellow-50 border-yellow-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {thread.is_pinned && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Pin className="w-3 h-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            {getStatusBadge(thread.status)}
                          </div>
                          <h3 className="font-semibold text-lg truncate">{thread.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-2 mt-1">{thread.body}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {thread.user?.full_name || thread.user?.email || 'Anonim'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(thread.created_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {thread.reply_count || 0} balasan
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewThread(thread)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePinThread(thread)}
                            className={thread.is_pinned ? 'text-yellow-600' : ''}
                          >
                            {thread.is_pinned ? (
                              <PinOff className="w-4 h-4" />
                            ) : (
                              <Pin className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteConfirm('thread', thread.id, thread.title)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="replies">
              {filteredReplies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Tidak ada balasan ditemukan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReplies.map((reply) => (
                    <div key={reply.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 line-clamp-3">{reply.body}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {reply.user?.full_name || reply.user?.email || 'Anonim'}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDate(reply.created_at)}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteConfirm('reply', reply.id)}
                          className="text-red-600 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Thread Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Thread</DialogTitle>
            <DialogDescription>
              Lihat thread dan semua balasannya
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : selectedThread ? (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {selectedThread.is_pinned && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Pin className="w-3 h-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                  {getStatusBadge(selectedThread.status)}
                </div>
                <h3 className="font-semibold text-lg">{selectedThread.title}</h3>
                <p className="text-gray-600 mt-2 whitespace-pre-wrap">{selectedThread.body}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span>
                    Oleh: {selectedThread.user?.full_name || selectedThread.user?.email || 'Anonim'}
                  </span>
                  <span>{formatDate(selectedThread.created_at)}</span>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">
                  Balasan ({selectedThread.comments?.length || 0})
                </h4>
                {selectedThread.comments && selectedThread.comments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedThread.comments.map((comment) => (
                      <div key={comment.id} className="border-l-2 border-gray-200 pl-4 py-2">
                        <p className="text-gray-800">{comment.body}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>{comment.user?.full_name || comment.user?.email || 'Anonim'}</span>
                          <span>{formatDate(comment.created_at)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDetailDialogOpen(false);
                              handleDeleteConfirm('reply', comment.id);
                            }}
                            className="text-red-600 hover:text-red-700 h-6 px-2"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Belum ada balasan</p>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus {deleteTarget?.type === 'thread' ? 'thread' : 'balasan'} ini?
              {deleteTarget?.title && (
                <span className="block mt-2 font-medium text-gray-900">
                  &ldquo;{deleteTarget.title}&rdquo;
                </span>
              )}
              <span className="block mt-2 text-red-600">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ForumManager;
