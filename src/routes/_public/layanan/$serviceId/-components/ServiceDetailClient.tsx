
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accessibility,
  Heart,
  Users,
  BookOpen,
  Briefcase,
  GraduationCap,
  ArrowLeft,
  Bell,
  Mail,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const serviceData: Record<string, {
  icon: any;
  title: string;
  description: string;
  lightColor: string;
  textColor: string;
}> = {
  'konsultasi-aksesibilitas': {
    icon: Accessibility,
    title: 'Konsultasi Aksesibilitas',
    description: 'Layanan konsultasi gratis tentang aksesibilitas dan dukungan yang Anda butuhkan. Kami akan membantu mengevaluasi kebutuhan, memberikan rekomendasi alat bantu, dan panduan implementasi.',
    lightColor: 'bg-purple-100',
    textColor: 'text-purple-600',
  },
  'layanan-kesehatan': {
    icon: Heart,
    title: 'Layanan Kesehatan',
    description: 'Akses mudah ke layanan kesehatan yang ramah disabilitas termasuk terapi fisik, terapi okupasi, dan konseling psikologi.',
    lightColor: 'bg-pink-100',
    textColor: 'text-pink-600',
  },
  'komunitas-support': {
    icon: Users,
    title: 'Komunitas Support',
    description: 'Bergabung dengan komunitas yang saling mendukung melalui forum diskusi, grup support, dan program mentoring.',
    lightColor: 'bg-blue-100',
    textColor: 'text-blue-600',
  },
  'sumber-belajar': {
    icon: BookOpen,
    title: 'Sumber Belajar',
    description: 'Kumpulan materi belajar dan informasi untuk pengembangan diri termasuk video edukasi, artikel, dan e-book gratis.',
    lightColor: 'bg-green-100',
    textColor: 'text-green-600',
  },
  'peluang-kerja': {
    icon: Briefcase,
    title: 'Peluang Kerja',
    description: 'Platform pencarian kerja inklusif yang ramah disabilitas dengan lowongan kerja, pelatihan skill, dan career coaching.',
    lightColor: 'bg-orange-100',
    textColor: 'text-orange-600',
  },
  'program-pelatihan': {
    icon: GraduationCap,
    title: 'Program Pelatihan',
    description: 'Berbagai program pelatihan untuk pengembangan skill termasuk soft skill, hard skill, dan program sertifikasi.',
    lightColor: 'bg-teal-100',
    textColor: 'text-teal-600',
  },
};

export default function ServiceDetailClient() {
  const params = useParams({ strict: false });
  const serviceId = params.serviceId as string;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const service = serviceId ? serviceData[serviceId] : null;

  if (!service) {
    return (
      <div className="min-h-screen bg-white">
        <main className="py-20 px-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Layanan Tidak Ditemukan</h1>
          <Button onClick={() => navigate({ to: '/layanan' })}>Kembali ke Daftar Layanan</Button>
        </main>
      </div>
    );
  }

  const IconComponent = service.icon;

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: 'Berhasil!',
      description: 'Kami akan menghubungi Anda saat layanan ini tersedia.',
    });

    setEmail('');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/layanan' })}
            className="mb-6 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Layanan
          </Button>

          <Card className="overflow-hidden">
            <div className={`${service.lightColor} p-8 text-center`}>
              <div className={`w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center mx-auto mb-6`}>
                <IconComponent className={`w-10 h-10 ${service.textColor}`} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                {service.title}
              </h1>
              <div className="inline-flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-700">Segera Hadir</span>
              </div>
            </div>

            <CardContent className="p-8">
              <p className="text-gray-600 text-center mb-8 leading-relaxed">
                {service.description}
              </p>

              <div className="border-t border-gray-200 my-8" />

              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Tertarik dengan layanan ini?
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Daftarkan email Anda dan kami akan memberitahu saat layanan ini tersedia.
                </p>

                <form onSubmit={handleNotifyMe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <Input
                      type="email"
                      aria-label="Alamat email untuk pemberitahuan"
                      placeholder="Masukkan email Anda"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {loading ? 'Mengirim...' : 'Beritahu Saya'}
                  </Button>
                </form>
              </div>

              <div className="mt-10 p-6 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">Sementara itu...</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Anda bisa mengeksplorasi layanan lain yang sudah tersedia:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: '/', hash: 'layanan' })}
                    className="text-sm"
                  >
                    Cari Lokasi Terapi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: '/forum' })}
                    className="text-sm"
                  >
                    Forum Komunitas
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate({ to: '/', hash: 'kontak' })}
                    className="text-sm"
                  >
                    Hubungi Kami
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
