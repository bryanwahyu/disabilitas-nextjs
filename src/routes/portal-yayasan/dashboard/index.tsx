
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users, CalendarCheck, Star, TrendingUp, Clock } from 'lucide-react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { api, Affiliation } from '@/lib/yayasan/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-yayasan/dashboard/')({
  component: DashboardPage,
});


const quickLinks = [
  { label: 'Tambah Lokasi Baru', href: '/dashboard/lokasi', icon: MapPin, color: 'text-indigo-400' },
  { label: 'Undang Terapis', href: '/dashboard/terapis', icon: Users, color: 'text-teal-400' },
  { label: 'Lihat Appointment Masuk', href: '/dashboard/appointment', icon: CalendarCheck, color: 'text-amber-400' },
  { label: 'Buat Pelatihan', href: '/dashboard/pelatihan', icon: TrendingUp, color: 'text-emerald-400' },
];

function DashboardPage() {
  const { data: me, isPending: loadingMe } = useQuery({
    queryKey: qk.me(),
    queryFn: () => api.getMe(),
  });
  const providerId = me?.ID ?? '';
  const orgName = me ? (me.Profile?.FullName ?? me.Email) : '';

  const { data: locations = [], isPending: loadingLocationsQuery } = useQuery({
    queryKey: qk.yayasan.locations.list({ providerId }),
    queryFn: () => api.getLocations(providerId),
    enabled: !!providerId,
    select: res => res.data,
  });
  // Query bergantung: selama `me` belum ada, query lokasi memang belum jalan.
  // Kalau `me` gagal, jangan gantung di "memuat" — tampilkan angka apa adanya.
  const loadingLocations = loadingMe || (!!providerId && loadingLocationsQuery);

  // Appointment tidak bergantung pada `me`, jadi kartunya bisa tampil lebih dulu.
  const { data: appointments = [], isPending: loadingAppointments } = useQuery({
    queryKey: qk.yayasan.appointments.list(),
    queryFn: () => api.getAppointments(),
    select: res => res.data,
  });

  const locationIds = locations.map(l => l.id);
  const { data: therapistCount = 0, isPending: loadingTherapistsQuery } = useQuery({
    queryKey: qk.yayasan.therapists.list({ locationIds: locationIds.join(',') }),
    queryFn: async () => {
      const perLocation = await Promise.all(
        locationIds.map(id => api.getLocationTherapists(id).catch(() => [] as Affiliation[]))
      );
      return new Set(perLocation.flat().map(a => a.therapist_id)).size;
    },
    enabled: !!providerId && !loadingLocationsQuery,
  });
  const loadingTherapists = loadingLocations || (!!providerId && loadingTherapistsQuery);

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const apptThisMonth = appointments.filter(a => {
    const d = new Date(a.start_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const pendingAppts = appointments.filter(a => a.status === 'pending').slice(0, 3);

  const stats = [
    { label: 'Lokasi Aktif', value: loadingLocations ? '—' : locations.length, icon: MapPin, color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
    { label: 'Terapis Bergabung', value: loadingTherapists ? '—' : therapistCount, icon: Users, color: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
    { label: 'Appointment Bulan Ini', value: loadingAppointments ? '—' : apptThisMonth, icon: CalendarCheck, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    { label: 'Total Appointment', value: loadingAppointments ? '—' : appointments.length, icon: Star, color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-slate-400 text-sm">{orgName ? `${orgName} — ` : ''}Portal Yayasan DisabilitasKu.id</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`border rounded-xl p-5 ${color}`}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 opacity-70" />
              <p className="text-xs font-medium opacity-70">{label}</p>
            </div>
            <p className="text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" /> Aksi Cepat
          </h2>
          <div className="space-y-2">
            {quickLinks.map(({ label, href, icon: Icon, color }) => (
              <Link key={href} to={href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-slate-200">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Appointment Terbaru</h2>
          {loadingAppointments ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarCheck className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">Tidak ada appointment pending</p>
              <Link to="/portal-yayasan/dashboard/appointment" className="text-indigo-400 text-xs mt-2 hover:underline">
                Lihat semua →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAppts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-300 font-medium">
                      {new Date(a.start_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(a.start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>
                </div>
              ))}
              <Link to="/portal-yayasan/dashboard/appointment" className="block text-center text-indigo-400 text-xs mt-2 hover:underline">
                Lihat semua appointment →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
