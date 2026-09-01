
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Heart, Target, Users, Lightbulb } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_public/tentang/')({
  component: TentangKamiPage,
});


function TentangKamiPage() {
  const navigate = useNavigate();

  const team = [
    {
      name: 'Bryan',
      role: 'Founder',
      description: 'Penyandang disabilitas Cerebral Palsy. Backend Engineer dengan kepribadian yang menarik. Saat ini bekerja sebagai Senior Backend & Team Lead di Sonz.ai (Singapore). CTO di LeveraTechnology dan founder komunitas Backend Developer.',
      image: '/images/team/bryan.jpg',
    },
    {
      name: 'Awany',
      role: 'Co-Founder',
      description: 'Guru SLB dan ASN yang berdedikasi dalam dunia pendidikan inklusi. Penyandang disabilitas Cerebral Palsy dengan semangat membangun komunitas yang saling mendukung.',
      image: '/images/team/awany.jpg',
    },
    {
      name: 'Annisa',
      role: 'Co-Founder',
      description: 'Penyandang disabilitas Cerebral Palsy. Seorang atlet dengan semangat belajar yang tinggi. Memiliki passion di bidang Data Science dan terus mengembangkan diri untuk berkontribusi dalam komunitas.',
      image: '/images/team/annisa.jpg',
    },
  ];

  const values = [
    {
      icon: Heart,
      title: 'Inklusivitas',
      description: 'Kami percaya setiap orang berhak mendapat akses yang sama terhadap layanan dan kesempatan.',
    },
    {
      icon: Users,
      title: 'Komunitas',
      description: 'Membangun jaringan dukungan yang kuat antar penyandang disabilitas dan keluarga.',
    },
    {
      icon: Target,
      title: 'Pemberdayaan',
      description: 'Mendorong kemandirian dan pengembangan potensi setiap individu.',
    },
    {
      icon: Lightbulb,
      title: 'Inovasi',
      description: 'Terus berinovasi untuk memberikan solusi terbaik bagi komunitas disabilitas.',
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
              Tentang <span className="text-primary">Kami</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              DisabilitasKu adalah platform yang dibangun oleh penyandang disabilitas, untuk penyandang disabilitas.
            </p>
          </div>

          {/* Visi & Misi */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-8 md:p-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Visi & Misi Kami</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">Visi</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Menjadi platform terdepan di Indonesia yang memberdayakan penyandang disabilitas
                    untuk hidup mandiri, produktif, dan bermartabat melalui akses layanan kesehatan
                    dan dukungan komunitas yang inklusif.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">Misi</h3>
                  <ul className="text-gray-700 space-y-2">
                    <li>• Menghubungkan penyandang disabilitas dengan layanan terapi profesional</li>
                    <li>• Membangun komunitas yang saling mendukung dan menguatkan</li>
                    <li>• Menyediakan informasi dan edukasi tentang hak-hak disabilitas</li>
                    <li>• Mendorong inklusi sosial di semua aspek kehidupan</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Tim Kami */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tim Kami</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              {team.map((member) => (
                <Card key={member.name} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">{member.name[0]}</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Nilai-Nilai */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Nilai-Nilai Kami</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => {
                const IconComponent = value.icon;
                return (
                  <Card key={value.title} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{value.title}</h3>
                      <p className="text-gray-600 text-sm">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-gray-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Bergabung Bersama Kami</h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Mari bersama-sama membangun ekosistem yang lebih inklusif untuk penyandang disabilitas di Indonesia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate({ to: '/auth' })} size="lg">
                Daftar Sekarang
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: '/komunitas' })} size="lg">
                Jelajahi Komunitas
              </Button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
