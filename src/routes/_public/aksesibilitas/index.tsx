
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Accessibility, Eye, Ear, Hand, Monitor, Keyboard, CheckCircle } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/aksesibilitas/')({
  component: AksesibilitasPage,
});


function AksesibilitasPage() {
  const navigate = useNavigate();

  const wcagFeatures = [
    {
      icon: Eye,
      title: 'Dapat Dipersepsi (Perceivable)',
      description: 'Informasi dan komponen antarmuka pengguna harus dapat dipersepsi oleh semua pengguna.',
      features: [
        'Teks alternatif untuk gambar',
        'Kontras warna yang memadai',
        'Konten dapat diperbesar hingga 200%',
        'Tidak bergantung pada warna saja',
      ],
    },
    {
      icon: Hand,
      title: 'Dapat Dioperasikan (Operable)',
      description: 'Komponen antarmuka dan navigasi harus dapat dioperasikan oleh semua pengguna.',
      features: [
        'Navigasi keyboard lengkap',
        'Tidak ada batasan waktu',
        'Konten tidak menyebabkan kejang',
        'Cara navigasi yang konsisten',
      ],
    },
    {
      icon: Monitor,
      title: 'Dapat Dipahami (Understandable)',
      description: 'Informasi dan operasi antarmuka pengguna harus dapat dipahami.',
      features: [
        'Bahasa halaman yang jelas',
        'Navigasi yang konsisten',
        'Identifikasi error yang jelas',
        'Label dan instruksi yang memadai',
      ],
    },
    {
      icon: Keyboard,
      title: 'Kokoh (Robust)',
      description: 'Konten harus cukup kokoh untuk ditafsirkan oleh berbagai teknologi bantu.',
      features: [
        'Kompatibel dengan screen reader',
        'Markup HTML yang valid',
        'Pesan status yang dapat diakses',
        'Nama dan peran yang jelas',
      ],
    },
  ];

  const accessibilityOptions = [
    {
      icon: Eye,
      title: 'Penglihatan',
      description: 'Fitur untuk pengguna dengan gangguan penglihatan',
      items: [
        'Dukungan screen reader',
        'Kontras tinggi',
        'Zoom hingga 200%',
        'Teks alt pada semua gambar',
      ],
    },
    {
      icon: Ear,
      title: 'Pendengaran',
      description: 'Fitur untuk pengguna dengan gangguan pendengaran',
      items: [
        'Tidak ada konten audio-only',
        'Indikator visual untuk notifikasi',
        'Transkrip untuk konten multimedia',
      ],
    },
    {
      icon: Hand,
      title: 'Motorik',
      description: 'Fitur untuk pengguna dengan keterbatasan motorik',
      items: [
        'Navigasi keyboard lengkap',
        'Target klik yang cukup besar',
        'Tidak ada double-click',
        'Fokus yang terlihat jelas',
      ],
    },
    {
      icon: Monitor,
      title: 'Kognitif',
      description: 'Fitur untuk pengguna dengan keterbatasan kognitif',
      items: [
        'Layout yang konsisten',
        'Bahasa yang sederhana',
        'Instruksi yang jelas',
        'Error handling yang membantu',
      ],
    },
  ];

  const keyboardShortcuts = [
    { key: 'Tab', action: 'Pindah ke elemen berikutnya' },
    { key: 'Shift + Tab', action: 'Pindah ke elemen sebelumnya' },
    { key: 'Enter / Space', action: 'Aktivasi tombol atau link' },
    { key: 'Escape', action: 'Tutup dialog atau menu' },
    { key: 'Arrow Keys', action: 'Navigasi dalam menu' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
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
              <Accessibility className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Panduan <span className="text-primary">Aksesibilitas</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              DisabilitasKu berkomitmen untuk memastikan platform kami dapat diakses oleh semua orang,
              termasuk penyandang disabilitas.
            </p>
          </div>

          {/* WCAG Compliance */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Kepatuhan WCAG 2.1
              </h2>
              <p className="text-gray-600 text-center max-w-3xl mx-auto">
                Kami mengikuti Web Content Accessibility Guidelines (WCAG) 2.1 Level AA untuk memastikan
                platform kami dapat diakses oleh sebanyak mungkin pengguna dengan berbagai kemampuan.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {wcagFeatures.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                          <p className="text-sm text-gray-600">{feature.description}</p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {feature.features.map((item) => (
                          <li key={item} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Accessibility Options by Disability */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Fitur Aksesibilitas
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {accessibilityOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <Card key={option.title} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl mb-4 flex items-center justify-center">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{option.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{option.description}</p>
                      <ul className="space-y-2">
                        {option.items.map((item) => (
                          <li key={item} className="flex items-center text-sm text-gray-500">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Pintasan Keyboard
            </h2>
            <Card>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Tombol</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keyboardShortcuts.map((shortcut) => (
                        <tr key={shortcut.key} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 px-4">
                            <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                              {shortcut.key}
                            </kbd>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{shortcut.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Feedback */}
          <section className="text-center bg-gray-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Menemukan Masalah Aksesibilitas?
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Kami selalu berusaha meningkatkan aksesibilitas platform. Jika Anda menemukan hambatan
              atau memiliki saran, mohon beritahu kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate({ to: '/feedback' })} size="lg">
                Kirim Feedback
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/bantuan' })} size="lg">
                Pusat Bantuan
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
