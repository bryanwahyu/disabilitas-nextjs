import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { SITE_URL } from '@/lib/api/seo';

export const Route = createFileRoute('/_public/feedback')({
  head: () => metaFrom(metadata),
  component: FeedbackLayout,
});


const metadata = {
  title: 'Kirim Masukan',
  description: 'Kirim masukan, saran, atau laporan masalah untuk membantu DisabilitasKu menjadi lebih baik.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/feedback`,
  },
};

function FeedbackLayout() {
  return <><Outlet /></>;
}
