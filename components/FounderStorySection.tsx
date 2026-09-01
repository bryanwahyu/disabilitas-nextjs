import { ExternalLink, ArrowRight, TrendingUp, Building2, Users } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const FounderStorySection = () => {
  return (
    <section id="founder" className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(236,72,153,0.1),transparent_60%)]" />

      <div className="relative max-w-5xl mx-auto">

        {/* Badge */}
        <div className="flex justify-center mb-12">
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium backdrop-blur-sm">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Untuk Investor & Mitra CSR
          </span>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">

          {/* Photo + quote */}
          <div className="lg:col-span-2 flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl">
                <img
                  loading="lazy"
                  decoding="async"
                  src="/images/founder-bryan.png"
                  alt="Bryan Wahyu Kresna Putra - Founder DisabilitasKu.id, penyandang Cerebral Palsy dan Technical Architect"
                  width={256}
                  height={256}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 opacity-30 blur-md" />
            </div>

            {/* Identity pills */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-medium">Penyandang Cerebral Palsy</span>
              <span className="px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium">Technical Architect</span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-medium">Founder, DisabilitasKu.id</span>
            </div>

            {/* Pull quote */}
            <blockquote className="text-center max-w-xs">
              <p className="text-white/90 text-sm leading-relaxed italic">
                &ldquo;Saya membangun ini bukan karena kasihan. Tapi karena saya tahu persis apa yang
                jutaan keluarga Indonesia butuhkan — dan tidak ada yang membangunnya.&rdquo;
              </p>
              <footer className="mt-3">
                <span className="text-white font-semibold text-sm">Bryan Wahyu Kresna Putra</span>
                <br />
                <span className="text-white/40 text-xs">Founder, DisabilitasKu.id</span>
              </footer>
            </blockquote>

            {/* Media coverage */}
            <div className="w-full">
              <p className="text-white/30 text-xs text-center mb-2 uppercase tracking-wider">Diliput oleh</p>
              <div className="flex flex-wrap justify-center gap-2">
                <a
                  href="https://www.youtube.com/watch?v=q71hobuw5ks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-xs text-red-300 hover:text-white hover:bg-red-500/30 transition-colors font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  NET TV · IMS
                </a>
                <a
                  href="https://kumparan.com/kumparannews/bryan-penderita-cerebral-palsy-yang-jadi-programer-android-1540460799816759589"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/80 hover:text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Kumparan
                </a>
                <a
                  href="https://news.linuxsec.org/kisah-inspiratif-bryan-android-developer-yang-tetap-semangat-meski-memiliki-penyakit-cerebral-palsy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/80 hover:text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinuxSec
                </a>
                <a
                  href="https://www.linkedin.com/in/bryan-wahyu-2b0360377/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/80 hover:text-white hover:bg-white/20 transition-colors font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Story side */}
          <div className="lg:col-span-3 space-y-8">

            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-5">
                Penyandang Disabilitas.{' '}
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Bekerja di Teknologi.
                </span>{' '}
                Membangun untuk Komunitasnya.
              </h2>

              <div className="space-y-4 text-white/70 text-sm leading-relaxed">
                <p>
                  Saya <strong className="text-white">Bryan Wahyu Kresna Putra</strong> — penyandang{' '}
                  <strong className="text-white">Cerebral Palsy</strong> sejak lahir, dan seorang programmer.
                  Saya tahu rasanya keluarga harus mencari informasi terapi dari mulut ke mulut,
                  tidak tahu harus ke mana, tidak tahu terapis mana yang bisa dipercaya.
                  Saya hidup dengan pengalaman itu.
                </p>
                <p>
                  Dan saya membuktikan bahwa disabilitas bukan penghalang untuk berkarya.
                  Diterima sebagai <strong className="text-white">Android Developer dari 100+ pelamar</strong>.
                  Diundang <strong className="text-white">NET TV</strong> di Hari Sumpah Pemuda untuk berbagi cerita.
                  Kini bekerja sebagai <strong className="text-white">Technical Architect di Sonzai</strong> —
                  merancang arsitektur REST API, SDK, dan infrastruktur platform teknologi.
                </p>
                <p>
                  Pengalaman teknis itu saya bawa sepenuhnya untuk membangun{' '}
                  <strong className="text-white">DisabilitasKu.id</strong> — platform discovery
                  pertama di Indonesia yang serius menghubungkan penyandang disabilitas dengan
                  layanan terapi, komunitas, pelatihan, dan peluang kerja inklusif.
                </p>
              </div>
            </div>

            {/* Market stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: '22,5 Juta', label: 'Penyandang disabilitas di Indonesia', source: 'BPS 2020' },
                { value: '1%', label: 'Kuota wajib pekerja disabilitas', source: 'UU No. 8/2016' },
                { value: '0', label: 'Platform discovery disabilitas yang serius', source: 'Gap nyata' },
              ].map((stat) => (
                <div key={stat.value} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-white/50 text-xs leading-snug mb-2">{stat.label}</div>
                  <div className="text-white/30 text-[10px]">{stat.source}</div>
                </div>
              ))}
            </div>

            {/* CSR + Investasi cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Program CSR</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Penuhi kewajiban CSR disabilitas perusahaan Anda dengan dampak nyata dan laporan terukur —
                  bukan sekadar kegiatan seremonial.
                </p>
                <Link
                  to="/kemitraan"
                  className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-semibold hover:gap-2.5 transition-all"
                >
                  Diskusi Program CSR <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/25 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-white font-semibold text-sm">Investasi</span>
                </div>
                <p className="text-white/60 text-xs leading-relaxed mb-4">
                  Pasar yang besar, underserved, dan didukung regulasi. Dibangun oleh
                  founder dengan lived experience dan track record teknis yang terbukti.
                </p>
                <a
                  href="mailto:bryanwahyukp95@gmail.com?subject=Peluang%20Investasi%20Disabilitasku"
                  className="inline-flex items-center gap-1.5 text-violet-400 text-xs font-semibold hover:gap-2.5 transition-all"
                >
                  Diskusikan Peluang Investasi <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default FounderStorySection;
