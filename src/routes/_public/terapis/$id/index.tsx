
import { useState, useEffect } from 'react';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, MapPin, Mail, Briefcase, Clock, Star,
  DollarSign, Calendar, Building2, CheckCircle, Globe, User, Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ScheduleDetail, AvailableSlot } from '@/lib/api/types';
import { env } from '@/lib/env';
import { toIsoWithOffset } from '@/lib/datetime';
import { getTherapistForSEO, truncate } from '@/lib/api/seo';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * Profil terapis.
 *
 * `head` bergantung `loader`, dan datanya sengaja tidak di-defer: yang
 * di-stream baru resolve setelah shell HTML terkirim, sementara crawler
 * membaca HTML awal. Pola yang sama dipakai halaman detail artikel.
 */
export const Route = createFileRoute('/_public/terapis/$id/')({
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    // `undefined` bila tak ada, bukan `'profil'`: nilai default membuat
    // TanStack menormalkan URL, jadi setiap /terapis/<id> — termasuk yang ada
    // di sitemap — dijawab 307 ke /terapis/<id>?tab=profil.
    tab: typeof search.tab === 'string' ? search.tab : undefined,
  }),

  loader: async ({ params, context }) => {
    const { from, to } = getDateRange();
    const [therapist] = await Promise.all([
      getTherapistForSEO(params.id),
      // Sekaligus memanaskan cache Query milik komponen supaya profilnya ikut
      // ter-render di HTML server, bukan hanya `<head>`-nya.
      context.queryClient.ensureQueryData({
        queryKey: qk.therapyProviders.detail(params.id),
        queryFn: () => fetchProvider(params.id),
      }),
      // Jadwal dan slot ikut dipanaskan supaya tab Jadwal langsung terisi —
      // tanpa ini tombol slot baru muncul setelah hidrasi, dan pengunjung
      // sempat melihat "Memuat jadwal…" di halaman yang datanya sudah ada.
      context.queryClient.ensureQueryData({
        queryKey: qk.schedule.detail(params.id),
        queryFn: () => fetchSchedule(params.id),
      }),
      context.queryClient.ensureQueryData({
        queryKey: qk.availableSlots.sub(params.id, 'range', { from, to }),
        queryFn: () => fetchAvailableSlots(params.id, from, to),
      }),
      // Rating ikut HTML awal: ia sinyal kepercayaan pertama yang dilihat
      // calon klien, dan crawler membaca HTML awal.
      context.queryClient.ensureQueryData({
        queryKey: qk.reviews.of('summary', { id: params.id }),
        queryFn: () => unwrap(apiClient.reviews.summary(params.id)),
      }),
      context.queryClient.ensureQueryData({
        queryKey: qk.reviews.list({ id: params.id }),
        queryFn: () => unwrap(apiClient.reviews.list(params.id)),
      }),
    ]);
    return { therapist };
  },

  head: ({ loaderData, params }) => {
    const t = loaderData?.therapist;
    const url = `${env.siteUrl}/terapis/${params.id}`;

    if (!t) {
      return {
        meta: [
          { title: 'Terapis Tidak Ditemukan | DisabilitasKu' },
          {
            name: 'description',
            content: 'Profil terapis yang Anda cari tidak ditemukan di DisabilitasKu.',
          },
          { name: 'robots', content: 'noindex, follow' },
        ],
      };
    }

    const name = t.full_name || 'Terapis';
    const place = t.city || t.district;
    const title = place ? `${name} — Terapis di ${place}` : `${name} — Terapis`;
    const description = truncate(
      t.bio ||
        [
          `${name} adalah terapis`,
          t.specialization ? `spesialisasi ${t.specialization}` : null,
          place ? `di ${place}` : null,
          t.experience_years ? `dengan pengalaman ${t.experience_years} tahun` : null,
        ]
          .filter(Boolean)
          .join(' ') + '. Lihat profil dan jadwalnya di DisabilitasKu.'
    );

    return {
      meta: [
        { title: `${title} | DisabilitasKu` },
        { name: 'description', content: description },
        ...(t.specialization
          ? [{ name: 'keywords', content: [t.specialization, 'terapis', place].filter(Boolean).join(', ') }]
          : []),

        { property: 'og:type', content: 'profile' },
        { property: 'og:locale', content: 'id_ID' },
        { property: 'og:site_name', content: 'DisabilitasKu' },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:url', content: url },

        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
      ],

      links: [{ rel: 'canonical', href: url }],

      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            // Bukan `Person`: entri ini bisa berupa yayasan/klinik (role
            // `therapy`) maupun terapis perorangan.
            '@type': 'ProfilePage',
            name,
            url,
            description,
            ...(t.specialization ? { about: t.specialization } : {}),
            ...(place ? { contentLocation: { '@type': 'Place', name: place } } : {}),
          }),
        },
      ],
    };
  },

  component: TherapistDetailPage,
});


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

const BASE_URL = env.apiBaseUrl;

/**
 * Ambil satu profil terapis.
 *
 * Dulu halaman ini menarik `/therapy/providers?per_page=100` lalu mencari
 * id-nya di klien: satu request besar untuk satu profil, dan terapis di luar
 * 100 pertama tidak pernah bisa dibuka sama sekali — halamannya menampilkan
 * "Terapis tidak ditemukan" padahal datanya ada.
 */
async function fetchProvider(id: string): Promise<TherapyProvider | null> {
  const tokenKey = env.authTokenKey;
  const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
  const res = await fetch(`${BASE_URL}/therapy/providers/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function fetchSchedule(therapistId: string): Promise<ScheduleDetail | null> {
  const res = await fetch(`${BASE_URL}/therapists/${therapistId}/schedule`);
  if (!res.ok) return null; // terapis boleh saja belum punya jadwal
  const json = await res.json();
  return json.data || null;
}

async function fetchAvailableSlots(
  therapistId: string,
  from: string,
  to: string
): Promise<AvailableSlot[]> {
  const res = await fetch(`${BASE_URL}/therapists/${therapistId}/available-slots?from=${from}&to=${to}`);
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : [];
}

function TherapistDetailPage() {
  const params = useParams({ strict: false });
  const therapistId = params.id as string;
  const { tab: initialTab } = Route.useSearch();

  const [activeTab, setActiveTab] = useState<string>(initialTab ?? 'profil');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: provider = null,
    isPending: providerPending,
    isError: providerError,
  } = useQuery({
    queryKey: qk.therapyProviders.detail(therapistId),
    queryFn: () => fetchProvider(therapistId),
    enabled: !!therapistId,
  });

  useEffect(() => {
    if (providerError) {
      toast({ title: 'Error', description: 'Gagal memuat profil terapis', variant: 'destructive' });
    }
  }, [providerError, toast]);

  const { data: schedule = null, isPending: schedulePending } = useQuery({
    queryKey: qk.schedule.detail(therapistId),
    queryFn: () => fetchSchedule(therapistId),
    enabled: !!therapistId,
  });

  const { from, to } = getDateRange();
  const { data: availableSlots = [], isPending: slotsPending } = useQuery({
    queryKey: qk.availableSlots.sub(therapistId, 'range', { from, to }),
    queryFn: () => fetchAvailableSlots(therapistId, from, to),
    enabled: !!therapistId,
  });

  /*
   * Ringkasan ulasan.
   *
   * Endpoint-nya publik dan sudah lama ada, tapi tidak pernah dipanggil dari
   * mana pun — calon klien menilai terapis tanpa satu sinyal pun dari keluarga
   * lain. Ikut dipanaskan di loader supaya masuk HTML awal.
   */
  const { data: reviewSummary } = useQuery({
    queryKey: qk.reviews.of('summary', { id: therapistId }),
    queryFn: () => unwrap(apiClient.reviews.summary(therapistId)),
    enabled: !!therapistId,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: qk.reviews.list({ id: therapistId }),
    queryFn: () => unwrap(apiClient.reviews.list(therapistId)),
    enabled: !!therapistId,
  });

  const bookMutation = useMutation({
    mutationFn: (slot: AvailableSlot) =>
      unwrap(
        apiClient.appointments.create({
          provider_id: therapistId,
          start_at: toIsoWithOffset(slot.date, slot.start_time),
          end_at: toIsoWithOffset(slot.date, slot.end_time),
          notes: bookingNotes.trim() || null,
        })
      ),
    onSuccess: () => {
      toast({
        title: 'Permintaan terkirim',
        description: 'Terapis akan mengonfirmasi jadwal Anda. Pantau di halaman Jadwal Saya.',
      });
      setSelectedSlot(null);
      setBookingNotes('');
      // Slot yang baru dipesan harus langsung tampak terpakai.
      queryClient.invalidateQueries({ queryKey: qk.availableSlots.all() });
      queryClient.invalidateQueries({ queryKey: qk.appointments.lists() });
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal memesan',
        description: error.message || 'Coba slot lain atau ulangi beberapa saat lagi.',
        variant: 'destructive',
      });
      // Kemungkinan besar slot keburu diambil orang lain — segarkan daftarnya.
      queryClient.invalidateQueries({ queryKey: qk.availableSlots.all() });
    },
  });

  const handleSlotClick = (slot: AvailableSlot) => {
    if (slot.is_booked) return;
    if (!user) {
      // Pola yang sama dipakai halaman konsultasi: bawa balik ke sini setelah masuk.
      navigate({
        to: '/auth',
        search: { redirect: `/terapis/${therapistId}?tab=jadwal` },
      });
      return;
    }
    setSelectedSlot(slot);
  };

  /*
   * Hanya profil yang menahan render.
   *
   * Sebelumnya jadwal dan slot ikut menahan: keduanya belum ada saat render
   * server, jadi seluruh halaman profil dikirim sebagai spinner — nama
   * terapis, kota, dan bio tidak pernah masuk HTML awal meski datanya sudah
   * ada. Jadwal punya penanda memuat sendiri di bawah.
   */
  if (providerPending) {
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
          <Link to="/terapis">
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
        <Link to="/terapis" className="inline-flex items-center text-gray-600 hover:text-primary">
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
                  {reviewSummary && reviewSummary.total_reviews > 0 && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      {reviewSummary.average_rating.toFixed(1)} · {reviewSummary.total_reviews} ulasan
                    </Badge>
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
                  <MapPin size={16} className="mr-2 text-gray-500" />
                  <span>{provider.city}{provider.district ? `, ${provider.district}` : ''}</span>
                </div>
              )}
              {provider.experience_years != null && provider.experience_years > 0 && (
                <div className="flex items-center text-sm text-gray-700">
                  <Clock size={16} className="mr-2 text-gray-500" />
                  <span>{provider.experience_years} tahun pengalaman</span>
                </div>
              )}
              {formatRateRange(provider) && (
                <div className="flex items-center text-sm text-gray-700">
                  <DollarSign size={16} className="mr-2 text-gray-500" />
                  <span>{formatRateRange(provider)}/sesi</span>
                </div>
              )}
              {provider.email ? (
                <div className="flex items-center text-sm text-gray-700">
                  <Mail size={16} className="mr-2 text-gray-500" />
                  <span>{provider.email}</span>
                </div>
              ) : provider.contact_locked ? (
                <Link to="/auth" className="flex items-center text-sm text-primary hover:underline">
                  <Lock size={16} className="mr-2 flex-shrink-0" />
                  <span>Daftar gratis untuk lihat kontak</span>
                </Link>
              ) : null}
              {provider.languages && (
                <div className="flex items-center text-sm text-gray-700">
                  <Globe size={16} className="mr-2 text-gray-500" />
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

            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Ulasan Keluarga
                    {reviewSummary && reviewSummary.total_reviews > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        {reviewSummary.average_rating.toFixed(1)} dari 5 ·{' '}
                        {reviewSummary.total_reviews} ulasan
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-900">
                          {r.reviewer_name || 'Keluarga klien'}
                        </span>
                        <span
                          className="inline-flex items-center gap-0.5"
                          aria-label={`${r.rating} dari 5 bintang`}
                        >
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              aria-hidden="true"
                              size={14}
                              className={
                                i <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              }
                            />
                          ))}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tab Content: Jadwal */}
        {activeTab === 'jadwal' && (
          <div className="space-y-6">
            {/*
              Dua cara memesan, dipisah dengan jelas: satu sesi untuk mencoba,
              atau paket berjalan untuk kebutuhan yang butuh pertemuan rutin.
              Tanpa pintu masuk ini, program hanya bisa ditemukan lewat URL.
            */}
            <Card className="border-teal-200 bg-teal-50/60">
              <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Butuh terapi rutin, bukan sekali datang?</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Ambil paket terapi berjalan: bayar sekali, jadwalnya tetap tiap minggu, dan progres anak
                    dicatat per sesi.
                  </p>
                </div>
                <Button asChild className="shrink-0">
                  <Link to="/program/ambil" search={{ terapis: therapistId }}>
                    Ambil program terapi
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {schedulePending || slotsPending ? (
              <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mr-3" />
                Memuat jadwal…
              </div>
            ) : schedule && schedule.slots.length > 0 ? (
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
                                <button
                                  key={i}
                                  type="button"
                                  disabled={slot.is_booked}
                                  onClick={() => handleSlotClick(slot)}
                                  aria-label={
                                    slot.is_booked
                                      ? `${formatDate(date)} ${slot.start_time} sudah dipesan`
                                      : `Pesan ${formatDate(date)} pukul ${slot.start_time}`
                                  }
                                  className={`rounded-md border text-xs py-1.5 px-2.5 transition-colors ${
                                    slot.is_booked
                                      ? 'bg-gray-100 border-gray-200 text-gray-500 line-through cursor-not-allowed'
                                      : 'border-primary text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
                                  }`}
                                >
                                  {slot.start_time} - {slot.end_time}
                                </button>
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
                            <MapPin size={14} className="mr-2 mt-0.5 text-gray-500" />
                            <span>{loc.city_name || 'Lokasi tersedia setelah daftar'}</span>
                          </div>
                          <Link to="/auth" className="flex items-center text-primary hover:underline">
                            <Lock size={14} className="mr-2 flex-shrink-0" />
                            <span>Daftar gratis untuk lihat alamat &amp; kontak</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start">
                            <MapPin size={14} className="mr-2 mt-0.5 text-gray-500" />
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

      <Dialog open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Janji Temu</DialogTitle>
            <DialogDescription>
              {selectedSlot
                ? `${formatDate(selectedSlot.date)}, pukul ${selectedSlot.start_time}–${selectedSlot.end_time} bersama ${provider.full_name || 'terapis ini'}.`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="booking-notes">Keluhan atau catatan (opsional)</Label>
            <Textarea
              id="booking-notes"
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="Ceritakan singkat kebutuhan anak Anda agar terapis siap sejak sesi pertama."
              rows={3}
            />
          </div>

          <p className="text-xs text-gray-500">
            Permintaan dikirim dengan status menunggu; terapis yang mengonfirmasi.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSlot(null)} disabled={bookMutation.isPending}>
              Batal
            </Button>
            <Button
              onClick={() => selectedSlot && bookMutation.mutate(selectedSlot)}
              disabled={bookMutation.isPending}
            >
              {bookMutation.isPending ? 'Mengirim…' : 'Ajukan Janji Temu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
