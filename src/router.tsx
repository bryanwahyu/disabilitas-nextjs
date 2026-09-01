import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';
import { isRetriableError } from '@/lib/query/unwrap';
import { routeTree } from './routeTree.gen';

/**
 * Router + QueryClient.
 *
 * `getRouter()` dipanggil **sekali per request** saat SSR. Karena itu
 * `QueryClient` harus dibuat DI DALAM fungsi ini. QueryClient module-level
 * (singleton) akan dipakai bersama oleh semua request server sekaligus →
 * data satu user bisa terbaca user lain. Ini kelas bug paling berbahaya di
 * SSR + cache, dan tidak akan terlihat saat dev satu tab.
 *
 * Default query di sini disalin dari `app/providers.tsx` supaya perilaku cache
 * yang sudah dituning (dan sudah dipakai 115 useQuery + 88 useMutation) tidak
 * berubah saat pindah framework.
 */
export function getRouter() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: (failureCount, error) =>
          failureCount < 2 && isRetriableError(error),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        retry: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // WAJIB 0. Default-nya 30 detik, dan itu adalah cache preload milik Router
    // yang duduk di ATAS cache Query — hasilnya staleTime yang kita atur di
    // Query jadi tidak berlaku untuk navigasi hasil preload.
    defaultPreloadStaleTime: 0,
    defaultPreload: 'intent',
    scrollRestoration: true,
  });

  // Menjahit dehidrasi (server) → hidrasi (client) cache Query, streaming query
  // yang selesai saat render server, dan redirect() yang dilempar dari
  // query/mutation. Tanpa ini, tiap halaman SSR akan memuat ulang datanya di
  // klien — persis masalah yang baru saja kita hilangkan.
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
