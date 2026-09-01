
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  FileQuestion,
  Users,
  Shield,
  Search,
  ExternalLink,
} from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

export const Route = createFileRoute('/_public/bantuan/')({
  component: PusatBantuanPage,
});


function PusatBantuanPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const helpCategories = [
    {
      icon: FileQuestion,
      title: 'Pertanyaan Umum',
      description: 'Jawaban untuk pertanyaan yang sering diajukan',
      link: '/faq',
    },
    {
      icon: Users,
      title: 'Akun & Profil',
      description: 'Bantuan terkait akun, pendaftaran, dan profil',
      link: '/faq#akun',
    },
    {
      icon: HelpCircle,
      title: 'Layanan Kesehatan',
      description: 'Informasi tentang booking dan layanan terapi',
      link: '/cara-kerja',
    },
    {
      icon: Shield,
      title: 'Keamanan & Privasi',
      description: 'Kebijakan privasi dan keamanan data',
      link: '/keamanan',
    },
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'Kirim email ke tim support kami',
      action: 'bryanwahyukp95@gmail.com',
      buttonText: 'Kirim Email',
      onClick: () => window.location.href = 'mailto:bryanwahyukp95@gmail.com',
    },
    {
      icon: MessageCircle,
      title: 'Feedback',
      description: 'Kirim masukan atau saran untuk kami',
      action: 'Form feedback',
      buttonText: 'Isi Feedback',
      onClick: () => navigate({ to: '/feedback' }),
    },
    {
      icon: Phone,
      title: 'WhatsApp',
      description: 'Chat langsung dengan tim support',
      action: '+62 xxx xxxx xxxx',
      buttonText: 'Chat WhatsApp',
      onClick: () => {},
      disabled: true,
      comingSoon: true,
    },
  ];

  const quickLinks = [
    { title: 'Cara Mendaftar Akun', link: '/cara-kerja' },
    { title: 'Reset Password', link: '/reset-password' },
    { title: 'Cara Booking Terapi', link: '/cara-kerja' },
    { title: 'Panduan Aksesibilitas', link: '/aksesibilitas' },
    { title: 'Syarat & Ketentuan', link: '/syarat-ketentuan' },
    { title: 'Kebijakan Privasi', link: '/keamanan' },
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
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pusat <span className="text-primary">Bantuan</span>
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Kami siap membantu Anda. Temukan jawaban atau hubungi tim support kami.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                aria-label="Cari bantuan" placeholder="Cari bantuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    navigate({ to: `/faq?q=${encodeURIComponent(searchQuery)}` });
                  }
                }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              Tekan Enter untuk mencari di FAQ
            </p>
          </div>

          {/* Help Categories */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Kategori Bantuan
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {helpCategories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Card
                    key={category.title}
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/20"
                    onClick={() => navigate({ to: category.link })}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl mx-auto mb-4 flex items-center justify-center">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">{category.title}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Quick Links */}
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Link Cepat
            </h2>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickLinks.map((link) => (
                  <Button
                    key={link.title}
                    variant="ghost"
                    className="justify-between text-gray-700 hover:text-primary hover:bg-primary/5"
                    onClick={() => navigate({ to: link.link })}
                  >
                    {link.title}
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Methods */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Hubungi Kami
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method) => {
                const IconComponent = method.icon;
                return (
                  <Card key={method.title} className="relative overflow-hidden">
                    {method.comingSoon && (
                      <div className="absolute top-3 right-3">
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                          Segera Hadir
                        </span>
                      </div>
                    )}
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-xl mb-4 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{method.title}</CardTitle>
                      <CardDescription>{method.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{method.action}</p>
                      <Button
                        className="w-full"
                        variant={method.disabled ? 'outline' : 'default'}
                        disabled={method.disabled}
                        onClick={method.onClick}
                      >
                        {method.buttonText}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* FAQ CTA */}
          <section className="text-center bg-gradient-to-r from-primary/10 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Tidak Menemukan Jawaban?
            </h2>
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              Kunjungi halaman FAQ kami untuk daftar lengkap pertanyaan yang sering diajukan.
            </p>
            <Button onClick={() => navigate({ to: '/faq' })} size="lg">
              Lihat Semua FAQ
            </Button>
          </section>
        </div>
      </main>
    </div>
  );
}
