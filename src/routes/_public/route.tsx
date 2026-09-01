import { createFileRoute, Outlet } from '@tanstack/react-router';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

/**
 * Layout portal publik — dari `app/(public)/layout.tsx`.
 *
 * Pathless layout (`_public`): membungkus semua halaman publik tanpa menambah
 * segmen ke URL, persis seperti route group `(public)` di Next.
 */
export const Route = createFileRoute('/_public')({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-primary-foreground"
      >
        Lewati ke konten utama
      </a>
      <Header />
      <main id="main-content" className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
