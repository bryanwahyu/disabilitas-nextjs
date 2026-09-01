
import { Link } from '@tanstack/react-router';
import { useLocation, useNavigate } from '@tanstack/react-router';
import {
  LayoutDashboard, MessageSquare, Calendar, CalendarCheck, User,
  BookOpen, Star, Users, Link2, Settings, LogOut, Stethoscope, NotebookPen, Target,
} from 'lucide-react';

const navItems = [
  { href: '/portal-terapis/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal-terapis/dashboard/konsultasi', label: 'Konsultasi', icon: MessageSquare },
  { href: '/portal-terapis/dashboard/appointments', label: 'Janji Temu', icon: CalendarCheck },
  { href: '/portal-terapis/dashboard/jadwal', label: 'Jadwal', icon: Calendar },
  { href: '/portal-terapis/dashboard/program', label: 'Program Terapi', icon: Target },
  { href: '/portal-terapis/dashboard/jurnal', label: 'Jurnal Sesi', icon: NotebookPen },
  { href: '/portal-terapis/dashboard/profil', label: 'Profil Terapis', icon: User },
  { href: '/portal-terapis/dashboard/pelatihan', label: 'Pelatihan Saya', icon: BookOpen },
  { href: '/portal-terapis/dashboard/ulasan', label: 'Ulasan', icon: Star },
  { href: '/portal-terapis/dashboard/komunitas', label: 'Komunitas', icon: Users },
  { href: '/portal-terapis/dashboard/afiliasi', label: 'Afiliasi', icon: Link2 },
  { href: '/portal-terapis/dashboard/pengaturan', label: 'Pengaturan', icon: Settings },
];

export function Sidebar() {
  const pathname = useLocation({ select: (l) => l.pathname });
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('terapis_token');
    navigate({ to: '/portal-terapis/auth' });
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
          const isActive = item.href === '/portal-terapis/dashboard'
            ? pathname === '/portal-terapis/dashboard'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
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
