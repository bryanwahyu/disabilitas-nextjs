
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ContactMessage } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Handshake, Mail, Phone, Trash2, Eye, Clock, Check, Reply, Search,
  Building2, User, FileText,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const PARTNERSHIP_TYPES: Record<string, string> = {
  'Program CSR': 'bg-blue-100 text-blue-700',
  'Event Sponsorship': 'bg-purple-100 text-purple-700',
  'Donasi/Hibah': 'bg-green-100 text-green-700',
  'Kemitraan Teknologi': 'bg-cyan-100 text-cyan-700',
  'Program Edukasi': 'bg-yellow-100 text-yellow-700',
  'Rekrutmen Inklusif': 'bg-orange-100 text-orange-700',
  'Lainnya': 'bg-gray-100 text-gray-700',
};

function parsePartnershipInfo(message: ContactMessage) {
  const subject = message.subject || '';
  const body = message.message || '';
  const nameMatch = message.name?.match(/^(.+?)\s*\((.+?)\)$/);

  const typeMatch = body.match(/Jenis Kemitraan:\s*(.+)/);
  const companyMatch = body.match(/Perusahaan:\s*(.+)/);
  const contactMatch = body.match(/Kontak:\s*(.+)/);
  const proposalMatch = body.split('\n\n').slice(1).join('\n\n');

  return {
    contactName: contactMatch?.[1] || nameMatch?.[1]?.trim() || message.name,
    companyName: companyMatch?.[1] || nameMatch?.[2]?.trim() || '-',
    partnershipType: typeMatch?.[1] || subject.replace('[Kemitraan CSR] ', '').split(' - ')[0] || 'Lainnya',
    proposal: proposalMatch?.trim() || body,
  };
}

const KemitraanManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [replyNote, setReplyNote] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Kemitraan belum punya endpoint sendiri — masih disaring dari pesan kontak.
  const listParams = { limit: 500 };
  const { data: contacts = [], isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.contacts.list(listParams),
    queryFn: () => unwrap(apiClient.adminContacts.list(listParams)),
  });

  const allMessages = contacts.filter((m: ContactMessage) => m.subject?.includes('[Kemitraan'));

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching kemitraan:', listError);
    toast({ title: 'Error', description: 'Gagal mengambil data kemitraan', variant: 'destructive' });
  }, [listError, toast]);

  const invalidateContacts = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.contacts.lists() });

  // GET detail menandai pesan terbaca di server, jadi diperlakukan sebagai mutation.
  const { mutate: openMessage } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminContacts.get(id)),
    onSuccess: (data) => {
      if (!data) return;
      setSelectedMessage(data);
      setReplyNote(data.reply_note || '');
      setDialogOpen(true);
      invalidateContacts();
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      unwrap(apiClient.adminContacts.update(id, { status, reply_note: replyNote || undefined })),
    onSuccess: (_data, { status }) => {
      toast({ title: 'Berhasil', description: `Status diperbarui ke ${status === 'replied' ? 'Sudah Dibalas' : 'Sudah Dibaca'}` });
      setDialogOpen(false);
      invalidateContacts();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Gagal mengubah status', variant: 'destructive' });
    },
  });

  const { mutate: removeMessage } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminContacts.delete(id)),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Proposal dihapus' });
      invalidateContacts();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Gagal menghapus', variant: 'destructive' });
    },
  });

  const handleViewMessage = (message: ContactMessage) => openMessage(message.id);

  const handleUpdateStatus = (id: string, status: string) => updateStatus({ id, status });

  const handleDelete = (id: string) => {
    if (!confirm('Hapus proposal kemitraan ini?')) return;
    removeMessage(id);
  };

  const statusCounts = allMessages.reduce<Record<string, number>>((acc, m) => {
    acc[m.status] = (acc[m.status] || 0) + 1;
    return acc;
  }, {});

  const filteredMessages = allMessages.filter((m) => {
    const info = parsePartnershipInfo(m);
    const matchesSearch =
      info.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      info.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="text-center py-8">Memuat data kemitraan...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={`cursor-pointer hover:shadow-md ${filterStatus === 'all' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilterStatus('all')}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-primary">{allMessages.length}</p>
            <p className="text-xs text-muted-foreground">Total Proposal</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md ${filterStatus === 'unread' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === 'unread' ? 'all' : 'unread')}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-red-600">{statusCounts.unread || 0}</p>
            <p className="text-xs text-muted-foreground">Belum Dibaca</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md ${filterStatus === 'read' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === 'read' ? 'all' : 'read')}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.read || 0}</p>
            <p className="text-xs text-muted-foreground">Ditinjau</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer hover:shadow-md ${filterStatus === 'replied' ? 'ring-2 ring-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === 'replied' ? 'all' : 'replied')}>
          <CardContent className="p-4">
            <p className="text-2xl font-bold text-green-600">{statusCounts.replied || 0}</p>
            <p className="text-xs text-muted-foreground">Direspon</p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="w-5 h-5" />
            Proposal Kemitraan
          </CardTitle>
          <CardDescription>Kelola proposal kemitraan dan CSR yang masuk</CardDescription>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Cari perusahaan atau kontak..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Handshake className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada proposal kemitraan</p>
              <p className="text-sm">Proposal dari halaman Kemitraan akan muncul di sini</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((message) => {
                const info = parsePartnershipInfo(message);
                const typeColor = PARTNERSHIP_TYPES[info.partnershipType] || PARTNERSHIP_TYPES['Lainnya'];
                return (
                  <div
                    key={message.id}
                    className={`border rounded-lg p-4 transition-colors hover:bg-gray-50 ${message.status === 'unread' ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{info.companyName}</h3>
                          <Badge variant="outline" className={typeColor}>{info.partnershipType}</Badge>
                          <Badge variant={message.status === 'unread' ? 'destructive' : message.status === 'replied' ? 'default' : 'secondary'}>
                            {message.status === 'unread' ? 'Baru' : message.status === 'replied' ? 'Direspon' : 'Ditinjau'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {info.contactName}
                          </span>
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
                        </div>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(message.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleViewMessage(message)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Lihat
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          onClick={() => handleDelete(message.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Proposal Kemitraan</DialogTitle>
            <DialogDescription>
              Dari {selectedMessage && parsePartnershipInfo(selectedMessage).companyName}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (() => {
            const info = parsePartnershipInfo(selectedMessage);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Perusahaan</p>
                    <p className="font-medium flex items-center gap-1"><Building2 className="w-4 h-4" />{info.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kontak</p>
                    <p className="font-medium">{info.contactName}</p>
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
                    <p className="text-sm text-gray-500">Jenis Kemitraan</p>
                    <Badge variant="outline" className={PARTNERSHIP_TYPES[info.partnershipType] || PARTNERSHIP_TYPES['Lainnya']}>
                      {info.partnershipType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tanggal Masuk</p>
                    <p className="font-medium">{new Date(selectedMessage.created_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Proposal / Pesan</p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="whitespace-pre-wrap text-sm">{info.proposal}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Catatan Respons</p>
                  <Textarea
                    value={replyNote}
                    onChange={(e) => setReplyNote(e.target.value)}
                    placeholder="Tulis catatan tindak lanjut..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Tutup</Button>
                  {selectedMessage.status !== 'read' && (
                    <Button variant="secondary" onClick={() => handleUpdateStatus(selectedMessage.id, 'read')}>
                      <Check className="w-4 h-4 mr-1" />
                      Tandai Ditinjau
                    </Button>
                  )}
                  <Button onClick={() => handleUpdateStatus(selectedMessage.id, 'replied')}>
                    <Reply className="w-4 h-4 mr-1" />
                    Tandai Direspon
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KemitraanManager;
