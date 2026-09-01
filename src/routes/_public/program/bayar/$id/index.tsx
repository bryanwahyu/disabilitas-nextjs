import { useEffect } from 'react';
import { Link, createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { ApiResponseError, unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/_public/program/bayar/$id/')({
  head: () => ({
    meta: [
      { title: 'Pembayaran Program Terapi | DisabilitasKu' },
      { name: 'description', content: 'Selesaikan pembayaran paket terapi berjalan.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProgramBayarPage,
});

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

/**
 * Halaman bayar paket terapi. Dengan gateway riil, pengguna tidak sampai ke
 * sini — pembuatan program langsung melempar ke URL gateway. Halaman ini
 * melayani mode mock dan menjadi tempat kembali saat pembayaran belum tuntas.
 */
function ProgramBayarPage() {
  const { id } = useParams({ from: '/_public/program/bayar/$id/' });
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: program, isPending, error } = useQuery({
    queryKey: qk.programs.detail(id),
    queryFn: () => unwrap(apiClient.programs.get(id)),
    enabled: !!id,
  });

  const unauthorized = error instanceof ApiResponseError && error.status === 401;

  useEffect(() => {
    if (unauthorized) navigate({ to: '/auth', search: { redirect: '/program' } });
  }, [unauthorized, navigate]);

  const { mutate: simulatePay, isPending: paying } = useMutation({
    mutationFn: () => unwrap(apiClient.programs.mockPay(id)),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: qk.programs.all() });
      qc.invalidateQueries({ queryKey: qk.appointments.all() });
      toast({
        title: 'Pembayaran diterima',
        description: res.shortfall
          ? `${res.sessions_created} dari ${res.sessions_expected} sesi masuk jadwal. Terapis akan menghubungi Anda untuk sisanya.`
          : `${res.sessions_created} sesi sudah masuk jadwal.`,
      });
      navigate({ to: '/program/$id', params: { id } });
    },
    onError: (e: Error) => {
      toast({ title: 'Gagal', description: e.message || 'Simulasi bayar tidak tersedia', variant: 'destructive' });
    },
  });

  if (isPending || unauthorized) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-gray-500">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Memuat…
      </div>
    );
  }

  if (!program) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-gray-600">
        Program tidak ditemukan.{' '}
        <Link to="/program" className="font-medium text-teal-700 hover:underline">
          Lihat program saya
        </Link>
      </div>
    );
  }

  const sudahBayar = program.status === 'active' || program.status === 'completed';

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
              {sudahBayar ? 'Program sudah aktif' : 'Selesaikan pembayaran'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {program.title} · {program.total_sessions} sesi · {program.frequency_per_week}× per minggu
            </p>
          </div>

          <p className="text-3xl font-bold text-gray-900">{formatRupiah(program.amount)}</p>

          {sudahBayar ? (
            <Button onClick={() => navigate({ to: '/program/$id', params: { id } })}>
              <CalendarCheck className="mr-2 h-4 w-4" />
              Lihat jadwal & progres
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="mx-auto max-w-sm text-xs text-gray-500">
                Setelah pembayaran diterima, seluruh sesi langsung dikunci di jadwal terapis dan muncul di
                halaman program Anda.
              </p>
              <Button className="w-full" disabled={paying} onClick={() => simulatePay()}>
                {paying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Bayar sekarang
              </Button>
              <Link to="/program" className="block text-sm text-gray-500 hover:underline">
                Bayar nanti
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
