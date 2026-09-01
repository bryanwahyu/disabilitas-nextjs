import { Link } from '@tanstack/react-router';
import { Search, CalendarCheck, MessageCircle, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Cari Terapis',
    desc: 'Temukan terapis yang sesuai kebutuhan anak Anda — berdasarkan spesialisasi, lokasi, dan jadwal yang tersedia.',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
    numColor: 'text-blue-200',
  },
  {
    number: '02',
    icon: CalendarCheck,
    title: 'Buat Janji',
    desc: 'Pilih waktu yang cocok. Terapis akan mengkonfirmasi dan menghubungi Anda dalam 1×24 jam.',
    color: 'bg-violet-50',
    iconColor: 'text-violet-600',
    numColor: 'text-violet-200',
  },
  {
    number: '03',
    icon: MessageCircle,
    title: 'Mulai Sesi',
    desc: 'Datang ke lokasi atau sesi online. Terapis siap mendampingi anak Anda berkembang sesuai kebutuhannya.',
    color: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    numColor: 'text-emerald-200',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Cara Kerja</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Dari bingung ke yakin —{' '}
            <span className="text-primary">dalam 3 langkah</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tidak perlu tahu harus mulai dari mana. Kami bantu Anda menemukan terapis yang tepat untuk anak Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(100%-16px)] w-8 h-px border-t-2 border-dashed border-gray-200 z-10" />
                )}
                <div className={`rounded-2xl p-6 h-full ${step.color}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${step.iconColor}`} />
                    </div>
                    <span className={`text-5xl font-black ${step.numColor} leading-none select-none`}>
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <Link
            to="/terapis"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
          >
            Mulai Cari Terapis <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
