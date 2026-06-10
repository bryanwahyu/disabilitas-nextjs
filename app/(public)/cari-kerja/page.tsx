'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import type { JobSummary } from '@/lib/api/types';
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
import { Briefcase, MapPin, Clock, Eye, Search, ArrowLeft, Building2, Banknote, Accessibility } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WORK_TYPES = [
  { value: 'all', label: 'Semua Tipe' },
  { value: 'remote', label: 'Remote' },
  { value: 'on_site', label: 'On-Site' },
  { value: 'hybrid', label: 'Hybrid' },
];

const EMPLOYMENT_TYPES = [
  { value: 'all', label: 'Semua Jenis' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Kontrak' },
  { value: 'internship', label: 'Magang' },
];

const DISABILITY_TYPES = [
  { value: 'all', label: 'Semua Disabilitas' },
  { value: 'fisik', label: 'Disabilitas Fisik' },
  { value: 'netra', label: 'Disabilitas Netra' },
  { value: 'rungu', label: 'Disabilitas Rungu' },
  { value: 'intelektual', label: 'Disabilitas Intelektual' },
  { value: 'mental', label: 'Disabilitas Mental' },
  { value: 'sensorik', label: 'Disabilitas Sensorik' },
];

function formatSalary(min?: number, max?: number, currency?: string) {
  const cur = currency || 'IDR';
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: cur,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) {
    return `Mulai ${formatter.format(min)}`;
  }
  if (max) {
    return `Hingga ${formatter.format(max)}`;
  }
  return null;
}

function formatDate(dateString?: string) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isDeadlinePassed(deadline: string) {
  return new Date(deadline) < new Date();
}

function getWorkTypeBadge(workType: string) {
  switch (workType) {
    case 'remote':
      return { label: 'Remote', className: 'bg-blue-100 text-blue-800' };
    case 'on_site':
      return { label: 'On-Site', className: 'bg-green-100 text-green-800' };
    case 'hybrid':
      return { label: 'Hybrid', className: 'bg-purple-100 text-purple-800' };
    default:
      return { label: workType, className: 'bg-gray-100 text-gray-800' };
  }
}

function getEmploymentTypeBadge(type: string) {
  switch (type) {
    case 'full_time':
      return 'Full Time';
    case 'part_time':
      return 'Part Time';
    case 'contract':
      return 'Kontrak';
    case 'internship':
      return 'Magang';
    default:
      return type;
  }
}

function getDisabilityBadges(types?: string) {
  if (!types) return [];
  return types.split(',').map((t) => t.trim()).filter(Boolean);
}

const DISABILITY_COLORS: Record<string, string> = {
  'fisik': 'bg-orange-100 text-orange-800',
  'netra': 'bg-cyan-100 text-cyan-800',
  'rungu': 'bg-pink-100 text-pink-800',
  'intelektual': 'bg-yellow-100 text-yellow-800',
  'mental': 'bg-indigo-100 text-indigo-800',
  'sensorik': 'bg-teal-100 text-teal-800',
  'ganda': 'bg-red-100 text-red-800',
  'semua': 'bg-emerald-100 text-emerald-800',
};

function getDisabilityColor(type: string) {
  const key = type.toLowerCase();
  for (const [k, v] of Object.entries(DISABILITY_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 'bg-gray-100 text-gray-700';
}

function JobCardSkeleton() {
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

export default function CariKerjaPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkType, setSelectedWorkType] = useState('all');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('all');
  const [selectedDisability, setSelectedDisability] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    fetchJobs();
  }, [selectedWorkType, selectedEmploymentType, selectedDisability, page]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params: {
        q?: string;
        work_type?: string;
        employment_type?: string;
        disability_type?: string;
        limit: number;
        offset: number;
      } = {
        limit,
        offset: (page - 1) * limit,
      };
      if (selectedWorkType !== 'all') params.work_type = selectedWorkType;
      if (selectedEmploymentType !== 'all') params.employment_type = selectedEmploymentType;
      if (selectedDisability !== 'all') params.disability_type = selectedDisability;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const response = await apiClient.publicJobs.list(params);
      if (response.error) throw new Error(response.error);
      setJobs(response.data || []);
      setTotal(response.meta?.total || response.data?.length || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchJobs();
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
              <Briefcase className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">Cari Kerja</h1>
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Cari lowongan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>
          <Select value={selectedWorkType} onValueChange={(v) => { setSelectedWorkType(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tipe Pekerjaan" />
            </SelectTrigger>
            <SelectContent>
              {WORK_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedEmploymentType} onValueChange={(v) => { setSelectedEmploymentType(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Jenis Pekerjaan" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDisability} onValueChange={(v) => { setSelectedDisability(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Jenis Disabilitas" />
            </SelectTrigger>
            <SelectContent>
              {DISABILITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Tidak ada lowongan</h3>
            <p className="text-gray-500">
              {searchQuery
                ? 'Tidak ditemukan lowongan yang sesuai dengan pencarian Anda'
                : 'Belum ada lowongan pekerjaan yang tersedia'}
            </p>
          </div>
        ) : (
          <>
            {/* Job Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => {
                const workBadge = getWorkTypeBadge(job.work_type);
                const deadlinePassed = isDeadlinePassed(job.deadline_apply);
                const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
                const disabilityBadges = getDisabilityBadges(job.disability_types);

                return (
                  <Link key={job.id} href={`/cari-kerja/${job.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          {job.company_logo ? (
                            <img
                              src={job.company_logo}
                              alt={job.company_name}
                              loading="lazy"
                              decoding="async"
                              width={48}
                              height={48}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="line-clamp-2 text-base">{job.title}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">{job.company_name}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            <Badge className={workBadge.className}>{workBadge.label}</Badge>
                            <Badge variant="outline">{getEmploymentTypeBadge(job.employment_type)}</Badge>
                            {job.accessibility_notes && (
                              <Badge className="bg-emerald-100 text-emerald-800 gap-1">
                                <Accessibility className="w-3 h-3" />
                                Akses Inklusif
                              </Badge>
                            )}
                            {deadlinePassed && (
                              <Badge variant="destructive">Ditutup</Badge>
                            )}
                          </div>

                          {/* Location */}
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>

                          {/* Salary */}
                          {salary && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
                              <Banknote className="w-3.5 h-3.5 flex-shrink-0 text-green-600" />
                              <span className="truncate">{salary}</span>
                            </div>
                          )}

                          {/* Disability Types */}
                          {disabilityBadges.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {disabilityBadges.slice(0, 3).map((dt) => (
                                <Badge key={dt} className={`text-xs ${getDisabilityColor(dt)}`}>
                                  {dt}
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
                              <Clock className="w-3 h-3" />
                              {deadlinePassed ? 'Ditutup' : `Batas: ${formatDate(job.deadline_apply)}`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {job.view_count} dilihat
                            </span>
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
