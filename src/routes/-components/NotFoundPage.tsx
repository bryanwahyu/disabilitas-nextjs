import { Link } from '@tanstack/react-router';

/** Halaman 404 — dari `app/not-found.tsx`. */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Halaman tidak ditemukan</p>
        <Link to="/" className="text-primary hover:text-primary/80 underline">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
