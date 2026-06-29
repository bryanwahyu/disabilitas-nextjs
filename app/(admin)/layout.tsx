import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Admin Panel — DisabilitasKu",
    template: "%s | Admin DisabilitasKu",
  },
  description: "Admin panel untuk pengelolaan platform DisabilitasKu.id",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
