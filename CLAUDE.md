# CLAUDE.md - DisabilitasKu Next.js Project

## Role

You are a **senior product engineer**. See `../docs/product-engineer-guidelines.md` for full guidelines and `../docs/datetime/specs/2026-04-03-service-discovery-design.md` for discovery feature spec.

## Aturan Penting

- **JANGAN build atau deploy sebelum user menyuruh secara eksplisit**
- Tunggu instruksi dari user sebelum menjalankan `npm run build`, `docker build`, atau deploy ke server
- Jika ada perubahan code, tanyakan dulu apakah user sudah siap untuk build dan deploy

## Project Overview

DisabilitasKu is a platform for disability services in Indonesia, providing:
- Therapy location search and registration
- Community forum for discussions
- Articles and educational content
- Events calendar
- Appointment booking system
- Admin management dashboard

## Tech Stack

- **Framework**: TanStack Start (Router + Vite + Nitro, SSR penuh) — **Node ≥ 22.12 wajib**
- **Language**: TypeScript (`strictNullChecks` aktif; `strict` penuh belum)
- **Styling**: Tailwind CSS v4 + shadcn/ui. `src/globals.css` — folder di luar `src/` disebut
  eksplisit lewat `@source`, jangan dihapus
- **State Management**: TanStack React Query (QueryClient dibuat per-request di `src/router.tsx`)
- **Authentication**: opaque token (`dsk_`) di localStorage
- **API**: REST backend (Go) di `VITE_API_BASE_URL`

## Project Structure

```
src/
├── router.tsx          # getRouter(): QueryClient PER-REQUEST (jangan jadikan singleton —
│                       #   cache server akan bocor antar-user), SSR-query integration
├── start.ts            # middleware global: CSRF (WAJIB manual) + security headers + portalGuard
├── globals.css         # Tailwind v4 entry + @source
├── routeTree.gen.ts    # DIGENERATE plugin Vite — jangan diedit tangan
└── routes/
    ├── __root.tsx      # dokumen HTML, head/SEO root, errorComponent, notFoundComponent
    ├── -components/    # prefix `-` = BUKAN route (bukan `_`, itu pathless layout)
    ├── sitemap[.]xml.ts# server route; `[.]` = titik bagian dari path
    ├── _public/        # portal publik (pathless layout, tidak masuk URL)
    ├── admin/          # /admin/*
    ├── portal-terapis/ # /portal-terapis/*
    └── portal-yayasan/ # /portal-yayasan/*

components/
├── ui/                 # shadcn/ui components
├── Header.tsx          # Public header with navigation
├── Footer.tsx          # Public footer
└── ...                 # Feature components

hooks/
├── useAuth.tsx         # Authentication context and hooks
├── use-toast.ts        # Toast notifications
└── use-mobile.tsx      # Mobile detection

lib/
├── api/
│   ├── client.ts       # API client with fetch wrapper
│   ├── types.ts        # TypeScript interfaces
│   └── services.ts     # Service-specific API methods
└── utils.ts            # Utility functions (cn, etc.)
```

## Key Conventions

### Isomorphic by default

- **Tidak ada `'use client'`.** Komponen jalan di server dan klien sekaligus.
- Kode khusus browser (`localStorage`, `window`) harus di dalam `useEffect` atau dijaga
  `typeof window !== 'undefined'`.
- Tidak ada SSG/prerender — SSR penuh (keputusan founder, demi SEO).

### API Client Pattern

```typescript
import { apiClient } from '@/lib/api/client';

// Making API calls
const response = await apiClient.publicArticles.list({ limit: 10 });
if (response.error) throw new Error(response.error);
const data = response.data;
```

### Authentication

- User auth token: `localStorage.getItem('auth_token')`
- Admin auth token: `localStorage.getItem('admin_token')`
- Auth context via `useAuth()` hook
- Logout clears all tokens via `clearAllTokens()`

### Navigation

```typescript
import { Link, useNavigate } from '@tanstack/react-router';

// Path statis
<Link to="/artikel">Artikel</Link>

// Path dinamis — JANGAN interpolasi string, pakai params
<Link to="/artikel/$slug" params={{ slug: article.slug }}>{article.title}</Link>

// Query string → `search`, butuh `validateSearch` di route tujuan
<Link to="/skrining-denver" search={{ age: 24 }}>Skrining</Link>

// Programatik
const navigate = useNavigate();
navigate({ to: '/admin/dashboard' });
navigate({ to: '/auth', search: { redirect: '/konsultasi/mulai' }, replace: true });
```

`to` bertipe union path asli dari route tree — tautan rusak jadi error `tsc`, bukan 404 diam-diam.
**Tautan internal portal wajib pakai prefix penuh** (`/portal-terapis/dashboard`), karena rewrite
host `middleware.ts` Next tidak punya padanan.

### Metadata / SEO

`export const metadata` diganti `head` di route. Objek gaya Next dipertahankan dan diterjemahkan
`metaFrom()` di `lib/seo/head.ts`:

```typescript
export const Route = createFileRoute('/_public/tentang/')({
  head: () => metaFrom({ title: 'Tentang Kami', description: '…' }),
});
```

Untuk metadata yang butuh data, pakai `loader` + `head({ loaderData })` — **jangan** `defer` field
yang dipakai `head`, karena data ter-stream sampai setelah shell HTML dikirim.

### Isi halaman wajib ikut SSR

Halaman publik yang isinya dari `useQuery` **harus** punya `loader` yang memanggil
`context.queryClient.ensureQueryData({ queryKey, queryFn })` dengan key & fn **identik** dengan
komponennya. Tanpa itu `isPending` selalu true saat render server dan HTML yang dikirim ke crawler
hanya spinner "Memuat…". Hanya query utama yang boleh memblokir render — query sekunder (jadwal,
slot, rekomendasi) diberi penanda memuat di bagiannya sendiri.

⚠️ `validateSearch` **jangan** mengembalikan nilai default (`tab: 'profil'`, `age: 0`). TanStack
akan menormalkan URL dan setiap kunjungan dijawab 307 ke URL berparameter. Kembalikan `undefined`,
beri default di pemakainya.

⚠️ `head` induk ikut ke semua anaknya. `meta` di-dedup, **`links` tidak** — jadi jangan menaruh
`canonical` di layout yang punya halaman detail.

## Environment Variables

`VITE_*`, dibaca lewat `import.meta.env` dan **di-inline saat build** — menyetelnya sebagai env
runtime container tidak berpengaruh, harus `--build-arg` (lihat `Dockerfile`).

```env
VITE_API_BASE_URL=http://localhost:8082/v1
VITE_CENTRIFUGO_URL=ws://localhost:8000/connection/websocket
VITE_SITE_URL=https://disabilitasku.id
VITE_API_TIMEOUT=10000
```

## Commands

```bash
# Node 22 wajib (mesin dev punya node@20 sebagai default):
export PATH="/usr/local/opt/node@22/bin:$PATH"

npm run dev      # vite dev
npm run build    # vite build → .output/
npm start        # node .output/server/index.mjs
npx tsc --noEmit # typecheck (satu-satunya gerbang otomatis: vitest masih rusak)
```

## API Endpoints

### Public
- `GET /public/articles` - List articles
- `GET /public/articles/:slug` - Article detail
- `GET /public/locations` - List therapy locations
- `GET /public/events` - List events
- `GET /public/forum/threads` - List forum threads

### Auth
- `POST /auth/signin` - Login
- `POST /auth/signup` - Register
- `POST /auth/signout` - Logout
- `GET /auth/me` - Current user

### Admin (requires admin token)
- `/admin/users` - User management
- `/admin/locations` - Location management
- `/admin/therapists` - Therapist management
- `/admin/articles` - Article management
- `/admin/appointments` - Appointment management

## Indonesian Language

The UI is in Indonesian (Bahasa Indonesia):
- "Masuk" = Login
- "Daftar" = Register
- "Artikel" = Articles
- "Layanan" = Services
- "Acara" = Events
- "Komunitas" = Communities
- "Profil" = Profile
- "Forum" = Forum

## Notes

- `vitest` **sudah jalan** sejak 2026-08-23 (jsdom dipasang sebagai devDependency). `npx vitest run`
  dan `npx tsc --noEmit` dua-duanya gerbang otomatis.
- **Lockfile FE regenerate HANYA dengan `npm@11`** (salin package.json ke folder kosong →
  `npx npm@11 install` → salin lock balik). `npm@10 install` menulis lock yang ditolak `npm ci`
  sendiri (`ajv@6 does not satisfy ajv@8`) dan `docker build` gagal di langkah `npm ci`.
- **`vite` dipin `7.3.6`.** Vite 8 (rolldown) gagal meresolusi `@import "tailwindcss"` Tailwind v4:
  `[postcss] ENOENT: open '/app/tailwindcss'`. Jangan lepas pin tanpa `docker build` sampai selesai.
- Repo belum git. Cadangan pra-migrasi: `/Users/macbookpro/Sarana/disabilitasku-nextjs-SNAPSHOT-2026-08-09`.
- Admin memakai alur autentikasi terpisah.
