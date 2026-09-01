
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Lock, Eye, Server, FileCheck, AlertTriangle } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/keamanan/')({
  component: KeamananPrivasiPage,
});


function KeamananPrivasiPage() {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: Lock,
      title: 'Enkripsi Data',
      description: 'Semua data Anda dienkripsi menggunakan standar industri AES-256 untuk memastikan keamanan maksimal.',
    },
    {
      icon: Shield,
      title: 'Autentikasi Aman',
      description: 'Sistem autentikasi berlapis dengan token yang aman dan manajemen sesi yang ketat.',
    },
    {
      icon: Server,
      title: 'Server Terpercaya',
      description: 'Data Anda disimpan di server cloud terpercaya dengan sertifikasi keamanan internasional.',
    },
    {
      icon: Eye,
      title: 'Kontrol Privasi',
      description: 'Anda memiliki kontrol penuh atas data dan informasi yang Anda bagikan di platform.',
    },
  ];

  const privacyPolicies = [
    {
      title: 'Data yang Kami Kumpulkan',
      items: [
        'Informasi pendaftaran (nama, email, nomor telepon)',
        'Data profil yang Anda isi secara sukarela',
        'Riwayat penggunaan layanan untuk peningkatan kualitas',
        'Informasi perangkat untuk keamanan akun',
      ],
    },
    {
      title: 'Penggunaan Data',
      items: [
        'Menyediakan dan meningkatkan layanan kami',
        'Menghubungkan Anda dengan terapis yang sesuai',
        'Mengirim notifikasi penting terkait layanan',
        'Analisis untuk pengembangan fitur baru',
      ],
    },
    {
      title: 'Perlindungan Data',
      items: [
        'Data tidak pernah dijual kepada pihak ketiga',
        'Akses data dibatasi hanya untuk keperluan layanan',
        'Audit keamanan berkala oleh tim internal',
        'Kebijakan retensi data yang ketat',
      ],
    },
  ];

  const userRights = [
    {
      icon: FileCheck,
      title: 'Hak Akses',
      description: 'Anda berhak mengakses dan melihat semua data pribadi yang kami simpan.',
    },
    {
      icon: AlertTriangle,
      title: 'Hak Koreksi',
      description: 'Anda dapat meminta koreksi jika ada data yang tidak akurat.',
    },
    {
      icon: Lock,
      title: 'Hak Penghapusan',
      description: 'Anda dapat meminta penghapusan akun dan data pribadi Anda kapan saja.',
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
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Keamanan & <span className="text-primary">Privasi</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Keamanan dan privasi data Anda adalah prioritas utama kami. Pelajari bagaimana kami melindungi informasi Anda.
            </p>
          </div>

          {/* Security Features */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Fitur Keamanan</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {securityFeatures.map((feature) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Privacy Policy */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Kebijakan Privasi</h2>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="grid md:grid-cols-3 gap-8">
                {privacyPolicies.map((policy) => (
                  <div key={policy.title}>
                    <h3 className="font-semibold text-gray-900 mb-4">{policy.title}</h3>
                    <ul className="space-y-3">
                      {policy.items.map((item) => (
                        <li key={item} className="flex items-start text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full mt-2 mr-3 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* User Rights */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Hak Pengguna</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {userRights.map((right) => {
                const IconComponent = right.icon;
                return (
                  <Card key={right.title} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{right.title}</h3>
                      <p className="text-gray-600 text-sm">{right.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Contact */}
          <section className="text-center bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ada Pertanyaan?</h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Jika Anda memiliki pertanyaan tentang keamanan dan privasi data Anda, jangan ragu untuk menghubungi kami.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => window.location.href = 'mailto:bryanwahyukp95@gmail.com'} size="lg">
                Hubungi Kami
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/tentang' })} size="lg">
                Tentang Kami
              </Button>
            </div>
          </section>

          {/* Last Updated */}
          <p className="text-center text-gray-500 text-sm mt-8">
            Terakhir diperbarui: Januari 2026
          </p>
        </div>
      </main>
    </div>
  );
}
