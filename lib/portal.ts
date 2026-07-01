/**
 * Routing pasca-login berbasis role.
 *
 * Tiap role "pemilik portal" tinggal di subdomain sendiri (sesi localStorage
 * terisolasi per-origin, lihat middleware.ts). Saat user login di portal publik
 * (disabilitasku.id), kita lempar ke subdomain portal-nya. Karena origin beda,
 * user akan login ulang di portal tujuan — itu memang perilaku yang diinginkan.
 *
 * Di dev lokal tidak ada subdomain, jadi pakai path internal (/portal-yayasan,
 * /portal-terapis, /admin) yang diizinkan middleware mode "dev".
 */

type PortalRole = 'therapy' | 'therapist_independent' | 'admin';

const SUBDOMAIN: Record<PortalRole, string> = {
  therapy: 'yayasan',
  therapist_independent: 'terapis',
  admin: 'admin',
};

const DEV_PATH: Record<PortalRole, string> = {
  therapy: '/portal-yayasan',
  therapist_independent: '/portal-terapis',
  admin: '/admin',
};

function isLocalHost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.local')
  );
}

/** Domain root tanpa subdomain portal yang sudah ada (mis. www / yayasan / terapis). */
function rootDomain(hostname: string): string {
  const cleaned = hostname.replace(/^www\./, '');
  for (const sub of Object.values(SUBDOMAIN)) {
    if (cleaned.startsWith(`${sub}.`)) return cleaned.slice(sub.length + 1);
  }
  return cleaned;
}

/**
 * Tujuan redirect untuk role tertentu. Mengembalikan `null` jika role tidak
 * punya portal khusus (caller pakai default-nya sendiri).
 */
export function portalDestinationForRole(role: string | undefined): string | null {
  if (!role || !(role in SUBDOMAIN)) return null;
  const portalRole = role as PortalRole;

  if (typeof window === 'undefined') return DEV_PATH[portalRole];

  const { hostname, protocol, port } = window.location;
  if (isLocalHost(hostname)) return DEV_PATH[portalRole];

  const root = rootDomain(hostname);
  const portSuffix = port ? `:${port}` : '';
  return `${protocol}//${SUBDOMAIN[portalRole]}.${root}${portSuffix}`;
}
