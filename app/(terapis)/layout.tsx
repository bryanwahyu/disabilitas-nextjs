import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Portal Terapis — DisabilitasKu",
    template: "%s | Terapis DisabilitasKu",
  },
  description: "Portal terapis independen DisabilitasKu.id",
  robots: { index: false, follow: false },
};

// Tema gelap khusus portal terapis (dipindah dari <body> root yang bertema terang).
export default function TerapisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="antialiased bg-slate-950 text-white min-h-screen">
      {children}
    </div>
  );
}
