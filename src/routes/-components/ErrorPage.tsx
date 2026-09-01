import { useEffect } from 'react';
import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * Layar error global — dari `app/error.tsx`.
 *
 * Dua perbedaan dari versi Next:
 * - `reset()` diganti `router.invalidate()`; itulah cara TanStack memuat ulang
 *   route yang gagal tanpa reload halaman penuh.
 * - `error.digest` tidak ada padanannya (itu milik Next), jadi yang ditampilkan
 *   di mode dev cukup pesan errornya.
 */
export default function ErrorPage({ error }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Terjadi Kesalahan</h1>

        <p className="text-gray-600 mb-6">
          Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu dan sedang menangani masalah ini.
        </p>

        {import.meta.env.DEV && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-red-800 mb-1">Detail Error (Development):</p>
            <p className="text-sm text-red-700 font-mono break-all">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.invalidate()}
            className="flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Coba Lagi
          </Button>

          <Link to="/">
            <Button variant="outline" className="flex items-center justify-center gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" aria-hidden="true" />
              Kembali ke Beranda
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
