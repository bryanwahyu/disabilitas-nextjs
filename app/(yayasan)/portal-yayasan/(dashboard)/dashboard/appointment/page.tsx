'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, CheckCircle, XCircle, Loader, Loader2 } from 'lucide-react';
import { api, Appointment } from '@/lib/yayasan/api';

type Status = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const statusConfig: Record<Status, { label: string; color: string; icon: React.ReactNode }> = {
  pending:   { label: 'Menunggu',     color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',    icon: <Loader className="w-3 h-3" /> },
  confirmed: { label: 'Dikonfirmasi', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  completed: { label: 'Selesai',      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: 'Dibatalkan',   color: 'bg-red-500/10 text-red-400 border-red-500/20',          icon: <XCircle className="w-3 h-3" /> },
};

const tabs: { key: Status | 'all'; label: string }[] = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'completed', label: 'Selesai' },
];

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTime(s: string) {
  return new Date(s).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function AppointmentPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Status | 'all'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api.getAppointments()
      .then(res => setAppointments(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      await api.updateAppointment(id, status);
      setAppointments(prev => prev.map(a => a.ID === id ? { ...a, Status: status } : a));
    } catch {
      alert('Gagal memperbarui status');
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered = activeTab === 'all'
    ? appointments
    : appointments.filter(a => a.Status === activeTab);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Appointment</h1>
        <p className="text-slate-400 text-sm">Pantau dan kelola semua appointment di yayasan Anda</p>
      </div>

      <div className="flex gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => {
            const sc = statusConfig[appt.Status as Status] ?? statusConfig.pending;
            const isUpdating = updatingId === appt.ID;
            return (
              <div key={appt.ID} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                      <CalendarCheck className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-white font-mono text-xs">{appt.ID.slice(0, 8)}…</p>
                        <span className={`flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full ${sc.color}`}>
                          {sc.icon}{sc.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                          {fmtDate(appt.StartAt)} · {fmtTime(appt.StartAt)} — {fmtTime(appt.EndAt)}
                        </span>
                      </div>
                      {appt.Notes && <p className="text-xs text-slate-600 mt-1.5 italic">"{appt.Notes}"</p>}
                    </div>
                  </div>
                  {appt.Status === 'pending' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => updateStatus(appt.ID, 'confirmed')} disabled={isUpdating}
                        className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors">
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                        Konfirmasi
                      </button>
                      <button onClick={() => updateStatus(appt.ID, 'cancelled')} disabled={isUpdating}
                        className="text-xs bg-slate-700 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                        Tolak
                      </button>
                    </div>
                  )}
                  {appt.Status === 'confirmed' && (
                    <button onClick={() => updateStatus(appt.ID, 'completed')} disabled={isUpdating}
                      className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                      {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Tandai Selesai
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CalendarCheck className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">Tidak ada appointment untuk filter ini</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
