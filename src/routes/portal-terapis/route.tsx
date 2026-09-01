import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/portal-terapis')({
  head: () => metaFrom(metadata),
  component: TerapisLayout,
});


const metadata = {
  title: {
    default: "Portal Terapis — DisabilitasKu",
    template: "%s | Terapis DisabilitasKu",
  },
  description: "Portal terapis independen DisabilitasKu.id",
  robots: { index: false, follow: false },
};

// Tema gelap khusus portal terapis (dipindah dari <body> root yang bertema terang).
function TerapisLayout({
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
