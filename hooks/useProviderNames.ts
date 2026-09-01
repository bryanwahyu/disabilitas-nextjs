import { useQueries } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { env } from '@/lib/env';

/**
 * Petakan `provider_id` → nama terapis/institusi.
 *
 * Appointment hanya menyimpan `provider_id`; API-nya tidak menyertakan nama.
 * Sebelum hook ini ada, halaman jadwal membaca `appointment.therapist?.name` —
 * field yang tidak pernah dikirim backend — jadi setiap kartu menulis "Terapis".
 *
 * Satu query per provider unik, di-cache lama karena nama nyaris tak berubah.
 * Jumlah provider dalam satu daftar janji temu kecil, jadi ini lebih murah
 * daripada menarik seluruh direktori.
 */
export function useProviderNames(providerIds: string[]): Record<string, string> {
  const unique = Array.from(new Set(providerIds.filter(Boolean)));

  const results = useQueries({
    queries: unique.map((id) => ({
      queryKey: qk.therapyProviders.detail(id),
      queryFn: async (): Promise<{ id: string; full_name?: string; email?: string } | null> => {
        const res = await fetch(`${env.apiBaseUrl}/therapy/providers/${id}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? null;
      },
      staleTime: 30 * 60 * 1000,
    })),
  });

  const names: Record<string, string> = {};
  unique.forEach((id, i) => {
    const data = results[i]?.data;
    if (data?.full_name) names[id] = data.full_name;
  });
  return names;
}
