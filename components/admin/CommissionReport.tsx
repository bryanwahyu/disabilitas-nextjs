
import React, { useState, useEffect, useMemo } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Loader2, TrendingUp, Clock, CheckCircle2 } from 'lucide-react';

const rupiah = (n?: number | null) =>
  typeof n === 'number' ? 'Rp ' + n.toLocaleString('id-ID') : '—';

type StatusFilter = '' | 'recorded' | 'settled';

export default function CommissionReport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [externalRef, setExternalRef] = useState('');

  const filters = {
    from: from || undefined,
    to: to || undefined,
    status: status || undefined,
  };

  // Belum ada domain komisi di qk — dipinjamkan sebagai sub-list dari admin/pricing.
  const { data: summary, isPending: loading } = useQuery({
    queryKey: qk.admin.pricing.of('commissions', filters),
    queryFn: () => unwrap(apiClient.adminPricing.commissions(filters)),
    placeholderData: keepPreviousData,
  });

  const rows = summary?.items ?? [];
  const total = summary?.total_komisi ?? 0;
  const count = summary?.total_transaksi ?? 0;
  const outstanding = summary?.outstanding_komisi ?? 0;
  const outstandingCount = summary?.outstanding_count ?? 0;
  const settledTotal = summary?.settled_komisi ?? 0;

  // Ganti filter mengubah kumpulan baris, jadi pilihan lama tidak lagi relevan.
  useEffect(() => { setSelected(new Set()); }, [from, to, status]);

  // Hanya baris recorded yang bisa diselesaikan.
  const recordedRows = useMemo(() => rows.filter((r) => r.status === 'recorded'), [rows]);
  const allRecordedSelected = recordedRows.length > 0 && recordedRows.every((r) => selected.has(r.id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelected(allRecordedSelected ? new Set() : new Set(recordedRows.map((r) => r.id)));

  const selectedTotal = useMemo(
    () => rows.filter((r) => selected.has(r.id)).reduce((s, r) => s + r.komisi_amount, 0),
    [rows, selected],
  );

  const { mutate: settle, isPending: settling } = useMutation({
    mutationFn: (ids: string[]) =>
      unwrap(apiClient.adminPricing.settleCommissions(ids, externalRef || undefined)),
    onSuccess: (data, ids) => {
      toast({
        title: 'Berhasil',
        description: `${data?.settled ?? ids.length} komisi ditandai settled${externalRef ? ` (ref: ${externalRef})` : ''}.`,
      });
      setExternalRef('');
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: qk.admin.pricing.all() });
    },
    onError: (e: any) => {
      toast({ title: 'Gagal', description: e.message || 'Gagal menyelesaikan komisi', variant: 'destructive' });
    },
  });

  const handleSettle = () => {
    if (selected.size === 0) return;
    settle([...selected]);
  };

  return (
    <div className="space-y-4">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-emerald-100 p-3"><Wallet className="h-6 w-6 text-emerald-700" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Komisi</p>
              <p className="text-xl font-bold">{rupiah(total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-amber-100 p-3"><Clock className="h-6 w-6 text-amber-700" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Belum Settled</p>
              <p className="text-xl font-bold">{rupiah(outstanding)}</p>
              <p className="text-xs text-muted-foreground">{outstandingCount} transaksi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-blue-100 p-3"><CheckCircle2 className="h-6 w-6 text-blue-700" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Sudah Settled</p>
              <p className="text-xl font-bold">{rupiah(settledTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="rounded-full bg-purple-100 p-3"><TrendingUp className="h-6 w-6 text-purple-700" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-xl font-bold">{count}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <CardTitle>Riwayat Komisi</CardTitle>
            <div className="flex flex-wrap items-end gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusFilter)}
                  className="block h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Semua</option>
                  <option value="recorded">Belum settled</option>
                  <option value="settled">Sudah settled</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Dari</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Sampai</label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <Button variant="outline" onClick={() => { setFrom(''); setTo(''); setStatus(''); }}>Reset</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Aksi settlement */}
          {selected.size > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <span className="text-sm text-amber-900">
                <strong>{selected.size}</strong> komisi dipilih · {rupiah(selectedTotal)}
              </span>
              <Input
                placeholder="Ref. settlement Sarana (opsional)"
                value={externalRef}
                onChange={(e) => setExternalRef(e.target.value)}
                className="h-9 w-64 bg-white"
              />
              <Button size="sm" onClick={handleSettle} disabled={settling}>
                {settling ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tandai settled (ekspor Sarana)'}
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Memuat…
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground text-sm">Belum ada komisi tercatat.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-3 font-medium">
                      <input
                        type="checkbox"
                        aria-label="Pilih semua yang belum settled"
                        checked={allRecordedSelected}
                        onChange={toggleAll}
                        disabled={recordedRows.length === 0}
                      />
                    </th>
                    <th className="py-2 pr-4 font-medium">Tanggal</th>
                    <th className="py-2 pr-4 font-medium">Jenis</th>
                    <th className="py-2 pr-4 font-medium">Harga Dasar</th>
                    <th className="py-2 pr-4 font-medium">Harga Jual</th>
                    <th className="py-2 pr-4 font-medium">Komisi</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const isRecorded = r.status === 'recorded';
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <input
                            type="checkbox"
                            aria-label={`Pilih komisi ${r.id}`}
                            checked={selected.has(r.id)}
                            onChange={() => toggle(r.id)}
                            disabled={!isRecorded}
                          />
                        </td>
                        <td className="py-2 pr-4">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                        <td className="py-2 pr-4">{r.transaction_type === 'appointment' ? 'Janji Temu' : 'Pelatihan'}</td>
                        <td className="py-2 pr-4">{rupiah(r.harga_dasar)}</td>
                        <td className="py-2 pr-4">{rupiah(r.harga_jual)}</td>
                        <td className="py-2 pr-4 font-semibold text-emerald-700">{rupiah(r.komisi_amount)}</td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className={isRecorded ? 'border-amber-300 text-amber-700' : 'border-blue-300 text-blue-700'}>
                            {isRecorded ? 'Belum settled' : 'Settled'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
