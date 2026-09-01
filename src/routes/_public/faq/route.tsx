import { metaFrom } from '@/lib/seo/head';
import { Outlet, createFileRoute } from '@tanstack/react-router';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/JsonLd';

export const Route = createFileRoute('/_public/faq')({
  head: () => metaFrom(metadata),
  component: FAQLayout,
});


const metadata = {
  title: 'FAQ - Pertanyaan yang Sering Diajukan',
  description: 'Temukan jawaban atas pertanyaan yang sering diajukan tentang layanan DisabilitasKu, terapi disabilitas, dan cara menggunakan platform kami.',
  keywords: ['FAQ disabilitas', 'pertanyaan disabilitas', 'bantuan DisabilitasKu', 'cara menggunakan DisabilitasKu'],
  openGraph: {
    title: 'FAQ - Pertanyaan yang Sering Diajukan | DisabilitasKu',
    description: 'Temukan jawaban atas pertanyaan yang sering diajukan tentang layanan DisabilitasKu.',
  },
  alternates: {
    canonical: 'https://disabilitasku.id/faq',
  },
};

const faqData = [
  { question: 'Apa itu DisabilitasKu?', answer: 'DisabilitasKu adalah platform digital yang menghubungkan penyandang disabilitas dengan layanan kesehatan, terapi, dan komunitas pendukung. Platform ini dibangun oleh dan untuk penyandang disabilitas dengan tujuan menciptakan ekosistem yang inklusif.' },
  { question: 'Apakah layanan DisabilitasKu berbayar?', answer: 'Pendaftaran akun dan penggunaan platform dasar sepenuhnya gratis. Untuk layanan terapi dan konsultasi, biaya tergantung pada masing-masing terapis atau lokasi layanan yang Anda pilih.' },
  { question: 'Siapa saja yang bisa mendaftar?', answer: 'DisabilitasKu terbuka untuk semua orang - penyandang disabilitas, orang tua/wali, terapis dari organisasi, terapis independen, dan siapa saja yang ingin berkontribusi dalam komunitas disabilitas.' },
  { question: 'Jenis akun apa saja yang tersedia?', answer: 'DisabilitasKu menyediakan 4 jenis akun: Penyandang Disabilitas, Orang Tua/Wali, Terapis Organisasi, dan Terapis Independen.' },
  { question: 'Bagaimana cara mendaftar akun?', answer: 'Klik tombol "Daftar" di halaman utama, pilih jenis akun yang sesuai, isi formulir pendaftaran dengan nama, email, dan password.' },
  { question: 'Jenis terapi apa saja yang tersedia?', answer: 'Kami menyediakan berbagai jenis terapi termasuk terapi fisik, terapi okupasi, terapi wicara, terapi sensori integrasi, dan konseling psikologi.' },
  { question: 'Bagaimana cara booking jadwal terapi?', answer: 'Pilih lokasi atau terapis yang diinginkan, lihat jadwal yang tersedia, pilih waktu yang sesuai, dan konfirmasi booking Anda.' },
  { question: 'Apakah bisa konsultasi online?', answer: 'Ya, beberapa terapis menyediakan layanan konsultasi online melalui Zoom atau Google Meet.' },
  { question: 'Apakah data saya aman?', answer: 'Ya, kami menggunakan enkripsi dan protokol keamanan standar industri untuk melindungi data Anda. Data medis dan pribadi hanya bisa diakses oleh pihak yang berwenang.' },
];

function FAQLayout() {
  return (
    <>
      <FAQJsonLd questions={faqData} />
      <BreadcrumbJsonLd
        items={[
          { name: 'Beranda', url: 'https://disabilitasku.id' },
          { name: 'FAQ', url: 'https://disabilitasku.id/faq' },
        ]}
      />
      <Outlet />
    </>
  );
}
