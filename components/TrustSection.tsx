import { Link } from '@tanstack/react-router';
import { Shield, Accessibility, Users, ArrowRight } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Data Terverifikasi',
    description: 'Setiap lokasi terapi dan layanan yang terdaftar kami verifikasi untuk memastikan keakuratan informasi.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-500',
  },
  {
    icon: Accessibility,
    title: 'Aksesibilitas Prioritas Utama',
    description: 'Dirancang sesuai standar WCAG 2.1 AA agar dapat diakses oleh semua jenis disabilitas.',
    color: 'bg-violet-50',
    iconColor: 'text-violet-500',
  },
  {
    icon: Users,
    title: '100% Gratis & Terbuka',
    description: 'Tidak ada biaya tersembunyi. Semua fitur tersedia gratis untuk penyandang disabilitas dan keluarga.',
    color: 'bg-amber-50',
    iconColor: 'text-amber-500',
  },
];

const TrustSection = () => {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-50/30 via-white to-amber-50/20" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
            Mengapa DisabilitasKu
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Bukan Sekadar Platform —
            <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent"> Lahir dari Komunitas</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            DisabilitasKu berbeda karena dibangun dari dalam — oleh orang yang hidup dengan disabilitas setiap harinya
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Founder card — personal, bukan generic */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                <img
                  loading="lazy"
                  decoding="async"
                  src="/images/founder-bryan.png"
                  alt="Bryan Wahyu Kresna Putra"
                  width={48}
                  height={48}
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm leading-tight">Bryan Wahyu</p>
                <p className="text-xs text-primary font-medium">Founder & Penyandang CP</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed flex-1">
              Penyandang Cerebral Palsy, Technical Architect, dan builder. Membangun DisabilitasKu dari pengalaman nyata — bukan asumsi.
            </p>
            <Link to="/" hash="founder" className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-4 hover:gap-2 transition-all">
              Baca ceritanya <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Value cards */}
          {values.map((v) => {
            const IconComponent = v.icon;
            return (
              <div
                key={v.title}
                className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl ${v.color} flex items-center justify-center mb-4`}>
                  <IconComponent className={`w-6 h-6 ${v.iconColor}`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{v.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
