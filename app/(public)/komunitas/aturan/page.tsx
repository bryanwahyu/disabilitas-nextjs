import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Shield, MessageSquare, Flag, EyeOff, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Aturan Komunitas',
  description:
    'Aturan komunitas DisabilitasKu — ruang yang aman, saling menghargai, dan bebas stigma untuk penyandang disabilitas dan keluarganya.',
};

export default function AturanKomunitasPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-12 px-4">
        <article className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Aturan Komunitas</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Komunitas DisabilitasKu adalah ruang untuk bertanya, berbagi, dan saling
            menguatkan. Banyak dari kita datang ke sini membawa cerita yang tidak mudah —
            diagnosis yang baru diterima, lelah yang tidak sempat diceritakan, atau
            pertanyaan yang takut dianggap sepele. Aturan ini ada supaya semua orang
            merasa aman bercerita.
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-2">
                <Heart className="h-5 w-5 text-primary" />
                1. Tidak ada penghakiman
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Setiap keluarga punya perjalanan dan pilihan yang berbeda — soal terapi,
                sekolah, pengobatan, atau cara mengasuh. Boleh berbeda pendapat, tapi
                sampaikan sebagai pengalaman, bukan vonis. Kalimat seperti
                &ldquo;kok baru sekarang ditangani?&rdquo; atau &ldquo;itu sih kurang usaha
                orang tuanya&rdquo; tidak punya tempat di sini.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                2. Tidak ada nada kasihan atau stigma
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Penyandang disabilitas bukan objek belas kasihan, bukan &ldquo;ujian&rdquo;
                bagi keluarganya, dan bukan kisah inspiratif untuk membuat orang lain
                bersyukur. Hindari mengaitkan disabilitas dengan kutukan, dosa, karma,
                atau hal mistis. Di komunitas ini, semua orang adalah manusia seutuhnya.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                3. Bukan tempat jualan dan janji kesembuhan
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Dilarang mempromosikan obat, suplemen, atau pengobatan alternatif yang
                menjanjikan &ldquo;kesembuhan&rdquo; — terlalu banyak keluarga yang
                kehilangan waktu emas intervensi (dan uang) karena janji semacam itu.
                Berbagi pengalaman terapi boleh; berjualan dan mengiklankan tidak.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-2">
                <EyeOff className="h-5 w-5 text-primary" />
                4. Boleh anonim, dan itu tidak apa-apa
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Tidak semua hal mudah diceritakan dengan nama terbuka. Gunakan opsi
                &ldquo;kirim sebagai anonim&rdquo; kapan pun Anda membutuhkannya —
                pertanyaan Anda tetap berharga. Catatan: identitas tetap tercatat di
                sistem dan hanya bisa diakses moderator jika ada penyalahgunaan.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-2">
                <Users className="h-5 w-5 text-primary" />
                5. Jaga privasi — milik Anda dan orang lain
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Jangan membagikan data pribadi orang lain (nama lengkap anak orang lain,
                alamat, diagnosis) tanpa izin. Cerita yang dibagikan di komunitas ini
                bukan untuk disebarluaskan keluar tanpa persetujuan penulisnya.
              </p>
            </section>

            <section>
              <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 mb-2">
                <Flag className="h-5 w-5 text-primary" />
                6. Lihat sesuatu yang tidak pada tempatnya? Laporkan
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Gunakan tombol <strong>Laporkan</strong> di setiap diskusi dan komentar.
                Laporan Anda anonim bagi penulis konten dan ditinjau moderator dalam
                waktu 1×24 jam. Konten yang melanggar akan ditindak; pelanggaran berulang
                bisa berujung penguncian akses.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-8 border-t">
            <p className="text-gray-600 leading-relaxed mb-6">
              Aturan ini bukan untuk membatasi — justru sebaliknya. Ruang yang aman
              adalah ruang di mana orang berani bertanya hal yang selama ini dipendam.
              Terima kasih sudah ikut menjaganya.
            </p>
            <Link
              href="/komunitas"
              className="inline-flex items-center text-primary font-medium hover:underline"
            >
              ← Kembali ke Komunitas
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
