
import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  GraduationCap,
  Building2,
  MapPin,
  Eye,
  Globe,
  Banknote,
  Share2,
  Send,
  Users,
  CalendarDays,
  Award,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { disabilityBadgeClass, disabilityLabel, parseDisabilityCSV } from '@/lib/disability';

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

const getDisabilityColor = disabilityBadgeClass;

export default function TrainingDetailClient() {
  const params = useParams({ strict: false });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [motivation, setMotivation] = useState('');

  const trainingId = params.id as string;

  const { data: training, isPending: loading, isError } = useQuery({
    queryKey: qk.trainings.detail(trainingId),
    queryFn: () => unwrap(apiClient.publicTrainings.get(trainingId)),
    enabled: !!trainingId,
  });

  const error = isError ? 'Pelatihan tidak ditemukan' : null;

  const { mutate: register, isPending: registerLoading } = useMutation({
    mutationFn: (id: string) =>
      unwrap(apiClient.trainings.register(id, { motivation: motivation || undefined })),
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Pendaftaran pelatihan Anda telah berhasil dikirim!',
      });
      setRegisterOpen(false);
      setMotivation('');
    },
    onError: (err: Error) => {
      toast({
        title: 'Gagal',
        description: err.message || 'Gagal mendaftar pelatihan',
        variant: 'destructive',
      });
    },
  });

  const handleRegister = () => {
    if (!user) {
      navigate({ to: '/auth' });
      return;
    }
    if (!training) return;
    register(training.id);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: training?.title || 'Pelatihan Skill',
          text: `${training?.title} oleh ${training?.organizer_name}`,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'Berhasil',
        description: 'Link pelatihan telah disalin ke clipboard',
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

  if (error || !training) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Pelatihan Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => navigate({ to: '/pelatihan' })}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Pelatihan
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const categoryBadge = getCategoryBadge(training.category);
  const typeBadge = getTrainingTypeBadge(training.training_type);
  const disabilityTypes = parseDisabilityCSV(training.disability_types);
  const spotsRemaining = training.max_participants != null && training.registration_count != null
    ? training.max_participants - training.registration_count
    : null;
  const isFull = spotsRemaining !== null && spotsRemaining <= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back & Share buttons */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate({ to: '/pelatihan' })}
              className="text-gray-600 hover:text-primary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Pelatihan
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
          </div>

          {/* Training Header Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-6">
                {training.organizer_logo ? (
                  <img
                    src={training.organizer_logo}
                    alt={training.organizer_name}
                    decoding="async"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={categoryBadge.className}>{categoryBadge.label}</Badge>
                    <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                    {training.skill_level && (
                      <Badge variant="secondary">{getSkillLevelLabel(training.skill_level)}</Badge>
                    )}
                    {training.certificate && (
                      <Badge className="bg-amber-100 text-amber-800">
                        <Award className="w-3 h-3 mr-1" />
                        Bersertifikat
                      </Badge>
                    )}
                    {isFull && <Badge variant="destructive">Kuota Penuh</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{training.title}</h1>
                  <p className="text-gray-600 mt-1">{training.organizer_name}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                {/* Location */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Lokasi</p>
                    <p className="text-sm text-gray-500">
                      {training.training_type === 'online'
                        ? 'Online'
                        : training.location || 'Lokasi belum ditentukan'}
                    </p>
                  </div>
                </div>

                {/* Date Range */}
                <div className="flex items-start gap-3">
                  <CalendarDays className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Jadwal</p>
                    <p className="text-sm text-gray-500">{formatDateRange(training.start_date, training.end_date)}</p>
                  </div>
                </div>

                {/* Schedule Info */}
                {training.schedule_info && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Info Jadwal</p>
                      <p className="text-sm text-gray-500">{training.schedule_info}</p>
                    </div>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-start gap-3">
                  <Banknote className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Biaya</p>
                    <p className={`text-sm ${training.is_free ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                      {formatPrice(training.price, training.is_free, training.price_currency)}
                    </p>
                  </div>
                </div>

                {/* Capacity */}
                {training.max_participants != null && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Kapasitas</p>
                      <p className="text-sm text-gray-500">
                        {training.registration_count || 0} / {training.max_participants} peserta
                        {spotsRemaining !== null && spotsRemaining > 0 && (
                          <span className="text-green-600 font-medium"> ({spotsRemaining} kursi tersisa)</span>
                        )}
                        {isFull && (
                          <span className="text-red-600 font-medium"> (Kuota penuh)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Organizer Website */}
                {training.organizer_website && (
                  <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Website Penyelenggara</p>
                      <a
                        href={training.organizer_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {training.organizer_website}
                      </a>
                    </div>
                  </div>
                )}

                {/* Training URL */}
                {training.training_url && (
                  <div className="flex items-start gap-3">
                    <ExternalLink className="w-5 h-5 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Link Pelatihan</p>
                      <a
                        href={training.training_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Buka halaman pelatihan
                      </a>
                    </div>
                  </div>
                )}

                {/* View Count */}
                <div className="flex items-start gap-3">
                  <Eye className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Dilihat</p>
                    <p className="text-sm text-gray-500">{training.view_count} kali</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deskripsi Pelatihan</h2>
              <div
                className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: training.description }}
              />
            </CardContent>
          </Card>

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
                      {disabilityLabel(dt)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Register Button */}
          {!isFull ? (
            <div className="border-t pt-6">
              <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full sm:w-auto">
                    <Send className="w-4 h-4 mr-2" />
                    Daftar Pelatihan
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Daftar Pelatihan</DialogTitle>
                    <DialogDescription>
                      Daftarkan diri Anda untuk pelatihan <strong>{training.title}</strong> oleh <strong>{training.organizer_name}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivasi (Opsional)
                    </label>
                    <Textarea
                      placeholder="Tuliskan motivasi Anda mengikuti pelatihan ini..."
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      rows={6}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRegisterOpen(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleRegister} disabled={registerLoading}>
                      {registerLoading ? 'Mendaftar...' : 'Kirim Pendaftaran'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {!user && (
                <p className="text-sm text-gray-500 mt-3">
                  <button
                    onClick={() => navigate({ to: '/auth' })}
                    className="text-primary hover:underline"
                  >
                    Masuk
                  </button>
                  {' '}untuk mendaftar pelatihan ini
                </p>
              )}
            </div>
          ) : (
            <div className="border-t pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <Users className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium">Kuota pelatihan sudah penuh</p>
                <p className="text-sm text-red-500 mt-1">
                  Seluruh {training.max_participants} kursi telah terisi
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
