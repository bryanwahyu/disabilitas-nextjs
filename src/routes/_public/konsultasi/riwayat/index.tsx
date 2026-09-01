
import React, { useEffect, useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ConsultationStatus } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, MapPin, Phone, Stethoscope } from 'lucide-react';

export const Route = createFileRoute('/_public/konsultasi/riwayat/')({
  /*
   * Halaman akun: `noindex, nofollow`.
   *
   * Isinya milik satu pengguna dan tidak pernah berguna di hasil pencarian.
   * Sebelumnya tak ada `head` sama sekali, jadi tab browser menampilkan judul
   * default root — sulit dibedakan saat pengguna membuka banyak tab.
   */
  head: () => ({
    meta: [
      { title: 'Riwayat Konsultasi | DisabilitasKu' },
      { name: 'description', content: 'Daftar sesi konsultasi Anda beserta statusnya.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: KonsultasiRiwayatPage,
});


const STATUS: Record<ConsultationStatus, { label: string; className: string }> = {
  draft: { label: 'Belum dibayar', className: 'bg-gray-100 text-gray-700' },
  pending_payment: { label: 'Menunggu pembayaran', className: 'bg-amber-100 text-amber-800' },
  paid: { label: 'Lunas', className: 'bg-emerald-100 text-emerald-800' },
  scheduled: { label: 'Terjadwal', className: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Selesai', className: 'bg-teal-100 text-teal-800' },
  cancelled: { label: 'Dibatalkan', className: 'bg-gray-200 text-gray-600' },
  expired: { label: 'Kedaluwarsa', className: 'bg-gray-200 text-gray-600' },
};

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

function formatDate(s?: string) {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function KonsultasiRiwayatPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) navigate({ to: '/auth', search: { redirect: '/konsultasi/riwayat' } });
  }, [authLoading, isAuthenticated, navigate]);

  const { data: items = [], isPending: loading } = useQuery({
    queryKey: qk.consultations.list(),
    queryFn: () => unwrap(apiClient.consultations.list()),
    enabled: !authLoading && isAuthenticated,
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: qk.consultations.detail(openId ?? ''),
    queryFn: () => unwrap(apiClient.consultations.get(openId!)),
    enabled: !!openId,
  });

  const openDetail = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const { mutate: cancel } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.consultations.cancel(id)),
    onSuccess: () => {
      toast({ title: 'Konsultasi dibatalkan' });
      qc.invalidateQueries({ queryKey: qk.consultations.all() });
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal membatalkan', description: e.message, variant: 'destructive' });
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Konsultasi saya</h1>
        <p className="mt-1 text-sm text-gray-500">
          Status pembayaran dan kontak konsultan untuk setiap sesi yang Anda pesan.
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
              <Stethoscope className="h-6 w-6 text-teal-600" />
            </div>
            <p className="text-sm text-gray-600">Belum ada konsultasi.</p>
            <Link
              to="/konsultasi/mulai"
              className="inline-flex items-center justify-center rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Mulai konsultasi
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const st = STATUS[c.status] ?? STATUS.draft;
            const belumBayar = c.status === 'draft' || c.status === 'pending_payment';
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Konsultasi screening</p>
                      <p className="text-xs text-gray-500">Dipesan {formatDate(c.created_at)}</p>
                    </div>
                    <Badge className={st.className}>{st.label}</Badge>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-800">{formatRupiah(c.amount)}</p>
                    <div className="flex gap-2">
                      {belumBayar && (
                        <>
                          <Button size="sm" onClick={() => navigate({ to: `/konsultasi/bayar/${c.id}` })}>
                            Bayar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => cancel(c.id)}>
                            Batalkan
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openDetail(c.id)}>
                        {openId === c.id ? 'Tutup' : 'Detail'}
                      </Button>
                    </div>
                  </div>

                  {openId === c.id && (
                    <div className="rounded-lg border bg-gray-50 p-3">
                      {detailLoading ? (
                        <p className="flex items-center gap-2 text-xs text-gray-500">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memuat detail...
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {detail?.intake && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700">Keluhan yang Anda kirim</p>
                              <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                                {safeList(detail.intake.complaints).map((k, i) => (
                                  <li key={i}>{k}</li>
                                ))}
                              </ul>
                              <p className="mt-2 text-xs text-gray-600">
                                <span className="font-medium text-gray-700">Kekhawatiran utama: </span>
                                {detail.intake.main_concern}
                              </p>
                            </div>
                          )}

                          {detail?.partner_contact ? (
                            <div className="rounded-lg border border-teal-200 bg-white p-3">
                              <p className="text-xs font-semibold text-teal-800">
                                Kontak konsultan — {detail.partner_contact.name}
                              </p>
                              <div className="mt-2 space-y-1.5 text-xs text-gray-700">
                                {detail.partner_contact.phone && (
                                  <p className="flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-teal-600" />
                                    <a href={`tel:${detail.partner_contact.phone}`} className="hover:underline">
                                      {detail.partner_contact.phone}
                                    </a>
                                  </p>
                                )}
                                {detail.partner_contact.email && (
                                  <p className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5 text-teal-600" />
                                    <a href={`mailto:${detail.partner_contact.email}`} className="hover:underline">
                                      {detail.partner_contact.email}
                                    </a>
                                  </p>
                                )}
                                {detail.partner_contact.city && (
                                  <p className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-teal-600" />
                                    {detail.partner_contact.city}
                                  </p>
                                )}
                              </div>
                              <p className="mt-2 text-[11px] text-gray-500">
                                Hubungi untuk menyepakati waktu sesi. Keluhan Anda sudah diteruskan, jadi
                                konsultan datang dengan konteks.
                              </p>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              Kontak konsultan terbuka setelah pembayaran diterima.
                            </p>
                          )}
                        </div>
                      )}
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

// Keluhan disimpan sebagai JSON array; jangan sampai satu baris rusak
// menjatuhkan seluruh halaman.
function safeList(raw?: string): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}
