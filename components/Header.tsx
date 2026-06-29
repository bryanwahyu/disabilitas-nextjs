'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, LogOut, User, Calendar, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/NotificationBell';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTherapist, setIsTherapist] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();

  const navigation = [
    { name: 'Beranda', href: '/', isRoute: true },
    { name: 'Terapis', href: '/terapis', isRoute: true },
    { name: 'Lokasi Terapi', href: '/lokasi-terapi', isRoute: true },
    { name: 'Rekomendasi', href: '/rekomendasi', isRoute: true },
    { name: 'Pelatihan', href: '/pelatihan', isRoute: true },
    { name: 'Cari Kerja', href: '/cari-kerja', isRoute: true },
    { name: 'Komunitas', href: '/komunitas', isRoute: true },
    { name: 'Artikel', href: '/artikel', isRoute: true },
  ];

  useEffect(() => {
    if (user?.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    if (user?.role === 'therapy' || user?.role === 'therapist_independent') {
      setIsTherapist(true);
    } else {
      setIsTherapist(false);
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/logo.svg"
              alt="DisabilitasKu - Platform Inklusif"
              width={140}
              height={36}
              priority
              className="h-9 w-auto group-hover:scale-[1.02] transition-transform"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => (
              item.isRoute ? (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
                >
                  {item.name}
                </Link>
              ) : (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
                >
                  {item.name}
                </a>
              )
            ))}
            {user && !isTherapist && (
              <Link
                href="/jadwal"
                className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
              >
                Jadwal
              </Link>
            )}
            {user?.role === 'orang_tua' && (
              <Link
                href="/anak-saya"
                className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
              >
                Anak Saya
              </Link>
            )}
            {isTherapist && (
              <Link
                href="/dashboard"
                className="text-primary font-semibold px-4 py-2 text-sm transition-colors duration-200 rounded-md hover:bg-primary/5"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Auth Button & Admin Button */}
          <div className="hidden md:flex items-center space-x-3">
            {user && <NotificationBell />}
            {user && (
              <Button
                onClick={() => router.push('/profil')}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-primary"
              >
                <User size={16} className="mr-1" />
                Profil
              </Button>
            )}
            {isAdmin && (
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-white"
              >
                <Shield size={16} className="mr-1" />
                Admin
              </Button>
            )}
            {user ? (
              <Button
                onClick={signOut}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500"
              >
                <LogOut size={16} className="mr-1" />
                Keluar
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/auth')}
                className="bg-primary hover:bg-primary/90 text-white px-6"
              >
                Bergabung Sekarang
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle navigation menu"
              className="p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t" id="mobile-menu">
            <div className="px-2 pt-2 pb-4 space-y-1 bg-white">
              {navigation.map((item) => (
                item.isRoute ? (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ) : (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                )
              ))}
              {user && !isTherapist && (
                <Link
                  href="/jadwal"
                  className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar size={16} className="inline mr-2" />
                  Jadwal Saya
                </Link>
              )}
              {user?.role === 'orang_tua' && (
                <Link
                  href="/anak-saya"
                  className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={16} className="inline mr-2" />
                  Anak Saya
                </Link>
              )}
              {isTherapist && (
                <Link
                  href="/dashboard"
                  className="text-primary hover:bg-primary/5 block px-4 py-3 text-base font-semibold rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LayoutDashboard size={16} className="inline mr-2" />
                  Dashboard Terapis
                </Link>
              )}

              <div className="pt-4 border-t mt-4 space-y-2">
                {user && (
                  <Button
                    onClick={() => {
                      router.push('/profil');
                      setIsMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start text-gray-600 hover:text-primary"
                  >
                    <User size={16} className="mr-2" />
                    Profil Saya
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    onClick={() => {
                      router.push('/admin');
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary hover:text-white"
                  >
                    <Shield size={16} className="mr-2" />
                    Admin Dashboard
                  </Button>
                )}
                {user ? (
                  <Button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    variant="outline"
                    className="w-full border-gray-300 text-gray-600 hover:border-red-500 hover:text-red-500"
                  >
                    <LogOut size={16} className="mr-2" />
                    Keluar
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      router.push('/auth');
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Bergabung Sekarang
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
