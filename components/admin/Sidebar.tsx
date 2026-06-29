'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Users, MapPin, FileText, BookOpen,
  Briefcase, MessageSquare, Calendar, Bell, CalendarOff,
  Mail, Settings, LogOut, Shield, Handshake, CalendarCheck, Tag, Wallet,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/users', label: 'Users', icon: Users },
  { href: '/dashboard/harga', label: 'Persetujuan Harga', icon: Tag },
  { href: '/dashboard/komisi', label: 'Laporan Komisi', icon: Wallet },
  { href: '/dashboard/lokasi', label: 'Lokasi Terapi', icon: MapPin },
  { href: '/dashboard/artikel', label: 'Artikel', icon: FileText },
  { href: '/dashboard/pelatihan', label: 'Pelatihan', icon: BookOpen },
  { href: '/dashboard/lowongan', label: 'Lowongan', icon: Briefcase },
  { href: '/dashboard/appointments', label: 'Janji Temu', icon: CalendarCheck },
  { href: '/dashboard/komunitas', label: 'Komunitas', icon: MessageSquare },
  { href: '/dashboard/acara', label: 'Acara', icon: Calendar },
  { href: '/dashboard/kemitraan', label: 'Kemitraan', icon: Handshake },
  { href: '/dashboard/notifikasi', label: 'Notifikasi', icon: Bell },
  { href: '/dashboard/libur', label: 'Hari Libur', icon: CalendarOff },
  { href: '/dashboard/kontak', label: 'Kontak', icon: Mail },
  { href: '/dashboard/pengaturan', label: 'Pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push('/auth');
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-slate-900 border-r border-slate-800 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Admin Panel</p>
          <p className="text-slate-500 text-xs">DisabilitasKu.id</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        {user && (
          <div className="px-3 py-2">
            <p className="text-white text-xs font-medium truncate">{user.email}</p>
            <p className="text-slate-500 text-xs">Admin</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
