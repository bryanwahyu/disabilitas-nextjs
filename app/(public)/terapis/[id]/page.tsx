'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, MapPin, Mail, Briefcase, Clock,
  DollarSign, Calendar, Building2, CheckCircle, Globe, User, Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ScheduleDetail, AvailableSlot } from '@/lib/api/types';

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface TherapyProvider {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  city?: string;
  district?: string;
  bio?: string;
  specialization?: string;
  experience_years?: number;
  certifications?: string;
  languages?: string;
  rate_per_session?: number;
  rate_min?: number;
  rate_max?: number;
  bpjs_accepted?: boolean;
  consultation_methods?: string;
  is_verified?: boolean;
  contact_locked?: boolean;
  locations?: Array<{
    id: string;
    name: string;
    type?: string;
    address: string;
    city_name?: string;
    phone?: string;
    is_verified: boolean;
    services?: string[];
    contact_locked?: boolean;
  }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

const methodLabels: Record<string, string> = {
  online: 'Online',
  home_visit: 'Home Visit',
  'home visit': 'Home Visit',
  klinik: 'Klinik',
  offline: 'Tatap Muka',
};

function formatRateRange(p: TherapyProvider): string | null {
  if (p.rate_min && p.rate_max && p.rate_min !== p.rate_max) {
    return `${formatCurrency(p.rate_min)} – ${formatCurrency(p.rate_max)}`;
  }
  const single = p.rate_min || p.rate_max || p.rate_per_session;
  return single ? formatCurrency(single) : null;
}

function getDateRange(): { from: string; to: string } {
  const today = new Date();
  const end = new Date(today);
  end.setDate(end.getDate() + 13);
  return {
    from: today.toISOString().split('T')[0],
    to: end.toISOString().split('T')[0],
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function TherapistDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const therapistId = params.id as string;
  const initialTab = searchParams.get('tab') || 'profil';

  const [provider, setProvider] = useState<TherapyProvider | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDetail | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';

  const fetchProvider = useCallback(async () => {
    try {
      const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
      const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
      const res = await fetch(`${baseUrl}/therapy/providers?q=&with=locations&per_page=100`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      const data = Array.isArray(json.data) ? json.data : [];
      const found = data.find((p: TherapyProvider) => p.id === therapistId);
      setProvider(found || null);
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat profil terapis', variant: 'destructive' });
    }
  }, [baseUrl, therapistId, toast]);

  const fetchSchedule = useCallback(async () => {
    try {
      const res = await fetch(`${baseUrl}/therapists/${therapistId}/schedule`);
      if (res.ok) {
        const json = await res.json();
        setSchedule(json.data || null);
      }
    } catch {
      // Schedule may not exist
    }
  }, [baseUrl, therapistId]);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      const { from, to } = getDateRange();
      const res = await fetch(`${baseUrl}/therapists/${therapistId}/available-slots?from=${from}&to=${to}`);
      if (res.ok) {
        const json = await res.json();
        setAvailableSlots(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      // Slots may not be available
    }
  }, [baseUrl, therapistId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProvider(), fetchSchedule(), fetchAvailableSlots()])
      .finally(() => setLoading(false));
  }, [fetchProvider, fetchSchedule, fetchAvailableSlots]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Terapis tidak ditemukan</h1>
          <Link href="/terapis">
            <Button className="bg-primary hover:bg-primary/90">Kembali ke Pencarian</Button>
          </Link>
        </div>
      </div>
    );
  }

  const slotsByDate = availableSlots.reduce<Record<string, AvailableSlot[]>>((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8 px-4 max-w-4xl mx-auto space-y-6">
        <Link href="/terapis" className="inline-flex items-center text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Pencarian
        </Link>

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {provider.full_name || provider.email}
                </h1>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge variant={provider.role === 'therapist_independent' ? 'default' : 'secondary'}>
                    {provider.role === 'therapist_independent' ? 'Terapis Independen' : 'Yayasan/Klinik'}
                  </Badge>
                  {provider.is_verified && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
                      <CheckCircle size={12} /> Terverifikasi
                    </Badge>
                  )}
                  {provider.bpjs_accepted && (
                    <Badge className="bg-teal-100 text-teal-800 border-teal-200">Menerima BPJS</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {provider.specialization && (
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Briefcase size={14} className="text-primary" />
                  <span className="text-sm font-medium text-gray-700">Spesialisasi</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {provider.specialization.split(',').map((s) => (
                    <span key={s.trim()} className="text-sm bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {provider.city && (
                <div className="flex items-center text-sm text-gray-700">
                  <MapPin size={16} className="mr-2 text-gray-400" />
                  <span>{provider.city}{provider.district ? `, ${provider.district}` : ''}</span>
                </div>
              )}
              {provider.experience_years != null && provider.experience_years > 0 && (
                <div className="flex items-center text-sm text-gray-700">
                  <Clock size={16} className="mr-2 text-gray-400" />
                  <span>{provider.experience_years} tahun pengalaman</span>
                </div>
              )}
              {formatRateRange(provider) && (
                <div className="flex items-center text-sm text-gray-700">
                  <DollarSign size={16} className="mr-2 text-gray-400" />
                  <span>{formatRateRange(provider)}/sesi</span>
                </div>
              )}
              {provider.email ? (
                <div className="flex items-center text-sm text-gray-700">
                  <Mail size={16} className="mr-2 text-gray-400" />
                  <span>{provider.email}</span>
                </div>
              ) : provider.contact_locked ? (
                <Link href="/auth" className="flex items-center text-sm text-primary hover:underline">
                  <Lock size={16} className="mr-2 flex-shrink-0" />
                  <span>Daftar gratis untuk lihat kontak</span>
                </Link>
              ) : null}
              {provider.languages && (
                <div className="flex items-center text-sm text-gray-700">
                  <Globe size={16} className="mr-2 text-gray-400" />
                  <span>{provider.languages}</span>
                </div>
              )}
            </div>

            {provider.consultation_methods && (
              <div className="mt-4">
                <span className="text-sm font-medium text-gray-700 mr-2">Metode Konsultasi:</span>
                {provider.consultation_methods.split(',').map((m) => (
                  <Badge key={m.trim()} variant="outline" className="mr-1 text-xs">
                    {methodLabels[m.trim().toLowerCase()] || m.trim()}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-gray-200 pb-0">
          {['profil', 'jadwal', 'lokasi'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'profil' ? 'Profil' : tab === 'jadwal' ? 'Jadwal' : 'Lokasi Praktek'}
            </button>
          ))}
        </div>

        {/* Tab Content: Profil */}
        {activeTab === 'profil' && (
          <div className="space-y-6">
            {provider.bio && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Tentang</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{provider.bio}</p>
                </CardContent>
              </Card>
            )}

            {provider.certifications && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Sertifikasi & Pendidikan</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-line">{provider.certifications}</p>
                </CardContent>
              </Card>
            )}

            {!provider.bio && !provider.certifications && (
              <div className="text-center py-8 text-gray-500">
                Terapis belum mengisi profil lengkap.
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Jadwal */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            {schedule && schedule.slots.length > 0 ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Jadwal Mingguan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {[...schedule.slots]
                        .filter((s) => s.is_active)
                        .sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time))
                        .map((slot) => (
                          <div key={slot.id} className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                            <span className="font-medium text-gray-700">{dayNames[slot.day_of_week]}</span>
                            <span className="text-gray-600">{slot.start_time} - {slot.end_time}</span>
                          </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Durasi per sesi: {schedule.schedule.slot_duration_minutes} menit
                    </p>
                  </CardContent>
                </Card>

                {Object.keys(slotsByDate).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Slot Tersedia (14 Hari ke Depan)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {Object.entries(slotsByDate).map(([date, slots]) => (
                          <div key={date}>
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">
                              {formatDate(date)}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {slots.map((slot, i) => (
                                <Badge
                                  key={i}
                                  variant={slot.is_booked ? 'secondary' : 'outline'}
                                  className={`text-xs py-1 px-2 ${
                                    slot.is_booked
                                      ? 'bg-gray-100 text-gray-400 line-through'
                                      : 'border-primary text-primary hover:bg-primary/5 cursor-pointer'
                                  }`}
                                >
                                  {slot.start_time} - {slot.end_time}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Terapis belum mengatur jadwal ketersediaan.
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Lokasi Praktek */}
        {activeTab === 'lokasi' && (
          <div className="space-y-4">
            {provider.locations && provider.locations.length > 0 ? (
              provider.locations.map((loc) => (
                <Card key={loc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                        {loc.type && (
                          <Badge variant="secondary" className="text-xs mt-1">{loc.type}</Badge>
                        )}
                      </div>
                      {loc.is_verified && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle size={12} className="mr-1" /> Terverifikasi
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {loc.contact_locked ? (
                        <>
                          <div className="flex items-start">
                            <MapPin size={14} className="mr-2 mt-0.5 text-gray-400" />
                            <span>{loc.city_name || 'Lokasi tersedia setelah daftar'}</span>
                          </div>
                          <Link href="/auth" className="flex items-center text-primary hover:underline">
                            <Lock size={14} className="mr-2 flex-shrink-0" />
                            <span>Daftar gratis untuk lihat alamat &amp; kontak</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start">
                            <MapPin size={14} className="mr-2 mt-0.5 text-gray-400" />
                            <span>{loc.address}{loc.city_name ? `, ${loc.city_name}` : ''}</span>
                          </div>
                        </>
                      )}
                    </div>
                    {loc.services && loc.services.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {loc.services.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full mt-4 border-primary text-primary hover:bg-primary/5"
                      onClick={() => window.location.href = `/lokasi-terapi/${loc.id}`}
                    >
                      <Building2 size={16} className="mr-2" /> Lihat Detail Lokasi
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Terapis belum mendaftarkan lokasi praktek.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
