import type { ApiResponse } from '@/lib/api/types';

/**
 * Error dari `apiClient`. `status` diisi bila server sempat merespons
 * (kosong untuk timeout / jaringan putus).
 */
export class ApiResponseError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = status;
  }
}

/**
 * `apiClient` mengembalikan `{ data, error }` dan tidak pernah throw, sedangkan
 * TanStack Query membedakan sukses/gagal lewat throw. Bungkus sekali di sini
 * supaya tidak ada lagi cek `response.error` manual di tiap halaman.
 *
 *   useQuery({ queryKey: qk.articles.list(p), queryFn: () => unwrap(apiClient.publicArticles.list(p)) })
 *
 * Catatan: `lib/terapis/api.ts` dan `lib/yayasan/api.ts` sudah throw sendiri,
 * jadi queryFn portal tersebut dipakai langsung tanpa unwrap.
 */
export async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise;
  if (res.error) throw new ApiResponseError(res.error, res.status);
  return res.data;
}

/** Varian yang ikut membawa `meta` paginasi untuk endpoint berhalaman. */
export async function unwrapWithMeta<T>(promise: Promise<ApiResponse<T>>) {
  const res = await promise;
  if (res.error) throw new ApiResponseError(res.error, res.status);
  return { data: res.data, meta: res.meta };
}

/**
 * 4xx = permintaan memang salah (401/403/404/422) → retry hanya membuang waktu
 * dan menahan spinner. Retry disediakan untuk gangguan sesaat: 5xx, timeout,
 * jaringan putus.
 */
export function isRetriableError(error: unknown): boolean {
  const status = error instanceof ApiResponseError ? error.status : undefined;
  if (status === undefined) return true; // timeout / network → layak dicoba lagi
  return status >= 500;
}
