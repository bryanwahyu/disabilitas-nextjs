
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, UserPlus, Search, Calendar, MessageCircle, CheckCircle } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/cara-kerja/')({
  component: CaraKerjaPage,
});


function CaraKerjaPage() {
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Daftar Akun',
      description: 'Buat akun gratis dengan mengisi data diri Anda. Proses pendaftaran mudah dan cepat.',
      details: [
        'Isi formulir pendaftaran',
        'Verifikasi email',
        'Lengkapi profil Anda',
      ],
    },
    {
      number: 2,
      icon: Search,
      title: 'Temukan Layanan',
      description: 'Jelajahi berbagai layanan kesehatan dan terapis yang sesuai dengan kebutuhan Anda.',
      details: [
        'Cari berdasarkan jenis terapi',
        'Filter berdasarkan lokasi',
        'Lihat profil dan rating terapis',
      ],
    },
    {
      number: 3,
      icon: Calendar,
      title: 'Booking Jadwal',
      description: 'Pilih jadwal yang tersedia dan lakukan booking secara online dengan mudah.',
      details: [
        'Pilih tanggal dan waktu',
        'Pilih mode: online atau offline',
        'Konfirmasi booking',
      ],
    },
    {
      number: 4,
      icon: MessageCircle,
      title: 'Konsultasi',
      description: 'Lakukan sesi konsultasi atau terapi sesuai jadwal yang telah ditentukan.',
      details: [
        'Terima reminder sebelum sesi',
        'Ikuti sesi sesuai mode yang dipilih',
        'Dapatkan catatan dan rekomendasi',
      ],
    },
  ];

  const features = [
    {
      title: 'Gratis Pendaftaran',
      description: 'Tidak ada biaya untuk membuat akun dan menjelajahi layanan.',
    },
    {
      title: 'Terapis Bersertifikat',
      description: 'Semua terapis telah terverifikasi dan memiliki sertifikasi resmi.',
    },
    {
      title: 'Fleksibel',
      description: 'Pilih sesi online atau tatap muka sesuai kebutuhan Anda.',
    },
    {
      title: 'Dukungan 24/7',
      description: 'Tim support kami siap membantu kapan saja Anda membutuhkan.',
    },
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Cara <span className="text-primary">Kerja</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Ikuti langkah-langkah mudah untuk mulai menggunakan layanan DisabilitasKu
            </p>
          </div>

          {/* Steps */}
          <section className="mb-16">
            <div className="space-y-8">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const isEven = index % 2 === 1;
                return (
                  <div
                    key={step.number}
                    className={`flex flex-col md:flex-row items-center gap-8 ${
                      isEven ? 'md:flex-row-reverse' : ''
                    }`}
                  >
                    {/* Icon & Number */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <IconComponent className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute -top-3 -right-3 w-10 h-10 bg-white border-4 border-primary rounded-full flex items-center justify-center">
                          <span className="text-primary font-bold text-lg">{step.number}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <Card className={`flex-1 ${isEven ? 'md:text-right' : ''}`}>
                      <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <ul className={`space-y-2 ${isEven ? 'md:flex md:flex-col md:items-end' : ''}`}>
                          {step.details.map((detail) => (
                            <li
                              key={detail}
                              className={`flex items-center text-sm text-gray-500 ${
                                isEven ? 'md:flex-row-reverse' : ''
                              }`}
                            >
                              <CheckCircle className={`w-4 h-4 text-primary flex-shrink-0 ${
                                isEven ? 'md:ml-2' : 'mr-2'
                              }`} />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -z-10" />

          {/* Features */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Keunggulan Kami</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Siap Untuk Memulai?</h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Daftar sekarang dan temukan layanan kesehatan yang tepat untuk Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate({ to: '/auth' })} size="lg">
                Daftar Gratis
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/layanan' })} size="lg">
                Lihat Layanan
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
