'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Globe,
  CheckCircle,
  CheckCircle2,
  Building2,
  Navigation,
  User,
  Lock,
  CalendarPlus,
  Loader2,
  Info,
} from 'lucide-react';
import { LOCATION_TYPE_LABELS } from '@/lib/api/types';
import type { TherapyLocationSEO } from '@/lib/api/seo';

interface LocationTherapist {
  id: string;
  therapist_id: string;
  therapist_name?: string;
  therapist_email: string;
  status: string;
  role?: string;
}

const LocationMap = dynamic(
  () => import('./LocationMap'),
  { ssr: false, loading: () => <div className="w-full h-[300px] rounded-lg bg-gray-100 animate-pulse" /> }
);

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface Props {
  initialLocation: TherapyLocationSEO | null;
}

export default function LocationDetailClient({ initialLocation }: Props) {
  if (!initialLocation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-12 px-4 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lokasi tidak ditemukan</h1>
          <Link href="/#layanan">
            <Button className="bg-primary hover:bg-primary/90">Kembali ke Pencarian</Button>
          </Link>
        </main>
      </div>
    );
  }

  const [therapists, setTherapists] = useState<LocationTherapist[]>([]);
  // The SEO/server fetch is unauthenticated, so contact info arrives locked.
  // For logged-in users we re-fetch client-side with their token to reveal it.
  const [unlocked, setUnlocked] = useState<TherapyLocationSEO | null>(null);
  const location = unlocked || initialLocation;

  useEffect(() => {
    if (!initialLocation) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    fetch(`${baseUrl}/therapy/locations/${initialLocation.id}/therapists`)
      .then(r => r.json())
      .then(json => {
        const data = Array.isArray(json.data) ? json.data : [];
        setTherapists(data.filter((t: LocationTherapist) => t.status === 'active'));
      })
      .catch(() => {});
  }, [initialLocation]);

  useEffect(() => {
    if (!initialLocation || !initialLocation.contact_locked) return;
    const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
    const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
    if (!token) return;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    fetch(`${baseUrl}/therapy/locations/${initialLocation.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(json => {
        const raw = json.data;
        const summary = raw?.summary ?? raw;
        if (summary && !summary.contact_locked) {
          setUnlocked({ ...summary, open_hours: raw?.open_hours ?? summary.open_hours });
        }
      })
      .catch(() => {});
  }, [initialLocation]);

  const hasCoordinates = !!(location.latitude && location.longitude &&
    location.latitude !== 0 && location.longitude !== 0);

  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.name + ' ' + location.address)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8 px-4 max-w-4xl mx-auto space-y-6">
        <Link href="/#layanan" className="inline-flex items-center text-gray-600 hover:text-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Pencarian
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-semibold leading-none tracking-tight mb-2">{location.name}</h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {location.type && (
                    <Badge variant="secondary" className="text-sm">
                      <Building2 className="w-3 h-3 mr-1" />
                      {LOCATION_TYPE_LABELS[location.type] || location.type}
                    </Badge>
                  )}
                  {location.is_verified && (
                    <Badge className="bg-green-100 text-green-800 text-sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Terverifikasi
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {location.description && (
              <p className="text-gray-700">{location.description}</p>
            )}

            {location.contact_locked ? (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Kontak &amp; alamat lengkap tersembunyi</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {location.city_name ? `Berlokasi di ${location.city_name}. ` : ''}
                      Daftar gratis untuk melihat email dan alamat lengkap{location.website ? '' : ' lokasi terapi ini'}. Janji temu dilakukan lewat aplikasi — tanpa berbagi nomor telepon.
                    </p>
                    {location.website && (
                      <div className="flex items-center text-sm text-gray-700 mt-2">
                        <Globe className="w-4 h-4 mr-2 text-gray-400" />
                        <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                          {location.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Link href="/auth">
                        <Button size="sm" className="bg-primary hover:bg-primary/90">Daftar Gratis</Button>
                      </Link>
                      <Link href="/auth">
                        <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5">Sudah punya akun? Masuk</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start text-sm text-gray-700">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                  <span>{location.address}{location.city_name ? `, ${location.city_name}` : ''}</span>
                </div>
                {location.email && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${location.email}`} className="hover:text-primary">{location.email}</a>
                  </div>
                )}
                {location.website && (
                  <div className="flex items-center text-sm text-gray-700">
                    <Globe className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                      {location.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>

              <div>
                <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">
                    <Navigation className="w-4 h-4 mr-2" />
                    Buka di Google Maps
                  </Button>
                </a>
              </div>
            </div>
            )}
          </CardContent>
        </Card>

        <LocationBooking location={location} />

        {hasCoordinates && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lokasi di Peta</CardTitle>
            </CardHeader>
            <CardContent>
              <LocationMap
                latitude={location.latitude!}
                longitude={location.longitude!}
                name={location.name}
              />
            </CardContent>
          </Card>
        )}

        {location.services && location.services.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Layanan Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {location.services.map((service) => (
                  <Badge key={service} variant="secondary" className="text-sm py-1 px-3">
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {location.open_hours && location.open_hours.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Jam Operasional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...location.open_hours]
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((hour) => (
                    <div key={hour.day_of_week} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="font-medium text-gray-700">{dayNames[hour.day_of_week]}</span>
                      <span className="text-gray-600">{hour.open_time} - {hour.close_time}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
        {therapists.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Terapis di Lokasi Ini</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {therapists.map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t.therapist_name || t.therapist_email}</p>
                        {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
                      </div>
                    </div>
                    <Link href={`/terapis/${t.therapist_id}`}>
                      <Button variant="outline" size="sm" className="text-xs border-primary text-primary hover:bg-primary/5">
                        Lihat Profil
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

/* ==================== BOOKING INSTITUSI ==================== */
// Booking ke klinik/yayasan: pengguna mengajukan jadwal, terapis ditugaskan
// kemudian oleh pihak institusi (berbeda dengan booking terapis langsung).
function LocationBooking({ location }: { location: TherapyLocationSEO }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
    setHasToken(!!(typeof window !== 'undefined' && localStorage.getItem(tokenKey)));
  }, []);

  const typeLabel = (location.type && LOCATION_TYPE_LABELS[location.type]) || 'klinik/yayasan';
  const minDate = new Date().toISOString().split('T')[0];

  const submit = async () => {
    setError('');
    if (!date || !time) {
      setError('Pilih tanggal dan jam terlebih dahulu.');
      return;
    }
    const start = new Date(`${date}T${time}`);
    if (Number.isNaN(start.getTime())) {
      setError('Tanggal atau jam tidak valid.');
      return;
    }
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
      const token = localStorage.getItem(tokenKey);
      const res = await fetch(`${baseUrl}/appointments/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          location_id: location.id,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error?.message || 'Gagal mengajukan janji temu.');
      }
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mengajukan janji temu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarPlus className="w-5 h-5 text-primary" />
          Ajukan Janji Temu
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 mb-4">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-gray-600">
            Ini adalah booking ke <span className="font-medium text-gray-900">{location.name}</span>. Terapis akan
            ditugaskan oleh pihak {typeLabel} sesuai kebutuhan. Ingin memilih terapis sendiri? Lihat daftar terapis di
            lokasi ini di bawah.
          </p>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">Janji temu diajukan</p>
            <p className="text-sm text-gray-600 mt-1">
              Pihak {typeLabel} akan menugaskan terapis dan mengonfirmasi jadwal Anda. Pantau status di halaman Jadwal.
            </p>
            <Link href="/jadwal">
              <Button variant="outline" className="mt-4 border-primary text-primary hover:bg-primary/5">Lihat Jadwal Saya</Button>
            </Link>
          </div>
        ) : !hasToken ? (
          <div className="text-center py-2">
            <p className="text-sm text-gray-600 mb-3">Masuk untuk mengajukan janji temu.</p>
            <Link href="/auth">
              <Button className="bg-primary hover:bg-primary/90">Masuk / Daftar Gratis</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tanggal</label>
                <Input type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Jam</label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Tujuan sesi atau kebutuhan khusus anak…"
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={submit} disabled={submitting} className="w-full bg-primary hover:bg-primary/90">
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CalendarPlus className="w-4 h-4 mr-2" />}
              Ajukan Janji Temu
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
