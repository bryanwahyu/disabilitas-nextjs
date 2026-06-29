import { NextResponse, type NextRequest } from 'next/server';

/**
 * Multi-tenant host routing.
 *
 * Satu Next.js app melayani 4 portal lewat subdomain. Route group di App Router
 * transparan terhadap URL, jadi tiap portal punya prefix path internal:
 *
 *   (public)/...                    -> disabilitasku.id          -> /*  (tanpa prefix)
 *   (admin)/admin/...               -> admin.disabilitasku.id    -> /admin/*
 *   (terapis)/portal-terapis/...    -> terapis.disabilitasku.id  -> /portal-terapis/*
 *   (yayasan)/portal-yayasan/...    -> yayasan.disabilitasku.id  -> /portal-yayasan/*
 *
 * Prefix portal sengaja unik & tak terlihat user (disembunyikan rewrite) supaya tidak
 * bentrok dengan halaman publik yang sudah ada seperti /terapis (browse terapis), /jadwal,
 * /dashboard, dsb.
 *
 * Middleware:
 *  1. Deteksi portal dari Host header.
 *  2. Rewrite URL bersih di subdomain (mis. admin.../jadwal) ke path internal (/admin/jadwal).
 *  3. Hard-block: prefix portal tidak boleh diakses dari host yang salah (default-deny).
 *
 * Catatan keamanan: token sesi disimpan di localStorage (per-origin), jadi sesi
 * antar subdomain sudah terisolasi. Otorisasi sebenarnya tetap di Go API per-endpoint;
 * guard role di sisi klien dilakukan di layout tiap portal, bukan di sini.
 */

type Portal = 'public' | 'admin' | 'terapis' | 'yayasan';

const PORTAL_PREFIX: Record<Exclude<Portal, 'public'>, string> = {
  admin: '/admin',
  terapis: '/portal-terapis',
  yayasan: '/portal-yayasan',
};

const ALL_PREFIXES = Object.values(PORTAL_PREFIX);

/** Tentukan portal dari hostname (tanpa port). */
function detectPortal(host: string): Portal | 'dev' {
  const hostname = host.split(':')[0].toLowerCase();

  // Dev lokal: tidak ada subdomain. Izinkan akses path langsung (/admin, /terapis, ...)
  // tanpa rewrite/block supaya gampang dikembangkan.
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local')
  ) {
    return 'dev';
  }

  if (hostname.startsWith('admin.')) return 'admin';
  if (hostname.startsWith('terapis.')) return 'terapis';
  if (hostname.startsWith('yayasan.')) return 'yayasan';
  return 'public';
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const portal = detectPortal(host);
  const { pathname, search } = req.nextUrl;

  // Dev lokal: jangan rewrite/block, biar bisa akses semua portal via path.
  if (portal === 'dev') {
    return NextResponse.next();
  }

  if (portal === 'public') {
    // Host publik tidak boleh menyentuh prefix portal mana pun.
    if (ALL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return new NextResponse('Not Found', { status: 404 });
    }
    return NextResponse.next();
  }

  // Portal subdomain (admin/terapis/yayasan)
  const myPrefix = PORTAL_PREFIX[portal];
  const otherPrefixes = ALL_PREFIXES.filter((p) => p !== myPrefix);

  // Default-deny: prefix portal lain tidak boleh diakses dari subdomain ini.
  if (otherPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Sudah berada di prefix yang benar -> teruskan apa adanya.
  if (pathname === myPrefix || pathname.startsWith(`${myPrefix}/`)) {
    return NextResponse.next();
  }

  // URL bersih di subdomain -> rewrite ke path internal berprefix.
  const url = req.nextUrl.clone();
  url.pathname = `${myPrefix}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.rewrite(url);
}

export const config = {
  // Kecualikan aset statis & internal Next. Middleware tetap jalan untuk route halaman.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
