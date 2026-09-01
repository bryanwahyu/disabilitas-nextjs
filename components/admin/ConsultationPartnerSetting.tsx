
import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ConsultationPartner, PartnerCandidate } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, Loader2, Stethoscope } from 'lucide-react';

/**
 * Akun mitra tujuan konsultasi screening berbayar.
 * Diubah dari sini tanpa redeploy; env KITTY_CENTER_PROVIDER_ID (kalau diisi)
 * mengunci nilai ini di level server.
 */
export default function ConsultationPartnerSetting() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState('');

  const { data: partner, isPending: partnerPending } = useQuery({
    queryKey: qk.admin.consultations.of('partner'),
    queryFn: () => unwrap(apiClient.adminConsultations.partner()) as Promise<ConsultationPartner | null>,
  });

  const { data: candidates = [], isPending: candidatesPending } = useQuery({
    queryKey: qk.admin.consultations.of('partner-candidates'),
    queryFn: () => unwrap(apiClient.adminConsultations.partnerCandidates()) as Promise<PartnerCandidate[]>,
  });

  const loading = partnerPending || candidatesPending;

  // Dropdown mengikuti mitra yang tersimpan; hanya disinkronkan saat nilainya
  // benar-benar berubah supaya refetch tidak membatalkan pilihan yang sedang dibuat.
  const currentProviderId = partner?.provider_id;
  useEffect(() => {
    setSelected(currentProviderId || '');
  }, [currentProviderId]);

  const { mutate: savePartner, isPending: saving } = useMutation({
    mutationFn: (providerId: string) => unwrap(apiClient.adminConsultations.setPartner(providerId)),
    onSuccess: () => {
      toast({ title: 'Mitra konsultasi diperbarui' });
      queryClient.invalidateQueries({ queryKey: qk.admin.consultations.all() });
    },
    onError: (e) => {
      toast({
        title: 'Gagal menyimpan',
        description: e instanceof Error ? e.message : '',
        variant: 'destructive',
      });
    },
  });

  const save = () => {
    if (!selected) return;
    savePartner(selected);
  };

  const belumDiset = !loading && !partner?.provider_id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="h-4 w-4" /> Mitra konsultasi screening
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Akun yang menerima order konsultasi Rp50.000 dan kontaknya dikirim ke orang tua setelah
          pembayaran lunas. Hanya akun berrole <code>therapy</code> yang bisa dipilih.
        </p>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </p>
        ) : (
          <>
            {belumDiset ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <span>
                  Belum diset — pembuatan konsultasi baru ditolak (503) sampai mitra dipilih.
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <span>
                  Aktif: <b>{partner?.contact?.name || partner?.provider_id}</b>
                  {partner?.contact?.email ? ` · ${partner.contact.email}` : ''}
                  {partner?.source === 'env' ? ' (dikunci lewat env)' : ''}
                </span>
              </div>
            )}

            {partner?.locked_by_env && (
              <p className="text-xs text-muted-foreground">
                <code>KITTY_CENTER_PROVIDER_ID</code> terisi di server, jadi nilai itu yang dipakai.
                Kosongkan env tersebut kalau ingin mengatur mitra dari halaman ini.
              </p>
            )}

            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada akun berrole <code>therapy</code>. Buat akunnya dulu di menu Users.
              </p>
            ) : (
              <div className="space-y-2">
                <select
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">— pilih akun mitra —</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name ? `${c.name} — ${c.email}` : c.email}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={save}
                  disabled={saving || !selected || selected === partner?.provider_id}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    'Simpan mitra'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
