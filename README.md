# DisabilitasKu Frontend

Aplikasi web platform DisabilitasKu — **TanStack Start** (Router + Vite + Nitro, SSR penuh).
Satu aplikasi melayani **empat portal** sekaligus; pemisahannya lewat `Host` header, bukan
container terpisah.

> Nama folder masih `disabilitas-nextjs` karena alasan historis. Next.js sudah dilepas total
> pada 2026-08-11 — tidak ada `app/`, `middleware.ts`, maupun `next.config.ts` lagi.

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | TanStack Start (Router + Vite + Nitro SSR) — **Node ≥ 22.12 wajib** |
| Bahasa | TypeScript (`strictNullChecks` aktif) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data | TanStack React Query (QueryClient per-request) |
| Real-time | Centrifugo (`centrifuge` npm) |
| Auth | Token opaque `dsk_` di localStorage (bukan JWT) |
| Deploy | Docker + AWS ECR |

## Portal

| Portal | Subdomain | Path internal |
|--------|-----------|---------------|
| Publik | disabilitasku.id | `/` |
| Admin | admin.disabilitasku.id | `/admin/*` |
| Terapis | terapis.disabilitasku.id | `/portal-terapis/*` |
| Yayasan | yayasan.disabilitasku.id | `/portal-yayasan/*` |

`portalGuard` di `src/start.ts` menolak lintas portal dengan **404** (default-deny). Prefix portal
tampil di URL — tautan internal portal **wajib** ditulis lengkap (`/portal-terapis/jadwal`).

## Quick Start

```bash
# Node 22 wajib (mesin dev punya node@20 sebagai default)
export PATH="/usr/local/opt/node@22/bin:$PATH"

npm install
npm run dev      # http://localhost:3000
```

## Commands

```bash
npm run dev       # vite dev
npm run build     # vite build → .output/
npm start         # node .output/server/index.mjs
npx tsc --noEmit  # typecheck — satu-satunya gerbang otomatis yang jalan
npm test          # vitest — ⚠️ MASIH RUSAK (`LRUCache is not a constructor`)
```

Tidak ada script `lint`. `eslint.config.mjs` ada tapi cakupannya minimal (aturan inti saja);
`eslint-config-next` ikut dicopot saat migrasi.

## Struktur Folder

```
disabilitas-nextjs/
├── src/
│   ├── router.tsx          # getRouter(): QueryClient PER-REQUEST (jangan singleton)
│   ├── start.ts            # middleware global: CSRF + security headers + portalGuard
│   ├── globals.css         # Tailwind v4 entry + @source (folder di luar src/)
│   ├── routeTree.gen.ts    # DIGENERATE plugin Vite — jangan diedit tangan
│   └── routes/
│       ├── __root.tsx      # dokumen HTML, head/SEO root, error & notFound component
│       ├── -components/    # prefix `-` = BUKAN route
│       ├── sitemap[.]xml.ts# server route (`[.]` = titik bagian dari path)
│       ├── _public/        # portal publik (pathless layout, tidak masuk URL)
│       ├── admin/ · portal-terapis/ · portal-yayasan/
├── components/             # ui/ (shadcn) + komponen fitur
├── hooks/                  # useAuth, useCentrifugo, useAI, …
├── lib/
│   ├── api/                # client.ts, types.ts, services/
│   ├── query/              # keys.ts (key factory), unwrap.ts
│   ├── seo/head.ts         # metaFrom(): objek metadata → head TanStack
│   └── env.ts              # SATU-SATUNYA tempat import.meta.env dibaca
├── public/                 # robots.txt, manifest.webmanifest, favicon, aset
├── vite.config.ts          # tanstackStart() HARUS sebelum viteReact()
└── Dockerfile              # multi-stage node:22-alpine → .output self-contained
```

## Environment Variables

`VITE_*`, dibaca lewat `import.meta.env` dan **di-inline saat build**. Menyetelnya sebagai env
runtime container **tidak berpengaruh** — harus `--build-arg`.

```env
VITE_API_BASE_URL=http://localhost:8082/v1
VITE_CENTRIFUGO_URL=ws://localhost:8090/connection/websocket
VITE_SITE_URL=https://disabilitasku.id
VITE_API_TIMEOUT=10000
```

Semua punya default di `lib/env.ts`, jadi `npm run dev` jalan tanpa file `.env`.

## Docker

```bash
docker build --platform linux/amd64 \
  --build-arg VITE_API_BASE_URL=https://api.disabilitasku.id/v1 \
  --build-arg VITE_CENTRIFUGO_URL=wss://ws.disabilitasku.id/connection/websocket \
  --build-arg VITE_SITE_URL=https://disabilitasku.id \
  -t disabilitasku-frontend .

# --init WAJIB: node jadi PID 1; tanpa reaper zombie menumpuk (insiden 2026-07-25)
docker run -d --init -p 127.0.0.1:3001:3000 disabilitasku-frontend
```

## Catatan

- **Isomorphic by default** — tidak ada `'use client'`. Kode browser (`localStorage`, `window`)
  harus di dalam `useEffect` atau dijaga `typeof window !== 'undefined'`.
- **SEO**: `head` route induk ikut ke anaknya. `meta` di-dedup, **`links` tidak** — jangan taruh
  `canonical` di layout yang punya halaman detail.
- Repo belum git. Cadangan pra-migrasi:
  `/Users/macbookpro/Sarana/disabilitasku-nextjs-SNAPSHOT-2026-08-09`.
