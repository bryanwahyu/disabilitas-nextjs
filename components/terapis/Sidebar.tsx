'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, MessageSquare, Calendar, User,
  BookOpen, Star, Users, Link2, Settings, LogOut, Stethoscope, NotebookPen,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/konsultasi', label: 'Konsultasi', icon: MessageSquare },
  { href: '/dashboard/jadwal', label: 'Jadwal', icon: Calendar },
  { href: '/dashboard/jurnal', label: 'Jurnal Sesi', icon: NotebookPen },
  { href: '/dashboard/profil', label: 'Profil Terapis', icon: User },
  { href: '/dashboard/pelatihan', label: 'Pelatihan Saya', icon: BookOpen },
  { href: '/dashboard/ulasan', label: 'Ulasan', icon: Star },
  { href: '/dashboard/komunitas', label: 'Komunitas', icon: Users },
  { href: '/dashboard/afiliasi', label: 'Afiliasi', icon: Link2 },
  { href: '/dashboard/pengaturan', label: 'Pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('terapis_token');
    router.push('/auth');
  };

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-slate-900 border-r border-slate-800 flex-shrink-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center flex-shrink-0">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Portal Terapis</p>
          <p className="text-slate-500 text-xs">DisabilitasKu.id</p>
        </div>
      </div>

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
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800">
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
