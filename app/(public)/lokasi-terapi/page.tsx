'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin, CheckCircle, Loader2, Search, Clock,
  Building2, Heart, MessageCircle, Video, Home, Lock, DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface TherapyLocationPublic {
  id: string;
  name: string;
  type: string | null;
  type_label: string;
  address: string;
  city_name: string | null;
  description: string | null;
  is_verified: boolean;
  bpjs_accepted?: boolean;
  consultation_methods?: string | null;
  rate_min?: number | null;
  rate_max?: number | null;
  services: string[];
  open_hours?: Array<{ day_of_week: number; open_time: string; close_time: string }>;
  contact_locked?: boolean;
}

const PAGE_SIZE = 12;

// Terapi & yayasan terintegrasi — semua jenis lokasi layanan dalam satu daftar.
const locationTypes = [
  { value: 'all', label: 'Semua Jenis' },
  { value: 'yayasan', label: 'Yayasan' },
  { value: 'klinik', label: 'Klinik' },
  { value: 'rumah_sakit', label: 'Rumah Sakit' },
  { value: 'praktek_mandiri', label: 'Praktek Mandiri' },
  { value: 'puskesmas', label: 'Puskesmas' },
];

const methodIcons: Record<string, typeof Building2> = {
  'tatap muka': Home,
  online: Video,
  chat: MessageCircle,
  'home visit': Home,
  home_visit: Home,
  klinik: Building2,
  offline: Building2,
};

const methodLabels: Record<string, string> = {
  online: 'Online',
  home_visit: 'Home Visit',
  'home visit': 'Home Visit',
  klinik: 'Klinik',
  offline: 'Tatap Muka',
};

const dayNamesShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatRateRange(min?: number | null, max?: number | null): string | null {
  const compact = (n: number) => new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 0 }).format(n);
  if (min && max && min !== max) return `Rp ${compact(min)} – Rp ${compact(max)}`;
  const single = min || max;
  if (single) return `Rp ${compact(single)}`;
  return null;
}

function LocationCard({ location: loc, router }: { location: TherapyLocationPublic; router: ReturnType<typeof useRouter> }) {
  return (
    <Card className="hover:shadow-lg transition-shadow border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900 mb-1">{loc.name}</CardTitle>
            <p className="text-sm text-primary font-medium">{loc.type_label}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {loc.is_verified && (
              <Badge className="bg-green-100 text-green-800 text-xs flex items-center gap-1">
                <CheckCircle size={10} /> Terverifikasi
              </Badge>
            )}
            {loc.bpjs_accepted && (
              <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs">BPJS</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {loc.contact_locked ? (
          <>
            <div className="flex items-start text-sm text-gray-600">
              <MapPin size={14} className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
              <span className="line-clamp-2">{loc.city_name || 'Lokasi tersedia setelah daftar'}</span>
            </div>
            <Link
              href="/auth"
              className="flex items-center text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <Lock size={14} className="mr-2 flex-shrink-0" />
              <span>Daftar gratis untuk lihat alamat lengkap</span>
            </Link>
          </>
        ) : (
          <div className="flex items-start text-sm text-gray-600">
            <MapPin size={14} className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
            <span className="line-clamp-2">{loc.address}{loc.city_name ? `, ${loc.city_name}` : ''}</span>
          </div>
        )}

        {formatRateRange(loc.rate_min, loc.rate_max) && (
          <div className="flex items-center text-sm">
            <DollarSign size={14} className="mr-2 text-green-500 flex-shrink-0" />
            <span className="font-semibold text-green-700">{formatRateRange(loc.rate_min, loc.rate_max)}<span className="font-normal text-gray-500">/sesi</span></span>
          </div>
        )}

        {loc.consultation_methods && (
          <div className="flex flex-wrap gap-1">
            {loc.consultation_methods.split(',').map((m) => {
              const method = m.trim().toLowerCase();
              const Icon = methodIcons[method] || Heart;
              return (
                <Badge key={m.trim()} variant="outline" className="text-xs gap-1">
                  <Icon size={10} />
                  {methodLabels[method] || m.trim()}
                </Badge>
              );
            })}
          </div>
        )}

        {loc.services && loc.services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {loc.services.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
            {loc.services.length > 3 && (
              <Badge variant="secondary" className="text-xs">+{loc.services.length - 3}</Badge>
            )}
          </div>
        )}

        {loc.open_hours && loc.open_hours.length > 0 && (
          <div className="text-xs text-gray-500">
            <Clock size={12} className="inline mr-1" />
            {[...loc.open_hours]
              .sort((a, b) => a.day_of_week - b.day_of_week)
              .slice(0, 3)
              .map((h) => `${dayNamesShort[h.day_of_week]} ${h.open_time}-${h.close_time}`)
              .join(' · ')}
            {loc.open_hours.length > 3 && ' ...'}
          </div>
        )}

        <Button
          variant="outline"
          className="w-full border-primary text-primary hover:bg-primary/5 mt-2 text-sm"
          onClick={() => router.push(`/lokasi-terapi/${loc.id}`)}
        >
          <Building2 size={14} className="mr-1.5" />
          Lihat Detail Lokasi
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LokasiTerapiPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [bpjsOnly, setBpjsOnly] = useState(false);
  const [locations, setLocations] = useState<TherapyLocationPublic[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef({ search: '', type: 'all', bpjs: false });
  const hasMore = locations.length < total;

  const fetchLocations = useCallback(async (currentOffset: number, search: string, type: string, bpjs: boolean, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (type !== 'all') qs.set('type', type);
      if (bpjs) qs.set('bpjs', 'true');
      qs.set('limit', String(PAGE_SIZE));
      qs.set('offset', String(currentOffset));

      const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
      const token = typeof window !== 'undefined' ? localStorage.getItem(tokenKey) : null;
      const res = await fetch(`${baseUrl}/public/therapists?${qs.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      const data = Array.isArray(json.data) ? (json.data as TherapyLocationPublic[]) : [];
      const metaTotal = json.meta?.total ?? 0;

      if (append) setLocations((prev) => [...prev, ...data]);
      else setLocations(data);
      setTotal(metaTotal);
      setOffset(currentOffset + data.length);
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat data lokasi', variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [baseUrl, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRef.current = { search: searchTerm, type: selectedType, bpjs: bpjsOnly };
      setOffset(0);
      fetchLocations(0, searchTerm, selectedType, bpjsOnly, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedType, bpjsOnly, fetchLocations]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          const { search, type, bpjs } = fetchRef.current;
          fetchLocations(offset, search, type, bpjs, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, offset, fetchLocations]);

  return (
    <div className="py-12 px-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Lokasi <span className="text-primary">Terapi & Yayasan</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Temukan yayasan, klinik, rumah sakit, dan praktek terapi terdekat — semua dalam satu daftar terintegrasi.
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Cari nama lokasi, kota, atau layanan…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Jenis lokasi" />
              </SelectTrigger>
              <SelectContent>
                {locationTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={bpjsOnly ? 'default' : 'outline'}
              onClick={() => setBpjsOnly((v) => !v)}
              className={bpjsOnly ? '' : 'border-gray-300 text-gray-600'}
            >
              BPJS
            </Button>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : locations.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Tidak ada lokasi yang cocok dengan pencarian Anda.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{total} lokasi ditemukan</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((loc) => (
                <LocationCard key={loc.id} location={loc} router={router} />
              ))}
            </div>
            {loadingMore && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
            <div ref={sentinelRef} className="h-1" />
          </>
        )}
      </div>
    </div>
  );
}
