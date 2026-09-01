
import React, { useEffect } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { ApiResponseError, unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, CreditCard, Loader2 } from 'lucide-react';

export const Route = createFileRoute('/_public/konsultasi/bayar/$id/')({
  /*
   * Halaman akun: `noindex, nofollow`.
   *
   * Isinya milik satu pengguna dan tidak pernah berguna di hasil pencarian.
   */
  head: () => ({
    meta: [
      { title: 'Pembayaran Konsultasi | DisabilitasKu' },
      { name: 'description', content: 'Selesaikan pembayaran sesi konsultasi Anda.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: KonsultasiBayarPage,
});


function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

/**
 * Halaman bayar konsultasi. Dengan gateway riil, ortu tak sampai ke sini —
 * `create` langsung melempar ke URL gateway. Halaman ini melayani mode mock
 * (dev/staging) dan jadi tempat kembali saat pembayaran belum tuntas.
 */
function KonsultasiBayarPage() {
  const { id } = useParams({ from: '/_public/konsultasi/bayar/$id/' });
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: detail, isPending, error, refetch } = useQuery({
    queryKey: qk.consultations.detail(id),
    queryFn: () => unwrap(apiClient.consultations.get(id)),
    enabled: !!id,
  });

  const unauthorized = error instanceof ApiResponseError && error.status === 401;

  useEffect(() => {
    if (unauthorized) navigate({ to: '/auth', search: { redirect: '/konsultasi/riwayat' } });
  }, [unauthorized, navigate]);

  const { mutate: simulatePay, isPending: paying } = useMutation({
    mutationFn: () => unwrap(apiClient.consultations.mockPay(id)),
    onSuccess: () => {
      toast({ title: 'Pembayaran diterima', description: 'Kontak konsultan sudah terbuka.' });
      qc.invalidateQueries({ queryKey: qk.consultations.all() });
      navigate({ to: '/konsultasi/riwayat' });
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal', description: e.message || 'Simulasi bayar tidak tersedia', variant: 'destructive' });
    },
  });

  // Saat 401, spinner ditahan sampai redirect ke halaman auth benar-benar terjadi.
  if (isPending || unauthorized) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-gray-500">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Memuat...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-gray-600">
        Konsultasi tidak ditemukan.{' '}
        <Link to="/konsultasi/riwayat" className="font-medium text-teal-700 hover:underline">
          Lihat riwayat
        </Link>
      </div>
    );
  }

  const c = detail.consultation;
  const sudahBayar = ['paid', 'scheduled', 'completed'].includes(c.status);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardContent className="space-y-5 py-7 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100">
            {sudahBayar ? (
              <CheckCircle2 className="h-6 w-6 text-teal-600" />
            ) : (
              <CreditCard className="h-6 w-6 text-teal-600" />
            )}
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {sudahBayar ? 'Pembayaran sudah diterima' : 'Selesaikan pembayaran'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Konsultasi screening tumbuh kembang</p>
          </div>

          <p className="text-3xl font-bold text-gray-900">{formatRupiah(c.amount)}</p>

          {sudahBayar ? (
            <Button onClick={() => navigate({ to: '/konsultasi/riwayat' })}>Lihat kontak konsultan</Button>
          ) : (
            <div className="space-y-3">
              <p className="mx-auto max-w-sm text-xs text-gray-500">
                Setelah pembayaran terkonfirmasi, kontak konsultan mitra akan terbuka di halaman
                riwayat konsultasi Anda.
              </p>
              {c.payment_provider === 'mock' ? (
                // Mode simulasi (dev/staging). Dengan gateway riil, konfirmasi
                // datang lewat webhook — tak ada tombol bayar di sini.
                <Button onClick={() => simulatePay()} disabled={paying} className="w-full">
                  {paying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    'Simulasikan pembayaran'
                  )}
                </Button>
              ) : (
                <Button onClick={() => refetch()} variant="outline" className="w-full">
                  Saya sudah bayar — periksa status
                </Button>
              )}
              <Link
                to="/konsultasi/riwayat"
                className="block text-xs text-gray-500 hover:text-gray-800 hover:underline"
              >
                Bayar nanti
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
