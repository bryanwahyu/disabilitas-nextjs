
import React, { useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';
import { SITE_URL } from '@/lib/api/seo';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrapWithMeta } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, MapPin, Eye, Search, ArrowLeft, Building2, Banknote, CalendarDays, Award, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { disabilityBadgeClass, disabilityLabel, parseDisabilityCSV } from '@/lib/disability';
import { jsonLdScript } from '@/lib/seo/head';
import { env } from '@/lib/env';

export const Route = createFileRoute('/_public/pelatihan/')({
  // Canonical halaman daftar; dipindah dari layout supaya tidak ikut
  // menempel di halaman detail (lihat catatan di route.tsx).
  /*
   * Breadcrumb JSON-LD ada di halaman daftar, bukan di layout induknya.
   *
   * Saat masih di layout, halaman detail menerima DUA BreadcrumbList: milik
   * layout (Beranda › Pelatihan) dan miliknya sendiri (Beranda › Pelatihan › judul).
   * Dua breadcrumb yang saling bertentangan di satu halaman membuat mesin
   * pencari memilih sendiri mana yang dipakai.
   */
  head: () => ({
    links: [{ rel: 'canonical', href: `${SITE_URL}/pelatihan` }],
    scripts: [
      jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: env.siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Pelatihan', item: `${env.siteUrl}/pelatihan` },
        ],
      }),
    ],
  }),

  /*
   * Halaman pertama tanpa filter — persis kondisi yang dilihat crawler dan
   * pengunjung pertama kali. Tanpa loader, `isPending` selalu true saat SSR
   * dan HTML-nya hanya kerangka tanpa satu pun pelatihan.
   */
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: qk.trainings.list({ limit: 12, offset: 0 }),
      queryFn: () => unwrapWithMeta(apiClient.publicTrainings.list({ limit: 12, offset: 0 })),
    }),

  component: PelatihanPage,
});


const CATEGORIES = [
  { value: 'all', label: 'Semua Kategori' },
  { value: 'soft_skill', label: 'Soft Skill' },
  { value: 'hard_skill', label: 'Hard Skill' },
  { value: 'sertifikasi', label: 'Sertifikasi' },
  { value: 'bahasa', label: 'Bahasa' },
  { value: 'teknologi', label: 'Teknologi' },
];

const TRAINING_TYPES = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
];

const SKILL_LEVELS = [
  { value: 'all', label: 'Semua Level' },
  { value: 'pemula', label: 'Pemula' },
  { value: 'menengah', label: 'Menengah' },
  { value: 'mahir', label: 'Mahir' },
  { value: 'semua', label: 'Semua Level (Umum)' },
];

const PRICE_FILTERS = [
  { value: 'all', label: 'Semua Harga' },
  { value: 'gratis', label: 'Gratis' },
  { value: 'berbayar', label: 'Berbayar' },
];

function formatPrice(price: number, isFree: boolean, currency?: string) {
  if (isFree) return 'Gratis';
  const cur = currency || 'IDR';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateRange(start: string, end?: string) {
  const startStr = formatDate(start);
  if (!end) return startStr;
  const endStr = formatDate(end);
  return `${startStr} - ${endStr}`;
}

function getCategoryBadge(category: string) {
  switch (category) {
    case 'soft_skill':
      return { label: 'Soft Skill', className: 'bg-blue-100 text-blue-800' };
    case 'hard_skill':
      return { label: 'Hard Skill', className: 'bg-green-100 text-green-800' };
    case 'sertifikasi':
      return { label: 'Sertifikasi', className: 'bg-amber-100 text-amber-800' };
    case 'bahasa':
      return { label: 'Bahasa', className: 'bg-violet-100 text-violet-800' };
    case 'teknologi':
      return { label: 'Teknologi', className: 'bg-cyan-100 text-cyan-800' };
    default:
      return { label: category, className: 'bg-gray-100 text-gray-800' };
  }
}

function getTrainingTypeBadge(type: string) {
  switch (type) {
    case 'online':
      return { label: 'Online', className: 'bg-purple-100 text-purple-800' };
    case 'offline':
      return { label: 'Offline', className: 'bg-orange-100 text-orange-800' };
    case 'hybrid':
      return { label: 'Hybrid', className: 'bg-teal-100 text-teal-800' };
    default:
      return { label: type, className: 'bg-gray-100 text-gray-800' };
  }
}

function getSkillLevelLabel(level?: string) {
  switch (level) {
    case 'pemula': return 'Pemula';
    case 'menengah': return 'Menengah';
    case 'mahir': return 'Mahir';
    case 'semua': return 'Semua Level';
    default: return level || '';
  }
}

const getDisabilityBadges = parseDisabilityCSV;
const getDisabilityColor = disabilityBadgeClass;

function TrainingCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PelatihanPage() {
  const [searchQuery, setSearchQuery] = useState('');
  // Pencarian baru dijalankan saat Enter ditekan — bukan tiap ketikan.
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 12;

  const listParams: {
    q?: string;
    category?: string;
    training_type?: string;
    skill_level?: string;
    is_free?: string;
    limit: number;
    offset: number;
  } = {
    limit,
    offset: (page - 1) * limit,
  };
  if (selectedCategory !== 'all') listParams.category = selectedCategory;
  if (selectedType !== 'all') listParams.training_type = selectedType;
  if (selectedLevel !== 'all') listParams.skill_level = selectedLevel;
  if (selectedPrice === 'gratis') listParams.is_free = 'true';
  if (selectedPrice === 'berbayar') listParams.is_free = 'false';
  if (appliedSearch) listParams.q = appliedSearch;

  const { data, isPending: loading } = useQuery({
    queryKey: qk.trainings.list(listParams),
    queryFn: () => unwrapWithMeta(apiClient.publicTrainings.list(listParams)),
    // Ganti filter/halaman tidak mengosongkan grid sampai data baru datang.
    placeholderData: keepPreviousData,
  });

  const trainings = data?.data ?? [];
  const total = data?.meta?.total || trainings.length;

  const handleSearch = () => {
    setPage(1);
    setAppliedSearch(searchQuery.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Pelatihan Skill</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
              <Input
                aria-label="Cari pelatihan" placeholder="Cari pelatihan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter kategori pelatihan" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter tipe pelatihan" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipe Pelatihan" />
              </SelectTrigger>
              <SelectContent>
                {TRAINING_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLevel} onValueChange={(v) => { setSelectedLevel(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter level pelatihan" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPrice} onValueChange={(v) => { setSelectedPrice(v); setPage(1); }}>
              <SelectTrigger aria-label="Filter harga pelatihan" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Harga" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_FILTERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <TrainingCardSkeleton key={i} />
            ))}
          </div>
        ) : trainings.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada pelatihan</h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Tidak ditemukan pelatihan yang sesuai dengan pencarian Anda'
                : 'Belum ada program pelatihan yang tersedia'}
            </p>
          </div>
        ) : (
          <>
            {/* Training Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainings.map((training) => {
                const categoryBadge = getCategoryBadge(training.category);
                const typeBadge = getTrainingTypeBadge(training.training_type);
                const disabilityBadges = getDisabilityBadges(training.disability_types);
                const spotsRemaining = training.max_participants != null && training.registration_count != null
                  ? training.max_participants - training.registration_count
                  : null;

                return (
                  <Link key={training.id} to="/pelatihan/$id" params={{ id: training.id }}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {training.organizer_logo ? (
                            <img
                              src={training.organizer_logo}
                              alt={training.organizer_name}
                              loading="lazy"
                              decoding="async"
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="line-clamp-2 text-base">{training.title}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{training.organizer_name}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            <Badge className={categoryBadge.className}>{categoryBadge.label}</Badge>
                            <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                            {training.certificate && (
                              <Badge className="bg-amber-100 text-amber-800">
                                <Award className="w-3 h-3 mr-1" />
                                Bersertifikat
                              </Badge>
                            )}
                          </div>

                          {/* Skill Level */}
                          {training.skill_level && (
                            <div className="text-sm text-gray-500">
                              Level: <span className="font-medium text-gray-700">{getSkillLevelLabel(training.skill_level)}</span>
                            </div>
                          )}

                          {/* Location / Online */}
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {training.training_type === 'online' ? 'Online' : training.location || 'Lokasi belum ditentukan'}
                            </span>
                          </div>

                          {/* Date Range */}
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <CalendarDays className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{formatDateRange(training.start_date, training.end_date)}</span>
                          </div>

                          {/* Price */}
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Banknote className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                            <span className={training.is_free ? 'text-green-600' : 'text-gray-700'}>
                              {formatPrice(training.price, training.is_free, training.price_currency)}
                            </span>
                          </div>

                          {/* Disability Types */}
                          {disabilityBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {disabilityBadges.slice(0, 3).map((dt) => (
                                <Badge key={dt} className={`text-xs ${getDisabilityColor(dt)}`}>
                                  {disabilityLabel(dt)}
                                </Badge>
                              ))}
                              {disabilityBadges.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{disabilityBadges.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Footer Info */}
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1 border-t">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {training.view_count} dilihat
                            </span>
                            {spotsRemaining !== null && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {spotsRemaining > 0
                                  ? `${spotsRemaining} kursi tersisa`
                                  : 'Kuota penuh'}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <span className="text-sm text-gray-600 px-4">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Selanjutnya
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
