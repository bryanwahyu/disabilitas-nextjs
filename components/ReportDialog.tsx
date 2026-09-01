
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { apiClient } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Flag } from 'lucide-react';

const REASONS: { value: string; label: string }[] = [
  { value: 'stigma', label: 'Menghakimi / bahasa kasihan / memperkuat stigma' },
  { value: 'kasar', label: 'Kasar, menyerang, atau melecehkan' },
  { value: 'spam', label: 'Spam / promosi / jualan obat & pengobatan alternatif' },
  { value: 'lainnya', label: 'Lainnya' },
];

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: 'thread' | 'reply';
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleOpen = () => {
    if (!user) {
      toast({
        title: 'Perlu login',
        description: 'Silakan login untuk melaporkan konten',
      });
      navigate({ to: '/auth' });
      return;
    }
    setReason('');
    setDetails('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast({ title: 'Pilih alasan', description: 'Pilih alasan laporan terlebih dahulu', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const response =
        targetType === 'thread'
          ? await apiClient.reports.reportThread(targetId, { reason, details: details || undefined })
          : await apiClient.reports.reportReply(targetId, { reason, details: details || undefined });
      if (response.error) throw new Error(response.error);
      toast({
        title: 'Laporan terkirim',
        description: 'Terima kasih — laporan Anda akan ditinjau moderator',
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal mengirim laporan',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
        aria-label="Laporkan konten ini"
      >
        <Flag className="h-3 w-3" />
        Laporkan
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Laporkan Konten</DialogTitle>
            <DialogDescription>
              Komunitas ini harus aman untuk semua. Laporan Anda anonim bagi penulis konten.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={reason} onValueChange={setReason}>
              {REASONS.map((r) => (
                <div key={r.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={r.value} id={`reason-${r.value}`} className="mt-0.5" />
                  <Label htmlFor={`reason-${r.value}`} className="font-normal text-sm leading-snug">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <Textarea
              placeholder="Detail tambahan (opsional)"
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={sending}>
              {sending ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
