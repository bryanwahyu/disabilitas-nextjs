'use client';

import { useEffect, useState } from 'react';
import { MapPin, Users, CalendarCheck, Star, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { api, Appointment, Location } from '@/lib/yayasan/api';

const quickLinks = [
  { label: 'Tambah Lokasi Baru', href: '/dashboard/lokasi', icon: MapPin, color: 'text-indigo-400' },
  { label: 'Undang Terapis', href: '/dashboard/terapis', icon: Users, color: 'text-teal-400' },
  { label: 'Lihat Appointment Masuk', href: '/dashboard/appointment', icon: CalendarCheck, color: 'text-amber-400' },
  { label: 'Buat Pelatihan', href: '/dashboard/pelatihan', icon: TrendingUp, color: 'text-emerald-400' },
];

export default function DashboardPage() {
  const [orgName, setOrgName] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [therapistCount, setTherapistCount] = useState(0);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const me = await api.getMe();
        setOrgName(me.Profile?.FullName ?? me.Email);

        const [locRes, apptRes] = await Promise.all([
          api.getLocations(me.ID),
          api.getAppointments(),
        ]);

        setLocations(locRes.data);
        setAppointments(apptRes.data);

        const affRes = await Promise.all(
          locRes.data.map(l => api.getLocationTherapists(l.id).catch(() => []))
        );
        const unique = new Set(affRes.flat().map(a => a.therapist_id));
        setTherapistCount(unique.size);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const apptThisMonth = appointments.filter(a => {
    const d = new Date(a.StartAt);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  const pendingAppts = appointments.filter(a => a.Status === 'pending').slice(0, 3);

  const stats = [
    { label: 'Lokasi Aktif', value: loading ? '—' : locations.length, icon: MapPin, color: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' },
    { label: 'Terapis Bergabung', value: loading ? '—' : therapistCount, icon: Users, color: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
    { label: 'Appointment Bulan Ini', value: loading ? '—' : apptThisMonth, icon: CalendarCheck, color: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
    { label: 'Total Appointment', value: loading ? '—' : appointments.length, icon: Star, color: 'bg-violet-500/10 border-violet-500/20 text-violet-400' },
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
              <Link key={href} href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-sm text-slate-200">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Appointment Terbaru</h2>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pendingAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarCheck className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-slate-500 text-sm">Tidak ada appointment pending</p>
              <Link href="/dashboard/appointment" className="text-indigo-400 text-xs mt-2 hover:underline">
                Lihat semua →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAppts.map(a => (
                <div key={a.ID} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div>
                    <p className="text-xs text-slate-300 font-medium">
                      {new Date(a.StartAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(a.StartAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">Pending</span>
                </div>
              ))}
              <Link href="/dashboard/appointment" className="block text-center text-indigo-400 text-xs mt-2 hover:underline">
                Lihat semua appointment →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
