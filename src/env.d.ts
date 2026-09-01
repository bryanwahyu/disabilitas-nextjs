/// <reference types="vite/client" />

/**
 * Variabel env publik. Semuanya di-inline saat build (sama seperti
 * `NEXT_PUBLIC_*` dulu), jadi tetap wajib dikirim sebagai build-arg Docker —
 * menyetelnya saat runtime container tidak berpengaruh apa pun.
 *
 * Dibaca hanya lewat `lib/env.ts`, tidak langsung dari komponen.
 */
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_AUTH_TOKEN_KEY: string;
  readonly VITE_CENTRIFUGO_URL: string;
  readonly VITE_SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
