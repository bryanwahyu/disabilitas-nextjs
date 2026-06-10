'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IsyaratPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Wrench className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Isyarat AI Sedang Diperbaiki
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Fitur Kamus BISINDO & Pengenalan Bahasa Isyarat sedang dalam pemeliharaan.
          Kami akan segera menghadirkannya kembali dengan performa yang lebih baik.
        </p>
        <Button asChild>
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
