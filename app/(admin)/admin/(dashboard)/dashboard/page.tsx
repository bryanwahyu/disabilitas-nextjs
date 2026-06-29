'use client';

import { useState, useEffect } from 'react';
import { Users, MapPin, Briefcase, Mail, MessageSquare, BookOpen } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLocations: 0,
    totalJobs: 0,
    totalContacts: 0,
    unreadContacts: 0,
    totalResources: 0,
  });
  const [contactStats, setContactStats] = useState({ unread: 0, read: 0, replied: 0 });

  useEffect(() => {
    const fetch = async () => {
      try {
        const [locRes, resRes, contactsRes, jobsRes, usersRes] = await Promise.all([
          apiClient.adminTherapyLocations.list({ limit: 1 }),
          apiClient.adminResources.list({ limit: 1 }),
          apiClient.adminContacts.list({ limit: 1000 }),
          apiClient.adminJobs.list({ limit: 1 }),
          apiClient.adminUsers.list({ page: 1, page_size: 1 }),
        ]);
        const contacts = Array.isArray(contactsRes.data) ? contactsRes.data : [];
        const unread = contacts.filter((c: any) => c.status === 'unread').length;
        const read = contacts.filter((c: any) => c.status === 'read').length;
        const replied = contacts.filter((c: any) => c.status === 'replied').length;
        setContactStats({ unread, read, replied });
        setStats({
          totalUsers: (usersRes as any).meta?.total ?? 0,
          totalLocations: (locRes as any).meta?.total ?? 0,
          totalJobs: (jobsRes as any).meta?.total ?? 0,
          totalContacts: contacts.length,
          unreadContacts: unread,
          totalResources: (resRes as any).meta?.total ?? 0,
        });
      } catch { /* silent */ }
    };
    fetch();
  }, []);

  const statCards = [
    { label: 'Pengguna', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lokasi Terapi', value: stats.totalLocations, icon: MapPin, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Lowongan', value: stats.totalJobs, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Sumber Belajar', value: stats.totalResources, icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Pesan Masuk', value: stats.totalContacts, icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-50' },
    {
      label: 'Belum Dibaca',
      value: stats.unreadContacts,
      icon: Mail,
      color: stats.unreadContacts > 0 ? 'text-red-600' : 'text-gray-600',
      bg: stats.unreadContacts > 0 ? 'bg-red-50' : 'bg-gray-50',
    },
  ];

  const total = contactStats.unread + contactStats.read + contactStats.replied;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Selamat datang di Admin Panel DisabilitasKu.id</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value.toLocaleString('id-ID')}</p>
            </div>
          );
        })}
      </div>

      {total > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Status Pesan Kontak</h2>
          <div className="space-y-3">
            {[
              { label: 'Belum Dibaca', count: contactStats.unread, color: 'bg-red-500' },
              { label: 'Sudah Dibaca', count: contactStats.read, color: 'bg-yellow-500' },
              { label: 'Sudah Dibalas', count: contactStats.replied, color: 'bg-green-500' },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 text-gray-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                    {row.label}
                  </span>
                  <span className="font-medium text-gray-900">{row.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} transition-all duration-500`}
                    style={{ width: total ? `${(row.count / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-amber-800">
        Kelola fitur spesifik dari menu sidebar di sebelah kiri.
      </div>
    </div>
  );
}
