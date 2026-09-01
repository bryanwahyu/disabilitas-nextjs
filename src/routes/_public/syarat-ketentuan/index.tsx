
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/syarat-ketentuan/')({
  component: SyaratKetentuanPage,
});


function SyaratKetentuanPage() {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Ketentuan Umum',
      content: `
        <p>Dengan mengakses dan menggunakan platform DisabilitasKu, Anda menyetujui untuk terikat dengan syarat dan ketentuan ini. Jika Anda tidak setuju dengan ketentuan ini, mohon untuk tidak menggunakan layanan kami.</p>
        <p>DisabilitasKu adalah platform digital yang menyediakan layanan penghubung antara penyandang disabilitas dengan penyedia layanan kesehatan dan komunitas pendukung.</p>
      `,
    },
    {
      title: '2. Pendaftaran Akun',
      content: `
        <ul>
          <li>Anda harus berusia minimal 17 tahun atau memiliki izin dari orang tua/wali untuk mendaftar.</li>
          <li>Informasi yang Anda berikan saat pendaftaran harus akurat dan lengkap.</li>
          <li>Anda bertanggung jawab menjaga kerahasiaan akun dan password Anda.</li>
          <li>Anda bertanggung jawab atas semua aktivitas yang terjadi di akun Anda.</li>
          <li>Segera laporkan jika ada penggunaan tidak sah atas akun Anda.</li>
        </ul>
      `,
    },
    {
      title: '3. Penggunaan Layanan',
      content: `
        <p>Anda setuju untuk menggunakan layanan DisabilitasKu hanya untuk tujuan yang sah dan sesuai dengan ketentuan ini. Anda tidak diperkenankan untuk:</p>
        <ul>
          <li>Menyebarkan konten yang melanggar hukum, menyinggung, atau merugikan pihak lain.</li>
          <li>Menggunakan layanan untuk tujuan komersial tanpa izin tertulis.</li>
          <li>Mencoba mengakses sistem atau data tanpa otorisasi.</li>
          <li>Menyebarkan virus, malware, atau kode berbahaya lainnya.</li>
          <li>Melakukan tindakan yang dapat mengganggu atau merusak layanan.</li>
        </ul>
      `,
    },
    {
      title: '4. Layanan Kesehatan',
      content: `
        <p>DisabilitasKu menyediakan platform untuk menghubungkan pengguna dengan penyedia layanan kesehatan. Perlu dipahami bahwa:</p>
        <ul>
          <li>DisabilitasKu bukan penyedia layanan kesehatan langsung.</li>
          <li>Kualitas layanan kesehatan adalah tanggung jawab masing-masing penyedia layanan.</li>
          <li>Informasi kesehatan di platform ini bersifat edukatif dan bukan pengganti konsultasi medis profesional.</li>
          <li>Keputusan terkait kesehatan harus dibuat berdasarkan konsultasi dengan profesional kesehatan.</li>
        </ul>
      `,
    },
    {
      title: '5. Konten Pengguna',
      content: `
        <p>Dengan mengunggah konten ke platform DisabilitasKu, Anda:</p>
        <ul>
          <li>Menjamin bahwa konten tersebut adalah milik Anda atau Anda memiliki hak untuk membagikannya.</li>
          <li>Memberikan DisabilitasKu lisensi non-eksklusif untuk menggunakan konten tersebut dalam operasional platform.</li>
          <li>Bertanggung jawab penuh atas konten yang Anda unggah.</li>
        </ul>
        <p>DisabilitasKu berhak menghapus konten yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.</p>
      `,
    },
    {
      title: '6. Pembatasan Tanggung Jawab',
      content: `
        <p>DisabilitasKu menyediakan layanan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas:</p>
        <ul>
          <li>Kerugian langsung maupun tidak langsung yang timbul dari penggunaan layanan.</li>
          <li>Gangguan atau ketidaktersediaan layanan.</li>
          <li>Tindakan atau kelalaian pihak ketiga, termasuk penyedia layanan kesehatan.</li>
          <li>Kehilangan data atau kerusakan perangkat.</li>
        </ul>
      `,
    },
    {
      title: '7. Perubahan Ketentuan',
      content: `
        <p>DisabilitasKu berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui platform atau email. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan atas ketentuan yang baru.</p>
      `,
    },
    {
      title: '8. Penghentian Layanan',
      content: `
        <p>DisabilitasKu berhak menangguhkan atau menghentikan akses Anda ke layanan jika:</p>
        <ul>
          <li>Anda melanggar syarat dan ketentuan ini.</li>
          <li>Anda melakukan tindakan yang merugikan platform atau pengguna lain.</li>
          <li>Atas pertimbangan keamanan atau operasional.</li>
        </ul>
      `,
    },
    {
      title: '9. Hukum yang Berlaku',
      content: `
        <p>Syarat dan ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan melalui musyawarah, dan jika tidak tercapai kesepakatan, akan diselesaikan melalui pengadilan yang berwenang di Indonesia.</p>
      `,
    },
    {
      title: '10. Kontak',
      content: `
        <p>Jika Anda memiliki pertanyaan tentang syarat dan ketentuan ini, silakan hubungi kami melalui:</p>
        <ul>
          <li>Email: bryanwahyukp95@gmail.com</li>
          <li>Halaman Kontak di website kami</li>
        </ul>
      `,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/' })}
            className="mb-6 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Syarat & <span className="text-primary">Ketentuan</span>
            </h1>
            <p className="text-gray-600">
              Terakhir diperbarui: Januari 2026
            </p>
          </div>

          {/* Content */}
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <div className="prose prose-gray max-w-none">
              {sections.map((section) => (
                <div key={section.title} className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h2>
                  <div
                    className="text-gray-600 leading-relaxed [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:mb-4"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              Dengan menggunakan DisabilitasKu, Anda menyetujui syarat dan ketentuan di atas.
            </p>
            <Button onClick={() => navigate({ to: '/auth' })}>
              Daftar Sekarang
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
