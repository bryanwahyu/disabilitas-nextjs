import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  head: () => metaFrom(metadata),
  component: AdminLayout,
});


const metadata = {
  title: {
    default: "Admin Panel — DisabilitasKu",
    template: "%s | Admin DisabilitasKu",
  },
  description: "Admin panel untuk pengelolaan platform DisabilitasKu.id",
  robots: { index: false, follow: false },
};

function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <><Outlet /></>;
}
