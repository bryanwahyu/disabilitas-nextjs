'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Eye,
  Globe,
  Banknote,
  Share2,
  Send,
  Tag,
  Users,
  CalendarClock,
  Accessibility,
  MessageCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { JobDetail } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function isDeadlinePassed(deadline: string) {
  return new Date(deadline) < new Date();
}

function buildWaLink(contactWa: string): string {
  const trimmed = contactWa.trim();
  if (trimmed.startsWith('http')) return trimmed;
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  return `https://wa.me/${digits}`;
}

function getDeadlineCountdown(deadline: string) {
  const now = new Date();
  const dl = new Date(deadline);
  const diff = dl.getTime() - now.getTime();

  if (diff <= 0) return 'Ditutup';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days > 30) {
    const months = Math.floor(days / 30);
    return `${months} bulan lagi`;
  }
  if (days > 0) return `${days} hari lagi`;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours > 0) return `${hours} jam lagi`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} menit lagi`;
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

function getEmploymentTypeLabel(type: string) {
  switch (type) {
    case 'full_time': return 'Full Time';
    case 'part_time': return 'Part Time';
    case 'contract': return 'Kontrak';
    case 'internship': return 'Magang';
    default: return type;
  }
}

function getExperienceLevelLabel(level: string) {
  switch (level) {
    case 'entry': return 'Entry Level';
    case 'junior': return 'Junior';
    case 'mid': return 'Mid Level';
    case 'senior': return 'Senior';
    case 'lead': return 'Lead';
    case 'manager': return 'Manager';
    default: return level;
  }
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

export default function JobDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const response = await apiClient.publicJobs.get(params.id as string);

        if (response.error) {
          setError('Lowongan tidak ditemukan');
          return;
        }

        setJob(response.data);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [params.id]);

  const handleApply = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (!job) return;

    setApplyLoading(true);
    try {
      const response = await apiClient.jobs.apply(job.id, {
        cover_letter: coverLetter || undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Berhasil',
        description: 'Lamaran Anda telah berhasil dikirim!',
      });
      setApplyOpen(false);
      setCoverLetter('');
    } catch (err: any) {
      toast({
        title: 'Gagal',
        description: err.message || 'Gagal mengirim lamaran',
        variant: 'destructive',
      });
    } finally {
      setApplyLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title || 'Lowongan Kerja',
          text: `${job?.title} di ${job?.company_name}`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Berhasil',
        description: 'Link lowongan telah disalin ke clipboard',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-48 w-full mb-6 rounded-lg" />
            <Skeleton className="h-64 w-full mb-6 rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Lowongan Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/cari-kerja')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Lowongan
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const workBadge = getWorkTypeBadge(job.work_type);
  const deadlinePassed = isDeadlinePassed(job.deadline_apply);
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const disabilityTypes = job.disability_types
    ? job.disability_types.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  const skills = job.required_skills
    ? job.required_skills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back & Share buttons */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/cari-kerja')}
              className="text-gray-600 hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Lowongan
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
          </div>

          {/* Job Header Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-6">
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={job.company_name}
                    decoding="async"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={workBadge.className}>{workBadge.label}</Badge>
                    <Badge variant="outline">{getEmploymentTypeLabel(job.employment_type)}</Badge>
                    {job.experience_level && (
                      <Badge variant="secondary">{getExperienceLevelLabel(job.experience_level)}</Badge>
                    )}
                    {deadlinePassed && <Badge variant="destructive">Ditutup</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <p className="text-gray-600 mt-1">{job.company_name}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Lokasi</p>
                    <p className="text-sm text-gray-500">{job.location}</p>
                  </div>
                </div>

                {/* Salary */}
                {salary && (
                  <div className="flex items-start gap-3">
                    <Banknote className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Gaji</p>
                      <p className="text-sm text-gray-500">{salary}</p>
                    </div>
                  </div>
                )}

                {/* Deadline */}
                <div className="flex items-start gap-3">
                  <CalendarClock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Batas Lamaran</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(job.deadline_apply)}
                      {' '}
                      <span className={`font-medium ${deadlinePassed ? 'text-red-600' : 'text-green-600'}`}>
                        ({getDeadlineCountdown(job.deadline_apply)})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Company Website */}
                {job.company_website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Website Perusahaan</p>
                      <a
                        href={job.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {job.company_website}
                      </a>
                    </div>
                  </div>
                )}

                {/* View Count */}
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Dilihat</p>
                    <p className="text-sm text-gray-500">{job.view_count} kali</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deskripsi Pekerjaan</h2>
              <div
                className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: job.description }}
              />
            </CardContent>
          </Card>

          {/* Skills Card */}
          {skills.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Keahlian yang Dibutuhkan</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disability Types Card */}
          {disabilityTypes.length > 0 && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Tipe Disabilitas yang Diterima</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {disabilityTypes.map((dt) => (
                    <Badge key={dt} className={`text-sm ${getDisabilityColor(dt)}`}>
                      {dt}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Accessibility Notes Card */}
          {job.accessibility_notes && (
            <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Accessibility className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-lg font-semibold text-gray-900">Dukungan Aksesibilitas</h2>
                </div>
                <p className="text-gray-700 whitespace-pre-line">{job.accessibility_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Apply Button */}
          {!deadlinePassed ? (
            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
              <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full sm:w-auto">
                    <Send className="w-4 h-4 mr-2" />
                    Lamar Sekarang
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lamar Pekerjaan</DialogTitle>
                    <DialogDescription>
                      Kirim lamaran Anda untuk posisi <strong>{job.title}</strong> di <strong>{job.company_name}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Surat Lamaran (Opsional)
                    </label>
                    <Textarea
                      placeholder="Tulis surat lamaran atau pesan untuk perusahaan..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setApplyOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleApply} disabled={applyLoading}>
                      {applyLoading ? 'Mengirim...' : 'Kirim Lamaran'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {job.contact_wa && (
                <a
                  href={buildWaLink(job.contact_wa)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button size="lg" variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Tanya via WhatsApp
                  </Button>
                </a>
              )}
              </div>
              {!user && (
                <p className="text-sm text-gray-500 mt-3">
                  <button
                    onClick={() => router.push('/auth')}
                    className="text-primary hover:underline"
                  >
                    Masuk
                  </button>
                  {' '}untuk melamar pekerjaan ini
                </p>
              )}
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <Clock className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium">Lowongan ini sudah ditutup</p>
                <p className="text-sm text-red-500 mt-1">
                  Batas lamaran berakhir pada {formatDate(job.deadline_apply)}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
