
import React, { useState, useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageSquareWarning, Paperclip, Download } from 'lucide-react';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Complaint } from '@/lib/api/types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  baru: { label: 'Baru', color: 'bg-blue-100 text-blue-800' },
  diproses: { label: 'Diproses', color: 'bg-amber-100 text-amber-800' },
  selesai: { label: 'Selesai', color: 'bg-emerald-100 text-emerald-800' },
};

const FILTERS = [
  { value: 'all', label: 'Semua' },
  { value: 'baru', label: 'Baru' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
];

function formatDate(s?: string) {
  if (!s) return '-';
  return new Date(s).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ComplaintManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [active, setActive] = useState<Complaint | null>(null);
  const [status, setStatus] = useState('baru');
  const [reply, setReply] = useState('');

  const listParams = { status: filter !== 'all' ? filter : undefined, limit: 100 };
  const { data: items = [], isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.complaints.list(listParams),
    queryFn: () => unwrap(apiClient.adminComplaints.list(listParams)),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!listError) return;
    console.error('fetch complaints error:', listError);
    toast({ title: 'Gagal memuat keluhan', variant: 'destructive' });
  }, [listError, toast]);

  const openDetail = (c: Complaint) => {
    setActive(c);
    setStatus(c.status);
    setReply(c.admin_reply || '');
  };

  // URL unduh bersifat sekali pakai, jadi tidak di-cache sebagai query.
  const { mutate: openAttachment } = useMutation({
    mutationFn: (key: string) => unwrap(apiClient.uploads.download(key)),
    onSuccess: (data) => {
      if (!data?.download_url) {
        toast({ title: 'Gagal membuka lampiran', variant: 'destructive' });
        return;
      }
      window.open(data.download_url, '_blank', 'noopener,noreferrer');
    },
    onError: () => {
      toast({ title: 'Gagal membuka lampiran', variant: 'destructive' });
    },
  });

  const { mutate: saveComplaint, isPending: saving } = useMutation({
    mutationFn: (payload: { id: string; status: string; admin_reply?: string }) =>
      unwrap(apiClient.adminComplaints.update(payload.id, {
        status: payload.status,
        admin_reply: payload.admin_reply,
      })),
    onSuccess: () => {
      toast({ title: 'Keluhan diperbarui', description: 'Notifikasi terkirim ke pengguna.' });
      setActive(null);
      queryClient.invalidateQueries({ queryKey: qk.admin.complaints.lists() });
    },
    onError: (e) => {
      toast({ title: 'Gagal menyimpan', description: e instanceof Error ? e.message : '', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    if (!active) return;
    saveComplaint({ id: active.id, status, admin_reply: reply.trim() || undefined });
  };

  const attachments = active?.attachments ? active.attachments.split(',').map((k) => k.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareWarning className="h-6 w-6" /> Keluhan
        </h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Memuat...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground">Tidak ada keluhan.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const st = STATUS_CONFIG[c.status] || { label: c.status, color: 'bg-gray-100 text-gray-800' };
            return (
              <Card key={c.id} className="cursor-pointer hover:bg-muted/40" onClick={() => openDetail(c)}>
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{c.subject}</p>
                      <Badge className={st.color}>{st.label}</Badge>
                      {c.category && <Badge variant="secondary">{c.category}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(c.created_at)}</p>
                  </div>
                  {c.attachments && <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{active?.subject}</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              <p className="text-sm whitespace-pre-wrap">{active.message}</p>

              {attachments.length > 0 && (
                <div className="space-y-1">
                  <Label>Lampiran</Label>
                  <div className="flex flex-col gap-1">
                    {attachments.map((k) => (
                      <button key={k} onClick={() => openAttachment(k)} className="text-sm text-primary inline-flex items-center gap-1 text-left">
                        <Download className="h-3.5 w-3.5" /> {k.split('/').pop()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baru">Baru</SelectItem>
                    <SelectItem value="diproses">Diproses</SelectItem>
                    <SelectItem value="selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reply">Balasan Admin</Label>
                <Textarea id="reply" rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Tulis balasan untuk pengguna..." />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Tutup</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan & Kirim'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
