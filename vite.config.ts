import { defineConfig } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';

export default defineConfig({
  server: {
    port: 3000,
    // Dev server Vite menolak Host header asing (proteksi DNS-rebinding). Tanpa
    // daftar ini, menguji isolasi portal secara lokal — `curl -H "Host:
    // admin.disabilitasku.id"` — selalu balas 403 dari Vite, bukan dari
    // `portalGuard`, jadi hasilnya menyesatkan. Produksi tidak lewat sini
    // (Nitro yang melayani), jadi ini murni alat uji.
    allowedHosts: [
      'disabilitasku.id',
      'admin.disabilitasku.id',
      'terapis.disabilitasku.id',
      'yayasan.disabilitasku.id',
    ],
  },

  plugins: [
    // Urutan wajib: tanstackStart() HARUS sebelum viteReact().
    // Ditegaskan di skill migrasi resmi TanStack; membaliknya bikin transform
    // route gagal dengan error yang menyesatkan.
    tanstackStart({
      srcDirectory: 'src',
      router: {
        // SENGAJA bukan './app'.
        //
        // Generator TanStack memperlakukan SETIAP file di routesDirectory
        // sebagai route (kecuali yang berprefix `-`). Mengarahkannya ke ./app
        // saat 84 `page.tsx` Next dan puluhan `_components/` masih di sana
        // menghasilkan route sampah dan generator gagal sejak file pertama.
        //
        // Jadi: route TanStack diisi bertahap ke src/routes/, `app/` dihapus
        // setelah route terakhir pindah.
        // Relatif terhadap `srcDirectory` di atas, BUKAN root proyek.
        // Terbukti dari error generator: './src/routes' dicari di 'src/src/routes'.
        routesDirectory: './routes',
        generatedRouteTree: './routeTree.gen.ts',
      },
    }),
    viteReact(),
    // Menghasilkan .output/ yang self-contained untuk container produksi.
    // Catatan: docs TanStack sendiri menandai plugin nitro/vite masih
    // "under active development".
    nitro(),
  ],

  resolve: {
    alias: {
      // Menggantikan `paths: { "@/*": ["./*"] }` di tsconfig, yang hanya
      // dimengerti TypeScript — Vite butuh alias runtime-nya sendiri.
      '@': new URL('.', import.meta.url).pathname.replace(/\/$/, ''),
    },
  },
});
