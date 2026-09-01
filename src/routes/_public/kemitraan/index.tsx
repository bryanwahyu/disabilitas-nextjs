
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  ArrowRight,
  Users,
  Heart,
  BookOpen,
  MessageSquare,
  Building2,
  Handshake,
  TrendingUp,
  CheckCircle2,
  Send,
  Globe,
  Shield,
  Target,
} from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { env } from '@/lib/env';
import { metaFrom } from '@/lib/seo/head';

const metadata = {
  title: 'Kemitraan — Daftarkan Layanan Terapi Anda',
  description:
    'Bergabung sebagai mitra DisabilitasKu. Daftarkan klinik, yayasan, atau praktik terapi Anda agar ditemukan keluarga yang membutuhkan.',
  keywords: ['kemitraan disabilitas', 'daftar klinik terapi', 'mitra yayasan terapi'],
  openGraph: {
    title: 'Kemitraan | DisabilitasKu',
    description: 'Daftarkan klinik, yayasan, atau praktik terapi Anda sebagai mitra DisabilitasKu.',
    url: `${env.siteUrl}/kemitraan`,
  },
};

interface PlatformStats {
  users: number;
  locations: number;
  articles: number;
  threads: number;
  communities: number;
}

const emptyStats: PlatformStats = { users: 0, locations: 0, articles: 0, threads: 0, communities: 0 };

/*
 * Dipakai loader (SSR) dan `useQuery` komponen — kunci & `queryFn` harus sama
 * persis supaya hidrasi tidak memicu request kedua.
 */
const publicStatsQuery = {
  queryKey: qk.reports.of('public-stats'),
  // Endpoint publik ini belum ada di apiClient, jadi tetap fetch manual.
  queryFn: async (): Promise<PlatformStats> => {
    const res = await fetch(`${env.apiBaseUrl}/public/stats`);
    if (!res.ok) throw new Error('Gagal memuat statistik platform');
    const json = await res.json();
    return { ...emptyStats, ...(json.data ?? {}) };
  },
  // Angka dampak platform bergerak lambat — cukup sekali per sesi.
  staleTime: 30 * 60 * 1000,
};

export const Route = createFileRoute('/_public/kemitraan/')({
  head: () => {
    const head = metaFrom(metadata);
    return { ...head, links: [...head.links, { rel: 'canonical', href: `${env.siteUrl}/kemitraan` }] };
  },

  /*
   * Halaman jualan ke calon mitra: angka dampak platform adalah argumennya.
   * Tanpa loader, HTML awal mengirim empat angka nol — calon mitra yang membaca
   * pratinjau tautan, dan crawler, melihat platform yang tampak kosong.
   *
   * `allSettled`: statistik gagal tidak boleh menjatuhkan form pendaftaran
   * mitra, yang merupakan tujuan utama halaman ini.
   */
  loader: async ({ context }) => {
    await Promise.allSettled([context.queryClient.ensureQueryData(publicStatsQuery)]);
  },

  component: KemitraanPage,
});


/*
 * Nilai awal = angka final, bukan nol.
 *
 * Sesudah statistik diambil di loader, render server memakai hook ini; kalau
 * mulai dari nol, HTML yang dikirim tetap berisi "0" dan seluruh gunanya SSR
 * di halaman ini hilang. Animasi tetap ada, tapi murni urusan klien: efek di
 * bawah yang menurunkannya ke nol lalu menghitung naik. Render pertama di
 * klien memakai nilai awal yang sama dengan server, jadi tak ada hydration
 * mismatch.
 */
function useAnimatedCount(target: number, duration = 1500) {
  const [count, setCount] = useState(target);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (target <= 0 || animated.current) return;
    setCount(0);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

const partnershipTypes = [
  { value: 'csr', label: 'Program CSR' },
  { value: 'sponsorship', label: 'Sponsorship Acara' },
  { value: 'donasi', label: 'Donasi / Hibah' },
  { value: 'teknologi', label: 'Kemitraan Teknologi' },
  { value: 'edukasi', label: 'Program Edukasi' },
  { value: 'rekrutmen', label: 'Rekrutmen Inklusif' },
  { value: 'lainnya', label: 'Lainnya' },
];

function KemitraanPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    partnershipType: '',
    message: '',
  });

  const { data: stats = emptyStats } = useQuery(publicStatsQuery);

  const usersCounter = useAnimatedCount(stats.users);
  const locationsCounter = useAnimatedCount(stats.locations);
  const articlesCounter = useAnimatedCount(stats.articles);
  const communitiesCounter = useAnimatedCount(stats.communities);

  const submitMutation = useMutation({
    mutationFn: () => {
      const typeLabel = partnershipTypes.find(t => t.value === formData.partnershipType)?.label || 'Kemitraan';
      return unwrap(
        apiClient.public.contact.submit({
          type: 'contact' as any,
          category: 'general' as any,
          name: `${formData.contactName} (${formData.companyName})`,
          email: formData.email,
          phone: formData.phone ? `+62${formData.phone}` : '',
          subject: `[Kemitraan CSR] ${typeLabel} - ${formData.companyName}`,
          message: `Jenis Kemitraan: ${typeLabel}\nPerusahaan: ${formData.companyName}\nKontak: ${formData.contactName}\n\n${formData.message}`,
        })
      );
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Terkirim!',
        description: 'Tim kami akan menghubungi Anda dalam 1-2 hari kerja.',
      });
      setFormData({ companyName: '', contactName: '', email: '', phone: '', partnershipType: '', message: '' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal Mengirim',
        description: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    },
  });

  const loading = submitMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate();
  };

  const benefits = [
    {
      icon: Target,
      title: 'Dampak Sosial Terukur',
      description: 'Laporan dampak lengkap dengan data pengguna, jangkauan, dan engagement untuk pelaporan CSR perusahaan Anda.',
    },
    {
      icon: Globe,
      title: 'Jangkauan Nasional',
      description: 'Akses ke komunitas disabilitas di seluruh Indonesia — pengguna aktif dari berbagai kota dan provinsi.',
    },
    {
      icon: Shield,
      title: 'Kredibilitas & Kepercayaan',
      description: 'Platform yang dibangun oleh penyandang disabilitas sendiri, dengan data terverifikasi dan standar WCAG 2.1 AA.',
    },
    {
      icon: Handshake,
      title: 'Kemitraan Fleksibel',
      description: 'Berbagai model kerjasama — dari CSR, sponsorship acara, hingga program rekrutmen inklusif.',
    },
  ];

  const csrPrograms = [
    {
      title: 'Sponsorship Lokasi Terapi',
      description: 'Bantu verifikasi dan subsidi layanan terapi untuk keluarga yang membutuhkan.',
      icon: Heart,
    },
    {
      title: 'Program Edukasi Digital',
      description: 'Dukung pembuatan konten edukasi berkualitas tentang disabilitas dan inklusi.',
      icon: BookOpen,
    },
    {
      title: 'Rekrutmen Inklusif',
      description: 'Hubungkan perusahaan Anda dengan talenta penyandang disabilitas yang terampil.',
      icon: Users,
    },
    {
      title: 'Acara & Workshop',
      description: 'Selenggarakan atau sponsori acara komunitas untuk meningkatkan awareness disabilitas.',
      icon: MessageSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50/40" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-200/15 via-primary/8 to-transparent rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/' })}
              className="mb-6 text-gray-600 hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Button>

            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 border border-blue-200/50 mb-6">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Kemitraan & CSR</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-5">
                Bersama Membangun
                <span className="block bg-gradient-to-r from-blue-600 via-primary to-purple-600 bg-clip-text text-transparent">
                  Indonesia Inklusif
                </span>
              </h1>

              <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
                Jadikan program CSR perusahaan Anda berdampak nyata. Bermitra dengan DisabilitasKu untuk menjangkau dan memberdayakan komunitas disabilitas di seluruh Indonesia.
              </p>

              <Button
                size="lg"
                onClick={() => document.getElementById('form-kemitraan')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white px-8 h-13 text-base font-semibold rounded-full shadow-lg shadow-blue-500/25"
              >
                Ajukan Kemitraan
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Impact Metrics */}
        <section className="py-16 px-4 bg-gray-50/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Dampak Platform <span className="text-primary">Saat Ini</span>
              </h2>
              <p className="text-gray-500">Data real-time dari platform DisabilitasKu</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { counter: usersCounter, label: 'Pengguna Terdaftar', icon: Users, color: '#3b82f6', bgColor: 'bg-blue-50' },
                { counter: locationsCounter, label: 'Lokasi Terapi', icon: Heart, color: '#ec4899', bgColor: 'bg-pink-50' },
                { counter: articlesCounter, label: 'Artikel Edukasi', icon: BookOpen, color: '#f59e0b', bgColor: 'bg-amber-50' },
                { counter: communitiesCounter, label: 'Komunitas Aktif', icon: MessageSquare, color: '#7c3aed', bgColor: 'bg-purple-50' },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.label}
                    ref={item.counter.ref}
                    className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm"
                  >
                    <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center mx-auto mb-3`}>
                      <IconComponent className="w-6 h-6" style={{ color: item.color }} />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                      {item.counter.count > 0 ? `${item.counter.count}+` : '-'}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">{item.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Kenapa Bermitra */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Kenapa Bermitra dengan <span className="text-primary">DisabilitasKu</span>?
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Lebih dari sekadar donasi — kemitraan yang membawa dampak nyata dan terukur
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={benefit.title} className="hover:shadow-lg transition-shadow border-gray-100">
                    <CardContent className="p-6 flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Program CSR */}
        <section className="py-16 px-4 bg-gradient-to-br from-primary/5 to-blue-50/50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Program Kemitraan
              </h2>
              <p className="text-gray-500 max-w-xl mx-auto">
                Pilih bentuk kontribusi yang sesuai dengan visi CSR perusahaan Anda
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {csrPrograms.map((program) => {
                const IconComponent = program.icon;
                return (
                  <div
                    key={program.title}
                    className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mb-4">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{program.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{program.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Yang Mitra Dapatkan */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Yang Mitra Dapatkan
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Logo perusahaan di halaman mitra DisabilitasKu',
                'Laporan dampak berkala dengan data terukur',
                'Eksposur di konten dan acara platform',
                'Akses ke komunitas disabilitas nasional',
                'Konsultasi program inklusi di perusahaan',
                'Sertifikat kemitraan sosial resmi',
                'Dukungan media sosial dan publikasi',
                'Prioritas dalam program kolaborasi baru',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 p-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Kemitraan */}
        <section id="form-kemitraan" className="py-16 px-4 bg-gray-50/50">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                Ajukan <span className="text-primary">Kemitraan</span>
              </h2>
              <p className="text-gray-500">
                Isi formulir di bawah dan tim kami akan menghubungi Anda dalam 1-2 hari kerja
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-7 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className="text-gray-600 text-sm">Nama Perusahaan / Organisasi</Label>
                    <Input
                      id="companyName"
                      placeholder="PT Contoh Indonesia"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactName" className="text-gray-600 text-sm">Nama Kontak</Label>
                    <Input
                      id="contactName"
                      placeholder="Nama Anda"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      required
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="partnerEmail" className="text-gray-600 text-sm">Email Bisnis</Label>
                    <Input
                      id="partnerEmail"
                      type="email"
                      placeholder="csr@perusahaan.co.id"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="partnerPhone" className="text-gray-600 text-sm">Telepon</Label>
                    <div className="flex mt-1.5">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-600 text-sm">
                        +62
                      </span>
                      <Input
                        id="partnerPhone"
                        type="tel"
                        placeholder="812 3456 7890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="rounded-l-none rounded-r-xl border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="partnershipType" className="text-gray-600 text-sm">Jenis Kemitraan</Label>
                  <Select
                    value={formData.partnershipType}
                    onValueChange={(value) => setFormData({ ...formData, partnershipType: value })}
                  >
                    <SelectTrigger aria-label="Pilih jenis kemitraan" className="mt-1.5 rounded-xl border-gray-200">
                      <SelectValue placeholder="Pilih jenis kemitraan" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnershipTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="partnerMessage" className="text-gray-600 text-sm">Pesan / Proposal Singkat</Label>
                  <Textarea
                    id="partnerMessage"
                    placeholder="Ceritakan tentang program CSR perusahaan Anda dan bagaimana Anda ingin bermitra dengan DisabilitasKu..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={5}
                    className="mt-1.5 rounded-xl border-gray-200 focus:border-primary/50"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white py-6 text-base font-semibold rounded-xl shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Proposal Kemitraan
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* CTA Bottom */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-gradient-to-br from-primary/10 to-blue-50 rounded-2xl p-8 md:p-12">
              <TrendingUp className="w-10 h-10 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Siap Membuat Dampak Nyata?
              </h2>
              <p className="text-gray-600 mb-6 max-w-xl mx-auto">
                Hubungi kami langsung untuk diskusi lebih lanjut tentang peluang kemitraan yang sesuai dengan kebutuhan perusahaan Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  onClick={() => window.open('https://wa.me/628990076060?text=Halo, saya tertarik bermitra dengan DisabilitasKu untuk program CSR.', '_blank')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                >
                  WhatsApp Kami
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.open('mailto:bryanwahyukp95@gmail.com?subject=Kemitraan CSR DisabilitasKu', '_blank')}
                  className="rounded-full"
                >
                  Kirim Email
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
