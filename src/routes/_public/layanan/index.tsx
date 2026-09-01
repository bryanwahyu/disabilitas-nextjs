
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accessibility,
  Heart,
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { jsonLdScript } from '@/lib/seo/head';
import { env } from '@/lib/env';

export const Route = createFileRoute('/_public/layanan/')({
  // Canonical halaman daftar; dipindah dari layout supaya tidak ikut
  // menempel di halaman detail (lihat catatan di route.tsx).
  /*
   * Breadcrumb JSON-LD ada di halaman daftar, bukan di layout induknya:
   * di layout, halaman detail layanan menerima dua BreadcrumbList sekaligus.
   */
  head: () => ({
    links: [{ rel: 'canonical', href: 'https://disabilitasku.id/layanan' }],
    scripts: [
      jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: env.siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Layanan', item: `${env.siteUrl}/layanan` },
        ],
      }),
    ],
  }),
  component: ServicesPage,
});


function ServicesPage() {
  const navigate = useNavigate();

  const services = [
    {
      id: 'konsultasi-aksesibilitas',
      icon: Accessibility,
      title: 'Konsultasi Aksesibilitas',
      description: 'Dapatkan konsultasi gratis tentang aksesibilitas dan dukungan yang Anda butuhkan.',
      features: ['Evaluasi kebutuhan', 'Rekomendasi alat bantu', 'Panduan implementasi'],
      lightColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      available: false,
    },
    {
      id: 'layanan-kesehatan',
      icon: Heart,
      title: 'Layanan Kesehatan',
      description: 'Akses mudah ke layanan kesehatan yang ramah disabilitas.',
      features: ['Terapi fisik', 'Terapi okupasi', 'Konseling psikologi'],
      lightColor: 'bg-pink-100',
      textColor: 'text-pink-600',
      available: true,
    },
    {
      id: 'komunitas-support',
      icon: Users,
      title: 'Komunitas Support',
      description: 'Bergabung dengan komunitas yang saling mendukung.',
      features: ['Forum diskusi', 'Grup support', 'Mentoring'],
      lightColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      available: true,
    },
    {
      id: 'sumber-belajar',
      icon: BookOpen,
      title: 'Sumber Belajar',
      description: 'Kumpulan materi belajar dan informasi untuk pengembangan diri.',
      features: ['Video edukasi', 'Artikel', 'E-book gratis'],
      lightColor: 'bg-green-100',
      textColor: 'text-green-600',
      available: false,
    },
    {
      id: 'program-pelatihan',
      icon: GraduationCap,
      title: 'Program Pelatihan',
      description: 'Berbagai program pelatihan untuk pengembangan skill.',
      features: ['Soft skill', 'Hard skill', 'Sertifikasi'],
      lightColor: 'bg-teal-100',
      textColor: 'text-teal-600',
      available: true,
    },
  ];

  const handleServiceClick = (service: typeof services[0]) => {
    if (service.id === 'layanan-kesehatan') {
      navigate({ to: '/', hash: 'layanan' });
    } else if (service.id === 'komunitas-support') {
      navigate({ to: '/forum' });
    } else if (service.id === 'program-pelatihan') {
      navigate({ to: '/pelatihan' });
    } else {
      navigate({ to: `/layanan/${service.id}` });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/' })}
            className="mb-6 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Layanan <span className="text-primary">Kami</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Berbagai layanan yang dirancang khusus untuk mendukung kebutuhan penyandang disabilitas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <Card
                  key={service.id}
                  className="group hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-primary/20 cursor-pointer"
                  onClick={() => handleServiceClick(service)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-lg ${service.lightColor} flex items-center justify-center mb-3`}>
                        <IconComponent className={`w-6 h-6 ${service.textColor}`} />
                      </div>
                      {!service.available && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          Segera Hadir
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-sm">
                      {service.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-4">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 group-hover:border-primary group-hover:text-primary"
                    >
                      {service.available ? 'Lihat Layanan' : 'Segera Hadir'}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
