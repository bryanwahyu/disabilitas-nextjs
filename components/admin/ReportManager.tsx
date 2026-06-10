'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import type { ContentReportWithContext } from '@/lib/api/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Flag, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

const REASON_LABELS: Record<string, string> = {
  stigma: 'Stigma / penghakiman',
  kasar: 'Kasar / melecehkan',
  spam: 'Spam / jualan',
  lainnya: 'Lainnya',
};

export default function ReportManager() {
  const [reports, setReports] = useState<ContentReportWithContext[]>([]);
  const [status, setStatus] = useState('open');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<ContentReportWithContext | null>(null);
  const [resolveAction, setResolveAction] = useState<'resolved' | 'dismissed'>('resolved');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchReports = async (s = status) => {
    setLoading(true);
    try {
      const response = await apiClient.adminReports.list({ status: s, per_page: 50 });
      if (response.error) throw new Error(response.error);
      setReports(response.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal memuat laporan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(status);
  }, [status]);

  const openResolve = (report: ContentReportWithContext, action: 'resolved' | 'dismissed') => {
    setResolving(report);
    setResolveAction(action);
    setNote('');
  };

  const handleResolve = async () => {
    if (!resolving) return;
    setSaving(true);
    try {
      const response = await apiClient.adminReports.resolve(resolving.id, {
        status: resolveAction,
        note: note || undefined,
      });
      if (response.error) throw new Error(response.error);
      toast({
        title: 'Berhasil',
        description: resolveAction === 'resolved' ? 'Laporan ditandai selesai' : 'Laporan diabaikan',
      });
      setResolving(null);
      fetchReports();
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal memproses laporan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case 'open':
        return <Badge className="bg-red-100 text-red-800">Menunggu</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Selesai</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Diabaikan</Badge>;
      default:
        return <Badge variant="secondary">{s}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="h-5 w-5 text-primary" />
          Laporan Konten
        </CardTitle>
        <CardDescription>
          Target SLA: setiap laporan ditangani dalam 1×24 jam. Selesaikan laporan setelah
          menindak kontennya (kunci thread / hapus balasan di tab Forum).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={status} onValueChange={setStatus} className="mb-6">
          <TabsList>
            <TabsTrigger value="open">Menunggu</TabsTrigger>
            <TabsTrigger value="resolved">Selesai</TabsTrigger>
            <TabsTrigger value="dismissed">Diabaikan</TabsTrigger>
            <TabsTrigger value="all">Semua</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
            Tidak ada laporan {status === 'open' ? 'yang menunggu — semua sudah ditangani' : ''}
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {statusBadge(report.status)}
                  <Badge variant="outline">
                    {report.target_type === 'thread' ? 'Diskusi' : 'Balasan'}
                  </Badge>
                  <Badge variant="outline">{REASON_LABELS[report.reason] || report.reason}</Badge>
                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(report.created_at).toLocaleString('id-ID')}
                  </span>
                </div>
                <p className="text-sm text-gray-800 mb-1 line-clamp-2">
                  &ldquo;{report.content_snippet || '(konten sudah dihapus)'}&rdquo;
                </p>
                <p className="text-xs text-gray-500 mb-1">
                  Penulis konten: {report.content_author || '-'} · Pelapor: {report.reporter_email || '-'}
                </p>
                {report.details && (
                  <p className="text-xs text-gray-600 mb-2">Catatan pelapor: {report.details}</p>
                )}
                {report.resolution_note && (
                  <p className="text-xs text-gray-600 mb-2">Catatan moderator: {report.resolution_note}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  <Link
                    href={
                      report.target_type === 'thread'
                        ? `/forum/${report.target_id}`
                        : `/forum`
                    }
                    target="_blank"
                  >
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Lihat Konten
                    </Button>
                  </Link>
                  {report.status === 'open' && (
                    <>
                      <Button size="sm" onClick={() => openResolve(report, 'resolved')}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Tandai Selesai
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openResolve(report, 'dismissed')}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Abaikan
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!resolving} onOpenChange={(open) => !open && setResolving(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resolveAction === 'resolved' ? 'Tandai Laporan Selesai' : 'Abaikan Laporan'}
            </DialogTitle>
            <DialogDescription>
              {resolveAction === 'resolved'
                ? 'Pastikan kontennya sudah ditindak (dikunci/dihapus) sebelum menandai selesai.'
                : 'Laporan ini akan ditutup tanpa tindakan pada konten.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Catatan tindakan (opsional)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolving(null)}>
              Batal
            </Button>
            <Button onClick={handleResolve} disabled={saving}>
              {saving ? 'Memproses...' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
