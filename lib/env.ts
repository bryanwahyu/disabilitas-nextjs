/**
 * Satu-satunya tempat variabel environment publik dibaca.
 *
 * **Jangan** membaca `import.meta.env` di tempat lain. Sebelum file ini ada,
 * 5 variabel tersebar di 27 tempat lintas 16 file dengan **empat** gaya default
 * yang berbeda dan saling bertentangan (`|| 'http://localhost:8082/v1'`,
 * `?? ''`, `|| '/api'`, dan tanpa default sama sekali). Yang terakhir berarti
 * request bisa menuju URL harfiah `undefined/auth/login`.
 *
 * Nilai di sini di-inline saat build — persis seperti `NEXT_PUBLIC_*` dulu.
 * Artinya menyetel variabel ini saat runtime container **tidak berpengaruh**;
 * harus dikirim sebagai build-arg Docker. Lihat `Dockerfile`.
 *
 * Tipe `ImportMetaEnv` dideklarasikan di `src/env.d.ts`.
 */

/** Base URL API Go, mis. `https://api.disabilitasku.id/v1`. */
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8082/v1';

/** Timeout request API dalam milidetik. */
const apiTimeoutMs = Number.parseInt(
  import.meta.env.VITE_API_TIMEOUT || '10000',
  10
);

/** Nama key localStorage untuk token sesi user publik (token opaque `dsk_`). */
const authTokenKey = import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token';

/** Endpoint WebSocket Centrifugo. */
const centrifugoUrl =
  import.meta.env.VITE_CENTRIFUGO_URL || 'ws://localhost:8090/connection/websocket';

/** Origin situs publik — dipakai untuk canonical URL, sitemap, robots, OG. */
const siteUrl = import.meta.env.VITE_SITE_URL || 'https://disabilitasku.id';

export const env = {
  apiBaseUrl,
  apiTimeoutMs,
  authTokenKey,
  centrifugoUrl,
  siteUrl,
} as const;

export type Env = typeof env;
