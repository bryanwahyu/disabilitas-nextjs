import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-primary rounded-3xl px-8 py-14 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 mb-6">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              Anak Anda butuh<br />terapis yang tepat?
            </h2>
            <p className="text-white/75 text-lg mb-8 max-w-xl mx-auto">
              Tidak perlu tahu harus mulai dari mana.
              Kami bantu Anda menemukan terapis sesuai kebutuhan anak Anda — gratis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/terapis"
                className="inline-flex items-center gap-2 bg-white text-primary font-bold px-7 py-3.5 rounded-xl hover:bg-gray-50 transition-colors text-sm shadow-lg"
              >
                Cari Terapis Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/cara-kerja"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium text-sm transition-colors"
              >
                Pelajari cara kerjanya →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
