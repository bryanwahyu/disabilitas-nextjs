import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/portal-yayasan')({
  head: () => metaFrom(metadata),
  component: YayasanLayout,
});


const metadata = {
  title: {
    default: "Portal Yayasan — DisabilitasKu",
    template: "%s | Yayasan DisabilitasKu",
  },
  description: "Portal yayasan/klinik terapi DisabilitasKu.id",
  robots: { index: false, follow: false },
};

// Tema gelap khusus portal yayasan. Root <body> bertema terang, jadi warna
// dipindah ke wrapper ini (route-group layout tidak boleh me-render <html>/<body>).
function YayasanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased bg-slate-950 text-white min-h-screen">
      <Outlet />
    </div>
  );
}
