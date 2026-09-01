import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { AuthProvider } from '@/hooks/useAuth';
import { CentrifugoProvider } from '@/hooks/CentrifugoProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { env } from '@/lib/env';
import appCss from '@/src/globals.css?url';
import ErrorPage from './-components/ErrorPage';
import NotFoundPage from './-components/NotFoundPage';

/**
 * Root route — menggantikan `app/layout.tsx`.
 *
 * Perbedaan penting dari Next yang harus diingat saat mengonversi 84 route:
 *
 * 1. **Tidak ada `title.template`.** Next merangkai `"%s | DisabilitasKu"`
 *    otomatis. Di sini aturannya "occurrence terakhir menang" — tiap route yang
 *    menyetel `title` harus menuliskan sufiksnya sendiri.
 * 2. **`createRootRouteWithContext<T>()({...})` pakai dua pasang kurung.**
 *    Yang pertama menetapkan tipe context, yang kedua opsi route-nya.
 * 3. **Tidak ada `QueryClientProvider` di sini.** `setupRouterSsrQueryIntegration`
 *    di `src/router.tsx` yang memasangnya, sekaligus mengurus dehidrasi →
 *    hidrasi. Memasangnya dua kali membuat cache SSR terlepas dari cache klien.
 */
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title:
          'DisabilitasKu - Platform Inklusif untuk Penyandang Disabilitas Indonesia',
      },
      {
        name: 'description',
        content:
          'Platform discovery layanan disabilitas terbesar di Indonesia. Temukan 6.000+ lokasi terapi, klinik rehabilitasi, terapis wicara, fisioterapi, terapi autisme, dan Cerebral Palsy. Komunitas, pelatihan, dan lowongan kerja inklusif.',
      },
      {
        name: 'keywords',
        content: [
          'disabilitas Indonesia',
          'lokasi terapi disabilitas',
          'klinik rehabilitasi',
          'terapi autisme',
          'terapi cerebral palsy',
          'terapi wicara',
          'fisioterapi',
          'terapi okupasi',
          'terapi sensori integrasi',
          'penyandang disabilitas',
          'komunitas disabilitas',
          'lowongan kerja disabilitas',
          'inklusi disabilitas',
          'aksesibilitas',
          'DisabilitasKu',
        ].join(', '),
      },
      { name: 'author', content: 'Bryan Wahyu Kresna Putra' },
      { name: 'publisher', content: 'DisabilitasKu' },
      {
        name: 'robots',
        content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      },

      { property: 'og:type', content: 'website' },
      { property: 'og:locale', content: 'id_ID' },
      { property: 'og:site_name', content: 'DisabilitasKu' },
      { property: 'og:url', content: env.siteUrl },
      {
        property: 'og:title',
        content:
          'DisabilitasKu - Platform Inklusif untuk Penyandang Disabilitas Indonesia',
      },
      {
        property: 'og:description',
        content:
          'Platform inklusif yang menghubungkan penyandang disabilitas dengan layanan terapi profesional, konsultasi online, forum komunitas, dan dukungan di Indonesia.',
      },
      { property: 'og:image', content: `${env.siteUrl}/logo-1200.png` },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '360' },
      { property: 'og:image:alt', content: 'DisabilitasKu' },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@disabilitasku' },
      { name: 'twitter:creator', content: '@disabilitasku' },
      {
        name: 'twitter:title',
        content: 'DisabilitasKu - Platform Inklusif untuk Penyandang Disabilitas',
      },
      {
        name: 'twitter:description',
        content:
          'Platform inklusif yang menghubungkan penyandang disabilitas dengan layanan terapi profesional dan dukungan komunitas di Indonesia.',
      },
    ],

    links: [
      { rel: 'stylesheet', href: appCss },
      // Tidak ada canonical di root. `links` tidak di-dedup seperti `meta`,
      // jadi canonical root akan menempel di SETIAP halaman berdampingan dengan
      // canonical halaman itu sendiri — dua canonical berbeda dalam satu
      // dokumen, dan crawler berhak mengabaikan keduanya. Canonical ditulis
      // per-route (22 route sudah punya, termasuk beranda).
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
    ],

    // JSON-LD yang dulu dirender komponen <OrganizationJsonLd/> & <WebSiteJsonLd/>
    // di dalam <head>. Di TanStack, script head adalah data, bukan komponen.
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'DisabilitasKu',
          url: env.siteUrl,
          logo: `${env.siteUrl}/logo-1200.png`,
          sameAs: ['https://twitter.com/disabilitasku'],
        }),
      },
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'DisabilitasKu',
          url: env.siteUrl,
        }),
      },
    ],
  }),

  // Padanan `app/error.tsx` dan `app/not-found.tsx` Next. Dipasang di root
  // supaya berlaku untuk seluruh portal; route yang butuh tampilan sendiri
  // boleh menimpanya lewat opsi yang sama.
  errorComponent: ErrorPage,
  notFoundComponent: NotFoundPage,

  shellComponent: RootDocument,
});

function RootDocument() {
  return (
    <html lang="id" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <CentrifugoProvider>
            <TooltipProvider>
              <Outlet />
              <Toaster />
            </TooltipProvider>
          </CentrifugoProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
