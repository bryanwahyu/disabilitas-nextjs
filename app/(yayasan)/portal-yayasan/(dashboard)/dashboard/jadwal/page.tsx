'use client';

import { useEffect, useState } from 'react';
import { Calendar, Loader2 } from 'lucide-react';
import { api, ScheduleSlot } from '@/lib/yayasan/api';

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const dayShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const workDays = [1, 2, 3, 4, 5, 6]; // Senin - Sabtu

export default function JadwalPage() {
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [noSchedule, setNoSchedule] = useState(false);

  useEffect(() => {
    api.getSchedule()
      .then(res => {
        setSlots(res.slots ?? []);
      })
      .catch(() => {
        setNoSchedule(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeSlots = slots.filter(s => s.is_active);

  const allTimes = [...new Set(activeSlots.map(s => s.start_time))].sort();

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Jadwal Layanan</h1>
        <p className="text-slate-400 text-sm">Jam operasional berdasarkan jadwal aktif yayasan</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
        </div>
      ) : noSchedule || activeSlots.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <Calendar className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Jadwal belum dikonfigurasi.</p>
          <p className="text-slate-500 text-xs mt-1">
            Jadwal dikelola melalui akun terapis yang terafiliasi. Hubungi terapis Anda untuk mengatur jadwal.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-4">
            <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: `80px repeat(${workDays.length}, 1fr)` }}>
              <div className="p-3 text-xs font-medium text-slate-500">Slot</div>
              {workDays.map(d => (
                <div key={d} className="p-3 text-xs font-medium text-slate-300 text-center border-l border-slate-800">{dayShort[d]}</div>
              ))}
            </div>
            {allTimes.map(time => (
              <div key={time} className="grid border-b border-slate-800 last:border-0" style={{ gridTemplateColumns: `80px repeat(${workDays.length}, 1fr)` }}>
                <div className="p-3 text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 flex-shrink-0" />{time}
                </div>
                {workDays.map(d => {
                  const slot = activeSlots.find(s => s.day_of_week === d && s.start_time === time);
                  return (
                    <div key={d} className="p-2 border-l border-slate-800 flex items-center justify-center">
                      {slot ? (
                        <span className="w-full text-center text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded px-1.5 py-0.5">
                          {slot.start_time}–{slot.end_time}
                        </span>
                      ) : (
                        <span className="text-slate-700 text-xs">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600">
            Jadwal aktif: {activeSlots.length} slot &nbsp;·&nbsp;
            Hari aktif: {[...new Set(activeSlots.map(s => dayNames[s.day_of_week]))].join(', ')}
          </p>
        </>
      )}
    </div>
  );
}
