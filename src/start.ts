import {
  createStart,
  createMiddleware,
  createCsrfMiddleware,
} from '@tanstack/react-start';

/**
 * Global request middleware.
 *
 * Menggantikan `middleware.ts` Next, dengan satu perbedaan yang disengaja:
 * **tidak ada rewrite path**. TanStack tidak menyediakannya di lapisan ini
 * (`next()` hanya menerima `{ context }`), jadi prefix portal sekarang tampil
 * apa adanya di URL — `terapis.disabilitasku.id/portal-terapis/jadwal`.
 * Yang tetap dipertahankan penuh adalah bagian keamanannya: **default-deny**.
 *
 * Prefix tidak bisa sekadar dibuang: `/jadwal`, `/dashboard`, `/pelatihan`,
 * `/profil`, `/komunitas`, `/acara`, dan `/ulasan` sudah dipakai portal publik.
 * Route tree TanStack tunggal — satu path hanya bisa memetakan ke satu komponen.
 *
 * ⚠️ Belum pernah dijalankan: butuh Node ≥ 22.12.0, mesin dev masih 20.19.2.
 */

type Portal = 'public' | 'admin' | 'terapis' | 'yayasan';

/** Prefix path internal → portal yang berhak mengaksesnya. */
const PREFIX_OWNER: ReadonlyArray<readonly [string, Portal]> = [
  ['/admin', 'admin'],
  ['/portal-terapis', 'terapis'],
  ['/portal-yayasan', 'yayasan'],
];

/** Tentukan portal dari hostname. `null` = host dev, semua diizinkan. */
function detectPortal(host: string): Portal | null {
  const hostname = host.split(':')[0].toLowerCase();

  // Dev lokal tidak punya subdomain. Izinkan akses semua portal lewat path
  // supaya pengembangan tidak perlu mengarang entri /etc/hosts.
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local')
  ) {
    return null;
  }

  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('terapis.')) return 'terapis';
  if (hostname.startsWith('yayasan.')) return 'yayasan';
  return 'public';
}

/** Prefix milik tiap host portal (kebalikan `PREFIX_OWNER`). */
const OWNER_PREFIX: Partial<Record<Portal, string>> = {
  admin: '/admin',
  terapis: '/portal-terapis',
  yayasan: '/portal-yayasan',
};

/**
 * Berkas statis dan endpoint internal (aset build, HMR Vite, well-known).
 * Ini tidak boleh ikut dialihkan ke prefix portal — kalau ikut, host portal
 * kehilangan CSS, logo, dan favicon-nya.
 */
function isAssetPath(pathname: string): boolean {
  return (
    /\.[a-z0-9]+$/i.test(pathname) ||
    pathname.startsWith('/_') ||
    pathname.startsWith('/@') ||
    pathname.startsWith('/.well-known')
  );
}

/**
 * Isolasi portal.
 *
 * Dua aturan, keduanya menggantikan `middleware.ts` Next:
 *
 * 1. **Default-deny lintas portal.** Prefix portal hanya boleh diakses dari host
 *    pemiliknya; selain itu 404 — bukan 403, karena keberadaan portal lain tidak
 *    perlu dibocorkan.
 * 2. **Host portal hanya menyajikan portalnya.** Dulu `middleware.ts` me-*rewrite*
 *    host → prefix, jadi `terapis.disabilitasku.id/jadwal` adalah jadwal terapis
 *    dan halaman publik tidak pernah muncul di sana. Tanpa aturan ini, path
 *    publik ikut terlayani di host portal: `terapis.disabilitasku.id/` akan
 *    menampilkan **beranda publik**, dan itu persis halaman yang dituju alur
 *    login terapis. Karena rewrite tidak ada padanannya, dipakai **redirect 301**
 *    ke prefix — sekaligus menyelamatkan bookmark lama (`/jadwal` →
 *    `/portal-terapis/jadwal`).
 *
 * Ini pertahanan berlapis, bukan pertahanan utama — otorisasi sebenarnya tetap
 * di Go API per-endpoint. Sesi juga sudah terisolasi per-origin karena token
 * disimpan di localStorage.
 */
const portalGuard = createMiddleware().server(({ next, request, pathname }) => {
  const portal = detectPortal(request.headers.get('host') ?? '');
  if (portal === null) return next();

  for (const [prefix, owner] of PREFIX_OWNER) {
    const underPrefix = pathname === prefix || pathname.startsWith(`${prefix}/`);
    if (underPrefix && portal !== owner) {
      // 404, bukan 403: keberadaan portal lain tidak perlu dibocorkan.
      return new Response('Not Found', { status: 404 });
    }
  }

  const ownPrefix = OWNER_PREFIX[portal];
  if (ownPrefix && !isAssetPath(pathname)) {
    const inOwnPortal = pathname === ownPrefix || pathname.startsWith(`${ownPrefix}/`);
    if (!inOwnPortal) {
      const { search } = new URL(request.url);
      const target = pathname === '/' ? ownPrefix : `${ownPrefix}${pathname}`;
      return new Response(null, {
        status: 301,
        headers: { Location: `${target}${search}` },
      });
    }
  }

  return next();
});

/**
 * Header keamanan.
 *
 * Menggantikan blok `headers()` di `next.config.ts`. Catatan penting: middleware
 * ini hanya menyentuh respons yang melewati handler Start — aset statis yang
 * dilayani Nitro/CDN langsung TIDAK lewat sini. Karena itu Caddy tetap tempat
 * yang benar untuk header yang harus berlaku ke *semua* respons; yang di sini
 * adalah lapis kedua supaya dev lokal tidak berjalan tanpa proteksi.
 */
const securityHeaders = createMiddleware().server(async ({ next }) => {
  const result = await next();
  const h = result.response.headers;

  h.set('X-Frame-Options', 'DENY');
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  h.set(
    'Content-Security-Policy',
    import.meta.env.DEV
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' http: https: ws: wss:; frame-ancestors 'none';"
      : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none';"
  );

  return result;
});

export const startInstance = createStart(() => ({
  requestMiddleware: [
    // ⚠️ WAJIB DITULIS MANUAL.
    // Selama `src/start.ts` tidak ada, Start memasang CSRF middleware sendiri.
    // Begitu file ini dibuat, pemasangan otomatis itu BERHENTI. Menghapus baris
    // di bawah = server function tidak terlindungi dari cross-site request,
    // tanpa error apa pun yang kelihatan.
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === 'serverFn' }),
    securityHeaders,
    portalGuard,
  ],
}));
