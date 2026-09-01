

import React, { useState, useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ContactMessage } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, Trash2, Eye, MessageSquare, Clock, Check, Reply } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ContactManager = () => {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyNote, setReplyNote] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listParams: { status?: string; limit: number } = { limit: 100 };
  if (filterStatus !== 'all') listParams.status = filterStatus;

  const { data: messages = [], isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.contacts.list(listParams),
    queryFn: () => unwrap(apiClient.adminContacts.list(listParams)),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching messages:', listError);
    toast({
      title: "Error",
      description: "Gagal mengambil data pesan",
      variant: "destructive",
    });
  }, [listError, toast]);

  // Membuka pesan menandainya terbaca di server, jadi ini mutation walau lewat GET.
  const { mutate: openMessage } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminContacts.get(id)),
    onSuccess: (data) => {
      if (!data) return;
      setSelectedMessage(data);
      setReplyNote(data.reply_note || '');
      setDialogOpen(true);
      queryClient.invalidateQueries({ queryKey: qk.admin.contacts.lists() });
    },
    onError: (error) => {
      console.error('Error fetching message:', error);
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrap(apiClient.adminContacts.update(id, { status, reply_note: replyNote || undefined })),
    onSuccess: (_data, { status }) => {
      toast({
        title: "Berhasil",
        description: `Status pesan berhasil diubah ke ${status}`,
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: qk.admin.contacts.lists() });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status pesan",
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteMessage } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminContacts.delete(id)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Pesan berhasil dihapus",
      });
      queryClient.invalidateQueries({ queryKey: qk.admin.contacts.lists() });
    },
    onError: (error) => {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus pesan",
        variant: "destructive",
      });
    },
  });

  const handleViewMessage = (message: ContactMessage) => openMessage(message.id);

  const handleUpdateStatus = (id: string, status: string) => updateStatus({ id, status });

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pesan ini?')) return;
    deleteMessage(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Belum Dibaca</Badge>;
      case 'read':
        return <Badge variant="secondary">Sudah Dibaca</Badge>;
      case 'replied':
        return <Badge variant="default">Sudah Dibalas</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Memuat pesan kontak...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Pesan Kontak
            </CardTitle>
            <CardDescription>
              Kelola pesan yang masuk dari formulir kontak
            </CardDescription>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pesan</SelectItem>
              <SelectItem value="unread">Belum Dibaca</SelectItem>
              <SelectItem value="read">Sudah Dibaca</SelectItem>
              <SelectItem value="replied">Sudah Dibalas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada pesan</p>
            <p className="text-sm">Pesan dari formulir kontak akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-4 ${message.status === 'unread' ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{message.name}</h3>
                      {getStatusBadge(message.status)}
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">{message.subject}</p>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-2">{message.message}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {message.email}
                      </span>
                      {message.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {message.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewMessage(message)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(message.id)}
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
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Pesan</DialogTitle>
            <DialogDescription>
              Pesan dari {selectedMessage?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nama</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedMessage.email}</p>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Telepon</p>
                    <p className="font-medium">{selectedMessage.phone}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="font-medium">{formatDate(selectedMessage.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Subjek</p>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Pesan</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Catatan Balasan (Opsional)</p>
                <Textarea
                  value={replyNote}
                  onChange={(e) => setReplyNote(e.target.value)}
                  placeholder="Tulis catatan atau respons..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Tutup
                </Button>
                {selectedMessage.status !== 'read' && (
                  <Button
                    variant="secondary"
                    onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Tandai Sudah Dibaca
                  </Button>
                )}
                <Button
                  onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}
                >
                  <Reply className="w-4 h-4 mr-2" />
                  Tandai Sudah Dibalas
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ContactManager;
