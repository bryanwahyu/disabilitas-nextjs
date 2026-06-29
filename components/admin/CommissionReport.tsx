'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import type { CommissionLedgerRow } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wallet, Loader2, TrendingUp } from 'lucide-react';

const rupiah = (n?: number | null) =>
  typeof n === 'number' ? 'Rp ' + n.toLocaleString('id-ID') : '—';

export default function CommissionReport() {
  const [rows, setRows] = useState<CommissionLedgerRow[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.adminPricing.commissions({ from: from || undefined, to: to || undefined });
    if (res.data) {
      setRows(res.data.items ?? []);
      setTotal(res.data.total_komisi ?? 0);
      setCount(res.data.total_transaksi ?? 0);
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-emerald-100 p-3"><Wallet className="h-6 w-6 text-emerald-700" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Komisi</p>
              <p className="text-2xl font-bold">{rupiah(total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-100 p-3"><TrendingUp className="h-6 w-6 text-blue-700" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold">{count}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <CardTitle>Riwayat Komisi</CardTitle>
            <div className="flex items-end gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Dari</label>
                <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Sampai</label>
                <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
              </div>
              <Button variant="outline" onClick={() => { setFrom(''); setTo(''); }}>Reset</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                    <th className="py-2 pr-4 font-medium">Tanggal</th>
                    <th className="py-2 pr-4 font-medium">Jenis</th>
                    <th className="py-2 pr-4 font-medium">Harga Dasar</th>
                    <th className="py-2 pr-4 font-medium">Harga Jual</th>
                    <th className="py-2 pr-4 font-medium">Komisi</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">{new Date(r.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-2 pr-4">{r.transaction_type === 'appointment' ? 'Janji Temu' : 'Pelatihan'}</td>
                      <td className="py-2 pr-4">{rupiah(r.harga_dasar)}</td>
                      <td className="py-2 pr-4">{rupiah(r.harga_jual)}</td>
                      <td className="py-2 pr-4 font-semibold text-emerald-700">{rupiah(r.komisi_amount)}</td>
                      <td className="py-2 pr-4"><Badge variant="outline">{r.status === 'settled' ? 'Selesai' : 'Tercatat'}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
