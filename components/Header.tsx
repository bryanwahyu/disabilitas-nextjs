
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield, LogOut, User, Calendar, LayoutDashboard, ChevronDown, Target } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/NotificationBell';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTherapist, setIsTherapist] = useState(false);
  /*
   * Dropdown nav dibuka dengan TAP, bukan hover.
   *
   * Sebelumnya satu-satunya jalan membuka submenu adalah `group-hover` — di
   * layar sentuh tak ada hover, jadi "Layanan" dan "Belajar" praktis tidak bisa
   * dibuka sama sekali. Hover tetap dipertahankan untuk tetikus, tapi hanya
   * sebagai tambahan di atas state eksplisit ini.
   */
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Nav dikelompokkan agar tidak sesak: 2 dropdown (Layanan, Belajar) + link tunggal.
  type NavChild = { name: string; href: string };
  type NavItem = { name: string; href?: string; children?: NavChild[] };
  const navigation: NavItem[] = [
    { name: 'Beranda', href: '/' },
    {
      name: 'Layanan',
      children: [
        { name: 'Terapis', href: '/terapis' },
        { name: 'Tumbuh Kembang', href: '/tumbuh-kembang' },
      ],
    },
    {
      name: 'Belajar',
      children: [
        { name: 'Pelatihan', href: '/pelatihan' },
        { name: 'Artikel', href: '/artikel' },
      ],
    },
    { name: 'Komunitas', href: '/komunitas' },
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

  // Submenu yang terbuka ditutup oleh Escape dan oleh ketukan di luar nav.
  // Tanpa keduanya, submenu yang dibuka dengan tap tak punya jalan keluar
  // selain memilih salah satu isinya.
  useEffect(() => {
    if (!openDropdown) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDropdown(null);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            {/* Aset lokal, bukan gambar remote: tidak ada optimizer server
                lagi setelah lepas dari Next, jadi <img> biasa lebih jujur
                daripada komponen yang menjanjikan resize/WebP yang tak terjadi.
                `fetchPriority` menggantikan `priority` — logo ada di atas lipatan. */}
            <img
              src="/logo.svg"
              alt="DisabilitasKu - Platform Inklusif"
              width={140}
              height={36}
              fetchPriority="high"
              decoding="async"
              className="h-9 w-auto group-hover:scale-[1.02] transition-transform"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav ref={navRef} className="hidden md:flex items-center space-x-1" role="navigation" aria-label="Main navigation">
            {navigation.map((item) => (
              item.children ? (
                <div
                  key={item.name}
                  className="relative"
                  // Hover hanya untuk tetikus. Sebagian browser sentuh mengirim
                  // pointerenter palsu setelah tap, yang akan langsung membuka
                  // ulang menu yang baru saja ditutup.
                  onPointerEnter={(e) => { if (e.pointerType === 'mouse') setOpenDropdown(item.name); }}
                  onPointerLeave={(e) => { if (e.pointerType === 'mouse') setOpenDropdown(null); }}
                >
                  <button
                    type="button"
                    className="flex min-h-11 items-center gap-1 text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5 aria-expanded:text-primary aria-expanded:bg-primary/5"
                    aria-haspopup="true"
                    aria-expanded={openDropdown === item.name}
                    aria-controls={`nav-submenu-${item.name}`}
                    onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                  >
                    {item.name}
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${openDropdown === item.name ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {/* pt-1 menjaga jembatan hover antara tombol dan panel. */}
                  <div
                    id={`nav-submenu-${item.name}`}
                    className={`absolute left-0 top-full z-50 min-w-[200px] pt-1 ${
                      openDropdown === item.name ? 'block' : 'hidden'
                    }`}
                  >
                    <div className="rounded-lg border bg-white py-1.5 shadow-lg">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex min-h-11 items-center px-4 py-2 text-sm text-gray-600 hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.href!}
                  className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
                >
                  {item.name}
                </Link>
              )
            ))}
            {user && !isTherapist && (
              <Link
                to="/jadwal"
                className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
              >
                Jadwal
              </Link>
            )}
            {user && !isTherapist && (
              <Link
                to="/program"
                className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
              >
                Program
              </Link>
            )}
            {user?.role === 'orang_tua' && (
              <Link
                to="/anak-saya"
                className="text-gray-600 hover:text-primary px-4 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-primary/5"
              >
                Anak Saya
              </Link>
            )}
            {isTherapist && (
              <Link
                to="/dashboard"
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
                onClick={() => navigate({ to: '/profil' })}
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
                onClick={() => navigate({ to: '/admin' })}
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
                onClick={() => navigate({ to: '/auth' })}
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
                item.children ? (
                  <div key={item.name} className="pt-1">
                    <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {item.name}
                    </p>
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        to={child.href}
                        className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={item.name}
                    to={item.href!}
                    className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              ))}
              {user && !isTherapist && (
                <Link
                  to="/jadwal"
                  className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Calendar size={16} className="inline mr-2" />
                  Jadwal Saya
                </Link>
              )}
              {user && !isTherapist && (
                <Link
                  to="/program"
                  className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Target size={16} className="inline mr-2" />
                  Program Terapi
                </Link>
              )}
              {user?.role === 'orang_tua' && (
                <Link
                  to="/anak-saya"
                  className="text-gray-600 hover:text-primary hover:bg-primary/5 block px-4 py-3 text-base font-medium rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={16} className="inline mr-2" />
                  Anak Saya
                </Link>
              )}
              {isTherapist && (
                <Link
                  to="/dashboard"
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
                      navigate({ to: '/profil' });
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
                      navigate({ to: '/admin' });
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
                      navigate({ to: '/auth' });
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
