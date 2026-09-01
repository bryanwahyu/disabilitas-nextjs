
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/faq/')({
  component: FAQPage,
});


function FAQPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const faqs = [
    {
      category: 'Umum',
      questions: [
        {
          q: 'Apa itu DisabilitasKu?',
          a: 'DisabilitasKu adalah platform digital yang menghubungkan penyandang disabilitas dengan layanan kesehatan, terapi, dan komunitas pendukung. Platform ini dibangun oleh dan untuk penyandang disabilitas dengan tujuan menciptakan ekosistem yang inklusif.',
        },
        {
          q: 'Apakah layanan DisabilitasKu berbayar?',
          a: 'Pendaftaran akun dan penggunaan platform dasar sepenuhnya gratis. Untuk layanan terapi dan konsultasi, biaya tergantung pada masing-masing terapis atau lokasi layanan yang Anda pilih.',
        },
        {
          q: 'Siapa saja yang bisa mendaftar?',
          a: 'DisabilitasKu terbuka untuk semua orang - penyandang disabilitas, orang tua/wali, terapis dari organisasi, terapis independen, dan siapa saja yang ingin berkontribusi dalam komunitas disabilitas.',
        },
      ],
    },
    {
      category: 'Akun & Pendaftaran',
      questions: [
        {
          q: 'Jenis akun apa saja yang tersedia?',
          a: 'DisabilitasKu menyediakan 4 jenis akun: (1) Penyandang Disabilitas - untuk pengguna yang membutuhkan layanan, (2) Orang Tua/Wali - untuk pendamping dan keluarga, (3) Terapis Organisasi - untuk terapis yang bekerja di lembaga, (4) Terapis Independen - untuk terapis praktek mandiri.',
        },
        {
          q: 'Bagaimana cara mendaftar akun?',
          a: 'Klik tombol "Daftar" di halaman utama, pilih jenis akun yang sesuai, isi formulir pendaftaran dengan nama, email, dan password. Untuk akun penyandang disabilitas, diperlukan nama orang tua/wali.',
        },
        {
          q: 'Saya lupa password, bagaimana cara resetnya?',
          a: 'Klik "Lupa Password" di halaman login, masukkan email Anda, dan kami akan mengirimkan link untuk reset password ke email Anda.',
        },
        {
          q: 'Bagaimana cara mengubah data profil?',
          a: 'Login ke akun Anda, pergi ke menu "Profil", lalu klik "Edit Profil" untuk mengubah informasi pribadi Anda.',
        },
        {
          q: 'Saya terapis, bagaimana cara mendaftar?',
          a: 'Pilih jenis akun "Terapis Organisasi" jika Anda bekerja di yayasan/klinik/rumah sakit, atau "Terapis Independen" jika Anda praktek mandiri. Setelah mendaftar, Anda bisa mendaftarkan lokasi praktek dan menerima booking dari klien.',
        },
      ],
    },
    {
      category: 'Layanan Terapi',
      questions: [
        {
          q: 'Jenis terapi apa saja yang tersedia?',
          a: 'Kami menyediakan berbagai jenis terapi termasuk terapi fisik, terapi okupasi, terapi wicara, terapi sensori integrasi, dan konseling psikologi.',
        },
        {
          q: 'Bagaimana cara booking jadwal terapi?',
          a: 'Pilih lokasi atau terapis yang diinginkan, lihat jadwal yang tersedia, pilih waktu yang sesuai, dan konfirmasi booking Anda. Terapis akan mengkonfirmasi jadwal Anda.',
        },
        {
          q: 'Apakah bisa konsultasi online?',
          a: 'Ya, beberapa terapis menyediakan layanan konsultasi online melalui Zoom atau Google Meet. Anda bisa memfilter berdasarkan mode layanan saat mencari terapis.',
        },
        {
          q: 'Bagaimana status booking saya?',
          a: 'Status booking ada 4: Pending (menunggu konfirmasi terapis), Confirmed (dikonfirmasi), Completed (selesai), dan Cancelled (dibatalkan). Anda bisa melihat status di halaman "Jadwal Saya".',
        },
        {
          q: 'Bagaimana jika saya ingin membatalkan jadwal?',
          a: 'Anda bisa membatalkan jadwal melalui halaman "Jadwal Saya" dengan klik tombol "Batalkan". Sebaiknya batalkan minimal 24 jam sebelum jadwal.',
        },
      ],
    },
    {
      category: 'Untuk Terapis',
      questions: [
        {
          q: 'Bagaimana cara menerima booking dari klien?',
          a: 'Setelah klien melakukan booking, Anda akan menerima notifikasi. Buka halaman jadwal Anda dan klik "Konfirmasi" untuk menyetujui jadwal tersebut.',
        },
        {
          q: 'Bagaimana cara mendaftarkan lokasi praktek?',
          a: 'Pergi ke menu "Lokasi Layanan", klik "Tambah Lokasi", isi informasi lokasi termasuk alamat, jenis lokasi (klinik/yayasan/praktek mandiri), jam operasional, dan layanan yang tersedia.',
        },
        {
          q: 'Bisakah saya membuat event atau workshop?',
          a: 'Ya, terapis bisa membuat event seperti workshop, seminar, atau kegiatan komunitas. Pergi ke menu "Acara" dan klik "Buat Acara Baru".',
        },
      ],
    },
    {
      category: 'Komunitas & Forum',
      questions: [
        {
          q: 'Apa itu fitur komunitas?',
          a: 'Fitur komunitas memungkinkan Anda bergabung dengan grup-grup diskusi berdasarkan minat atau jenis disabilitas, berbagi pengalaman, dan mendapatkan dukungan dari sesama anggota.',
        },
        {
          q: 'Bagaimana cara bergabung dengan komunitas?',
          a: 'Buka halaman "Komunitas", jelajahi komunitas yang tersedia, dan klik "Gabung" pada komunitas yang Anda minati.',
        },
        {
          q: 'Bisakah saya membuat komunitas sendiri?',
          a: 'Ya, semua pengguna terdaftar bisa membuat komunitas sendiri. Pergi ke halaman "Komunitas" dan klik "Buat Komunitas Baru".',
        },
        {
          q: 'Bagaimana cara berdiskusi di forum?',
          a: 'Buka halaman "Forum", pilih komunitas atau topik yang ingin Anda ikuti, dan klik "Buat Thread" untuk memulai diskusi baru atau balas thread yang sudah ada.',
        },
      ],
    },
    {
      category: 'Keamanan & Privasi',
      questions: [
        {
          q: 'Apakah data saya aman?',
          a: 'Ya, kami menggunakan enkripsi dan protokol keamanan standar industri untuk melindungi data Anda. Data medis dan pribadi hanya bisa diakses oleh pihak yang berwenang.',
        },
        {
          q: 'Siapa yang bisa melihat profil saya?',
          a: 'Profil dasar Anda bisa dilihat oleh pengguna lain di komunitas. Informasi sensitif seperti riwayat medis hanya bisa dilihat oleh terapis yang menangani Anda.',
        },
        {
          q: 'Bagaimana cara melaporkan penyalahgunaan?',
          a: 'Jika Anda menemukan konten atau perilaku yang tidak pantas, gunakan tombol "Laporkan" yang tersedia di setiap halaman atau hubungi kami melalui halaman "Bantuan".',
        },
      ],
    },
  ];

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const filteredFaqs = faqs
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.questions.length > 0);

  let globalIndex = -1;

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
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pertanyaan yang Sering <span className="text-primary">Diajukan</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Temukan jawaban untuk pertanyaan umum tentang DisabilitasKu
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              aria-label="Cari pertanyaan" placeholder="Cari pertanyaan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg"
            />
          </div>

          {/* FAQ List */}
          <div className="space-y-8">
            {filteredFaqs.map((category) => (
              <div key={category.category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">{category.category}</h2>
                <div className="space-y-3">
                  {category.questions.map((item) => {
                    globalIndex++;
                    const currentIndex = globalIndex;
                    const isOpen = openItems.includes(currentIndex);
                    return (
                      <Card
                        key={currentIndex}
                        className={`cursor-pointer transition-all ${
                          isOpen ? 'ring-2 ring-primary/20' : ''
                        }`}
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        onClick={() => toggleItem(currentIndex)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleItem(currentIndex);
                          }
                        }}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-medium text-gray-900">{item.q}</h3>
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                            )}
                          </div>
                          {isOpen && (
                            <p className="mt-4 text-gray-600 leading-relaxed">{item.a}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Tidak ada pertanyaan yang cocok dengan pencarian Anda.</p>
            </div>
          )}

          {/* CTA */}
          <section className="text-center bg-gray-50 rounded-2xl p-8 mt-12">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Masih Ada Pertanyaan?</h2>
            <p className="text-gray-600 mb-6">
              Jika Anda tidak menemukan jawaban yang dicari, silakan hubungi tim support kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate({ to: '/bantuan' })} size="lg">
                Pusat Bantuan
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/feedback' })} size="lg">
                Kirim Feedback
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
