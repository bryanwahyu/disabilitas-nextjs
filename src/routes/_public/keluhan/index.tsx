
import React, { useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquareWarning, Paperclip, Loader2, X } from 'lucide-react';
import { metaFrom } from '@/lib/seo/head';
import { env } from '@/lib/env';

const metadata = {
  title: 'Layanan Keluhan & Pengaduan',
  description:
    'Sampaikan keluhan atau laporan terkait layanan di DisabilitasKu. Setiap laporan ditindaklanjuti dan bisa Anda pantau statusnya.',
  keywords: ['keluhan layanan disabilitas', 'pengaduan', 'laporan layanan terapi'],
  openGraph: {
    title: 'Layanan Keluhan | DisabilitasKu',
    description: 'Sampaikan keluhan atau laporan terkait layanan di DisabilitasKu.',
    url: `${env.siteUrl}/keluhan`,
  },
};

export const Route = createFileRoute('/_public/keluhan/')({
  head: () => {
    const head = metaFrom(metadata);
    return { ...head, links: [...head.links, { rel: 'canonical', href: `${env.siteUrl}/keluhan` }] };
  },
  component: KeluhanPage,
});


const CATEGORIES = [
  { value: 'aplikasi', label: 'Masalah Aplikasi/Website' },
  { value: 'layanan', label: 'Layanan Terapi' },
  { value: 'akun', label: 'Akun & Login' },
  { value: 'pembayaran', label: 'Pembayaran' },
  { value: 'lainnya', label: 'Lainnya' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  baru: { label: 'Baru', className: 'bg-blue-100 text-blue-800' },
  diproses: { label: 'Diproses', className: 'bg-amber-100 text-amber-800' },
  selesai: { label: 'Selesai', className: 'bg-emerald-100 text-emerald-800' },
};

function formatDate(s?: string) {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function KeluhanPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [category, setCategory] = useState('aplikasi');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const queryClient = useQueryClient();

  const { data: complaints = [], isPending: loadingList } = useQuery({
    queryKey: qk.complaints.list({ limit: 50 }),
    queryFn: () => unwrap(apiClient.complaints.myList({ limit: 50 })),
    enabled: isAuthenticated,
  });

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...picked].slice(0, 5));
    e.target.value = '';
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const submitMutation = useMutation({
    mutationFn: async () => {
      // Upload lampiran via presign (folder=complaints).
      const keys: string[] = [];
      for (const f of files) {
        const up = await apiClient.uploads.uploadFile('complaints', f);
        if (up.error || !up.s3_key) {
          throw new Error(`Gagal unggah ${f.name}: ${up.error || 'unknown'}`);
        }
        keys.push(up.s3_key);
      }

      return unwrap(
        apiClient.complaints.create({
          category,
          subject: subject.trim(),
          message: message.trim(),
          attachments: keys,
        })
      );
    },
    onSuccess: () => {
      toast({ title: 'Keluhan terkirim', description: 'Tim kami akan meninjau keluhan Anda.' });
      setSubject('');
      setMessage('');
      setFiles([]);
      setCategory('aplikasi');
      queryClient.invalidateQueries({ queryKey: qk.complaints.all() });
    },
    onError: (err: Error) => {
      toast({ title: 'Gagal mengirim', description: err.message || 'Terjadi kesalahan', variant: 'destructive' });
    },
  });

  const submitting = submitMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Lengkapi form', description: 'Subjek dan pesan wajib diisi.', variant: 'destructive' });
      return;
    }
    submitMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <MessageSquareWarning className="h-12 w-12 mx-auto mb-4 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold mb-2">Layanan Keluhan</h1>
        <p className="text-muted-foreground mb-6">Silakan masuk untuk mengirim keluhan dan melihat riwayatnya.</p>
        <Button asChild>
          <Link to="/auth">Masuk / Daftar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquareWarning className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className="text-2xl md:text-3xl font-bold">Layanan Keluhan</h1>
        </div>
        <p className="text-muted-foreground">Sampaikan keluhan atau kendala Anda. Tim kami akan menindaklanjuti.</p>
      </header>

      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Kirim Keluhan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Subjek</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ringkasan singkat keluhan" maxLength={255} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Pesan</Label>
              <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Jelaskan keluhan Anda secara detail..." rows={5} required />
            </div>

            <div className="space-y-1.5">
              <Label>Lampiran (opsional, maks 5 file)</Label>
              <label className="flex items-center gap-2 text-sm text-primary cursor-pointer w-fit">
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                <span>Pilih file</span>
                <input type="file" className="hidden" multiple onChange={handleFilePick} accept="image/*,.pdf" />
              </label>
              {files.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between text-sm bg-muted rounded px-2 py-1">
                      <span className="truncate">{f.name}</span>
                      <button type="button" onClick={() => removeFile(i)} aria-label={`Hapus ${f.name}`}>
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitting ? 'Mengirim...' : 'Kirim Keluhan'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold mb-4">Riwayat Keluhan</h2>
      {loadingList ? (
        <p className="text-muted-foreground">Memuat...</p>
      ) : complaints.length === 0 ? (
        <p className="text-muted-foreground">Belum ada keluhan.</p>
      ) : (
        <div className="space-y-4">
          {complaints.map((cpt) => {
            const badge = STATUS_BADGE[cpt.status] || { label: cpt.status, className: 'bg-gray-100 text-gray-800' };
            return (
              <Card key={cpt.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{cpt.subject}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(cpt.created_at)}</p>
                    </div>
                    <Badge className={badge.className}>{badge.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cpt.message}</p>
                  {cpt.admin_reply && (
                    <div className="mt-2 rounded-md bg-muted p-3">
                      <p className="text-xs font-semibold mb-1">Balasan Admin</p>
                      <p className="text-sm whitespace-pre-wrap">{cpt.admin_reply}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
