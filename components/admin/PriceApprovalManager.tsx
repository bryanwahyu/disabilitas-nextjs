'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { PriceItem, PriceStatus } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tag, Check, X, Loader2 } from 'lucide-react';

const rupiah = (n?: number | null) =>
  typeof n === 'number' ? 'Rp ' + n.toLocaleString('id-ID') : '—';

const statusBadge = (s: PriceStatus) => {
  const map: Record<PriceStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
  };
  const label: Record<PriceStatus, string> = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };
  return <Badge className={map[s]}>{label[s]}</Badge>;
};

export default function PriceApprovalManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PriceStatus | ''>('pending');
  const [jual, setJual] = useState<Record<string, string>>({});
  const [note, setNote] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.adminPricing.listPrices(filter || undefined);
    if (res.data) setItems(res.data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function approve(p: PriceItem) {
    const hj = parseInt(jual[p.id] ?? '', 10);
    if (!hj || hj < p.harga_dasar) {
      toast({ title: 'Harga jual tidak valid', description: 'Harga jual harus ≥ harga dasar.', variant: 'destructive' });
      return;
    }
    setBusy(p.id);
    const res = await apiClient.adminPricing.approve(p.id, hj);
    setBusy(null);
    if (res.error) { toast({ title: 'Gagal menyetujui', description: res.error, variant: 'destructive' }); return; }
    toast({ title: 'Harga disetujui', description: `Komisi: ${rupiah(hj - p.harga_dasar)}` });
    load();
  }

  async function reject(p: PriceItem) {
    const n = (note[p.id] ?? '').trim();
    if (!n) { toast({ title: 'Alasan wajib diisi', variant: 'destructive' }); return; }
    setBusy(p.id);
    const res = await apiClient.adminPricing.reject(p.id, n);
    setBusy(null);
    if (res.error) { toast({ title: 'Gagal menolak', description: res.error, variant: 'destructive' }); return; }
    toast({ title: 'Harga ditolak' });
    load();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Tag className="h-5 w-5" /> Persetujuan Harga</CardTitle>
          <div className="flex gap-1">
            {(['pending', 'approved', 'rejected', ''] as const).map(s => (
              <Button key={s || 'all'} size="sm" variant={filter === s ? 'default' : 'outline'} onClick={() => setFilter(s)}>
                {s === '' ? 'Semua' : s === 'pending' ? 'Menunggu' : s === 'approved' ? 'Disetujui' : 'Ditolak'}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat…
          </div>
        ) : items.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">Tidak ada harga pada filter ini.</p>
        ) : (
          <div className="space-y-3">
            {items.map(p => {
              const hj = parseInt(jual[p.id] ?? '', 10);
              const komisiPreview = hj && hj >= p.harga_dasar ? hj - p.harga_dasar : null;
              return (
                <div key={p.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{p.item_type === 'therapy_service' ? 'Layanan Terapi' : 'Pelatihan'}</Badge>
                      {statusBadge(p.status)}
                      <span className="text-xs text-muted-foreground">Yayasan: {p.yayasan_id.slice(0, 8)}…</span>
                    </div>
                    <div className="text-sm">
                      Harga dasar: <span className="font-semibold">{rupiah(p.harga_dasar)}</span>
                      {p.status === 'approved' && (
                        <> · Jual: <span className="font-semibold">{rupiah(p.harga_jual)}</span> · Komisi: <span className="font-semibold text-emerald-700">{rupiah(p.komisi)}</span></>
                      )}
                    </div>
                  </div>

                  {p.status === 'pending' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">Harga jual (Rp)</label>
                          <Input type="number" min={p.harga_dasar} value={jual[p.id] ?? ''}
                            onChange={e => setJual(s => ({ ...s, [p.id]: e.target.value }))}
                            placeholder={String(p.harga_dasar)} />
                          {komisiPreview !== null && (
                            <p className="text-xs text-emerald-700 mt-1">Komisi: {rupiah(komisiPreview)}</p>
                          )}
                        </div>
                        <Button onClick={() => approve(p)} disabled={busy === p.id}>
                          <Check className="h-4 w-4 mr-1" /> Setujui
                        </Button>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground">Alasan tolak</label>
                          <Input value={note[p.id] ?? ''} onChange={e => setNote(s => ({ ...s, [p.id]: e.target.value }))}
                            placeholder="mis. harga di luar standar" />
                        </div>
                        <Button variant="destructive" onClick={() => reject(p)} disabled={busy === p.id}>
                          <X className="h-4 w-4 mr-1" /> Tolak
                        </Button>
                      </div>
                    </div>
                  )}
                  {p.status === 'rejected' && p.admin_note && (
                    <p className="text-sm text-red-600">Alasan: {p.admin_note}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
