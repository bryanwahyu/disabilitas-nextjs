
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Shield, Sparkles, Users } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { qk } from '@/lib/query/keys';
import { env } from '@/lib/env';

// Animated counter hook
function useAnimatedCount(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (target <= 0 || animated.current) return;
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

interface HeroStats {
  users: number;
  therapy: number;
  articles: number;
  forum: number;
  communities: number;
}

interface HeroSectionProps {
  initialStats?: HeroStats;
}

const EMPTY_STATS: HeroStats = { users: 0, therapy: 0, articles: 0, forum: 0, communities: 0 };

// Endpoint agregat publik ini tidak ada di apiClient (tanpa auth, bentuk respons
// berbeda), jadi fetch-nya tetap manual — hanya dipindah ke dalam queryFn.
async function fetchHeroStats(): Promise<HeroStats> {
  const res = await fetch(`${env.apiBaseUrl}/public/stats`);
  if (!res.ok) throw new Error('Gagal memuat statistik');
  const json = await res.json();
  const d = json.data ?? {};
  return {
    users: d.users ?? 0,
    therapy: d.locations ?? 0,
    articles: d.articles ?? 0,
    forum: d.threads ?? 0,
    communities: d.communities ?? 0,
  };
}

const HeroSection = ({ initialStats }: HeroSectionProps = {}) => {
  const navigate = useNavigate();

  const { data: stats = EMPTY_STATS } = useQuery({
    queryKey: qk.reports.of('public-stats'),
    queryFn: fetchHeroStats,
    // Hasil SSR dipakai apa adanya; tanpa SSR baru fetch di klien.
    initialData: initialStats,
    // Angka agregat berubah sangat lambat — jangan bikin request tiap balik ke beranda.
    staleTime: 30 * 60 * 1000,
  });

  const usersCounter = useAnimatedCount(stats.users);
  const therapyCounter = useAnimatedCount(stats.therapy);
  const articlesCounter = useAnimatedCount(stats.articles);
  const forumCounter = useAnimatedCount(stats.forum);

  return (
    <section id="beranda" className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-amber-50/40" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/8 via-pink-200/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-200/15 via-secondary/8 to-transparent rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
        {/* Main content */}
        <div className="text-center max-w-4xl mx-auto mb-12">
          {/* Badge kolaborasi */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-amber-500/10 border border-primary/15 mb-6">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Kerja sama dengan Kitty Center</span>
          </div>

          {/* Co-brand wordmark — ganti dengan logo Kitty Center saat aset tersedia */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mb-5 text-gray-800">
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">DisabilitasKu</span>
            <span className="text-gray-300 text-xl sm:text-2xl font-light">×</span>
            <span className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">Kitty Center</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.15] mb-5">
            Kolaborasi untuk Tumbuh Kembang
            <span className="block bg-gradient-to-r from-primary via-purple-600 to-pink-500 bg-clip-text text-transparent">
              Anak yang Lebih Mandiri
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-8">
            <strong className="text-gray-700">DisabilitasKu</strong> bersama <strong className="text-gray-700">Kitty Center</strong> menghadirkan skrining tumbuh kembang, terapis terpercaya, dan komunitas pendukung dalam satu tempat. Dibangun oleh penyandang Cerebral Palsy yang memahami langsung. Semuanya gratis.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button
              size="lg"
              onClick={() => navigate({ to: '/auth' })}
              className="bg-gradient-to-r from-primary to-purple-700 text-white px-8 h-13 text-base font-semibold rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300"
            >
              Bergabung Gratis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                document.getElementById('sumber-daya')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-2 border-gray-200 text-gray-700 hover:border-primary hover:text-primary px-8 h-13 text-base font-semibold rounded-full transition-all duration-300"
            >
              Jelajahi Layanan
            </Button>
          </div>
        </div>

        {/* Stats — animated counters */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { counter: usersCounter, label: 'Pengguna Terdaftar', icon: Users, color: 'from-blue-500 to-indigo-500', bgColor: 'bg-blue-50', iconColor: '#3b82f6' },
              { counter: therapyCounter, label: 'Lokasi Terapi', icon: Heart, color: 'from-pink-500 to-rose-500', bgColor: 'bg-pink-50', iconColor: '#ec4899' },
              { counter: articlesCounter, label: 'Artikel Edukasi', icon: Sparkles, color: 'from-amber-500 to-orange-500', bgColor: 'bg-amber-50', iconColor: '#f59e0b' },
              { counter: forumCounter, label: 'Diskusi Aktif', icon: Shield, color: 'from-primary to-purple-600', bgColor: 'bg-purple-50', iconColor: '#7c3aed' },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={item.label}
                  ref={item.counter.ref}
                  className="text-center p-5 rounded-2xl bg-white/70 backdrop-blur border border-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bgColor} flex items-center justify-center mx-auto mb-3`}>
                    <IconComponent className="w-5 h-5" style={{ color: item.iconColor }} />
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

        {/* Trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-gray-600">
          <span className="flex items-center gap-1.5 font-semibold text-primary">
            <Heart className="w-4 h-4" />
            Dibuat oleh Penyandang Disabilitas
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            Data Terverifikasi
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>WCAG 2.1 AA</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>100% Gratis</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
