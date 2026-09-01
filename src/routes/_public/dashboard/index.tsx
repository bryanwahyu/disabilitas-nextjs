
import { useEffect, useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Clock,
  User,
  Video,
  Phone,
  CheckCircle,
  XCircle,
  Users,
  CalendarPlus,
  MapPin,
  TrendingUp,
  GraduationCap,
  Briefcase,
  Settings,
  Stethoscope,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { AppointmentWithParties } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList, Star, Activity } from 'lucide-react';

export const Route = createFileRoute('/_public/dashboard/')({
  /*
   * Halaman akun: `noindex, nofollow`.
   *
   * Isinya milik satu pengguna dan tidak pernah berguna di hasil pencarian.
   * Sebelumnya tak ada `head` sama sekali, jadi tab browser menampilkan judul
   * default root — sulit dibedakan saat pengguna membuka banyak tab.
   */
  head: () => ({
    meta: [
      { title: 'Dashboard Terapis | DisabilitasKu' },
      { name: 'description', content: 'Kelola janji temu, catatan sesi, dan jadwal Anda.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: DashboardPage,
});


function DashboardPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');
  const [sessionNoteAppt, setSessionNoteAppt] = useState<AppointmentWithParties | null>(null);
  const [clinicalAppt, setClinicalAppt] = useState<AppointmentWithParties | null>(null);
  const queryClient = useQueryClient();

  const isTherapist = user?.role === 'therapy' || user?.role === 'therapist_independent';

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate({ to: '/auth' });
      return;
    }

    if (!isTherapist) {
      navigate({ to: '/jadwal' });
    }
  }, [user, authLoading, navigate, isTherapist]);

  const {
    data: appointments = [],
    isPending,
    error: listError,
  } = useQuery({
    queryKey: qk.appointments.list(),
    queryFn: () => unwrap(apiClient.appointments.list()),
    enabled: !!user && isTherapist,
  });

  useEffect(() => {
    if (!listError) return;
    toast({
      title: 'Error',
      description: listError.message || 'Gagal memuat jadwal',
      variant: 'destructive',
    });
  }, [listError, toast]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'confirmed' | 'cancelled' | 'completed' }) =>
      unwrap(apiClient.appointments.update(id, { status })),
    onSuccess: (_data, { status }) => {
      const statusLabels = {
        confirmed: 'dikonfirmasi',
        cancelled: 'dibatalkan',
        completed: 'diselesaikan',
      };

      toast({
        title: 'Berhasil',
        description: `Jadwal telah ${statusLabels[status]}`,
      });

      queryClient.invalidateQueries({ queryKey: qk.appointments.all() });
    },
    onError: (err: Error) => {
      toast({
        title: 'Gagal',
        description: err.message || 'Gagal memperbarui status',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateStatus = (id: string, status: 'confirmed' | 'cancelled' | 'completed') => {
    updateStatusMutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Dikonfirmasi</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Selesai</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const now = new Date();
  const pendingAppointments = appointments.filter((a) => a.status === 'pending');
  const confirmedAppointments = appointments.filter(
    (a) => a.status === 'confirmed' && new Date(a.start_at) >= now
  );
  const completedAppointments = appointments.filter(
    (a) => a.status === 'completed' || (a.status === 'confirmed' && new Date(a.start_at) < now)
  );

  // Stats
  const todayAppointments = appointments.filter(
    (a) => {
      const apptDate = new Date(a.start_at);
      return apptDate.toDateString() === now.toDateString() && a.status !== 'cancelled';
    }
  );

  /*
   * `!user` ikut menahan render.
   *
   * Token sesi ada di localStorage, jadi server tidak bisa tahu siapa yang
   * meminta halaman ini — guard-nya wajib di klien. Tanpa `!user` di sini,
   * halaman sempat merender penuh dulu sebelum `useEffect` memantulkan tamu
   * ke /auth: kerangka dashboard berkedip untuk orang yang belum masuk.
   */
  if (!user || authLoading || isPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-10 w-48 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-12 w-full mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {user?.role === 'therapist_independent' ? 'Dashboard Terapis' : 'Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">Kelola layanan dan klien Anda</p>
            </div>
            <Button variant="outline" onClick={() => navigate({ to: '/profil' })}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Profil
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate({ to: '/profil' })}
            >
              <Stethoscope className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">Profil Terapis</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate({ to: '/jadwal' })}
            >
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">Atur Jadwal</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 hover:border-primary hover:bg-primary/5"
              onClick={() => navigate({ to: '/acara' })}
            >
              <CalendarPlus className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium">Buat Acara</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 hover:border-green-600 hover:bg-green-50"
              onClick={() => navigate({ to: '/pelatihan' })}
            >
              <GraduationCap className="w-5 h-5 text-green-600" />
              <span className="text-xs font-medium">Buat Pelatihan</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50"
              onClick={() => navigate({ to: '/komunitas' })}
            >
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-medium">Komunitas</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 hover:border-violet-600 hover:bg-violet-50"
              onClick={() => navigate({ to: '/forum' })}
            >
              <Users className="w-5 h-5 text-violet-600" />
              <span className="text-xs font-medium">Forum</span>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</p>
                    <p className="text-sm text-gray-500">Menunggu Konfirmasi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{confirmedAppointments.length}</p>
                    <p className="text-sm text-gray-500">Terkonfirmasi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{todayAppointments.length}</p>
                    <p className="text-sm text-gray-500">Jadwal Hari Ini</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{completedAppointments.length}</p>
                    <p className="text-sm text-gray-500">Total Selesai</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="pending" className="flex-1">
                Menunggu ({pendingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="confirmed" className="flex-1">
                Terkonfirmasi ({confirmedAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                Riwayat ({completedAppointments.length})
              </TabsTrigger>
            </TabsList>

            {/* Pending */}
            <TabsContent value="pending">
              {pendingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tidak Ada Permintaan
                    </h3>
                    <p className="text-gray-500">
                      Belum ada permintaan jadwal yang perlu dikonfirmasi.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pendingAppointments.map((appointment) => (
                    <TherapistAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onConfirm={() => handleUpdateStatus(appointment.id, 'confirmed')}
                      onCancel={() => handleUpdateStatus(appointment.id, 'cancelled')}
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Confirmed */}
            <TabsContent value="confirmed">
              {confirmedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tidak Ada Jadwal
                    </h3>
                    <p className="text-gray-500">
                      Belum ada jadwal yang terkonfirmasi.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {confirmedAppointments.map((appointment) => (
                    <TherapistAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onComplete={() => handleUpdateStatus(appointment.id, 'completed')}
                      onCancel={() => handleUpdateStatus(appointment.id, 'cancelled')}
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      showComplete
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Completed */}
            <TabsContent value="completed">
              {completedAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Belum Ada Riwayat
                    </h3>
                    <p className="text-gray-500">
                      Riwayat konsultasi Anda akan muncul di sini.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {completedAppointments.map((appointment) => (
                    <TherapistAppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      isPast
                      onWriteSessionNote={() => setSessionNoteAppt(appointment)}
                      onClinicalAssessment={() => setClinicalAppt(appointment)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <SessionNoteDialog
        appointment={sessionNoteAppt}
        onClose={() => setSessionNoteAppt(null)}
      />

      <ClinicalAssessmentDialog
        appointment={clinicalAppt}
        onClose={() => setClinicalAppt(null)}
      />
    </div>
  );
}

/** Daftar anak milik pemesan jadwal — dipakai dua dialog, jadi cache-nya dibagi. */
function useAppointmentChildren(appointment: AppointmentWithParties | null) {
  return useQuery({
    queryKey: qk.appointments.sub(appointment?.id ?? '', 'children'),
    queryFn: () => unwrap(apiClient.children.forAppointment(appointment!.id)),
    enabled: !!appointment,
  });
}

function SessionNoteDialog({
  appointment,
  onClose,
}: {
  appointment: AppointmentWithParties | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [childId, setChildId] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [activity, setActivity] = useState('');
  const [observation, setObservation] = useState('');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');

  const { data: children = [], isPending: loadingChildren } = useAppointmentChildren(appointment);

  useEffect(() => {
    if (!appointment) return;
    setChildId('');
    setActivity('');
    setObservation('');
    setRating(0);
    setNotes('');
    const apptDate = new Date(appointment.start_at);
    setSessionDate(isNaN(apptDate.getTime()) ? '' : apptDate.toISOString().slice(0, 10));
  }, [appointment]);

  // Kalau klien hanya punya satu anak, tidak perlu memilih.
  useEffect(() => {
    if (children.length === 1) setChildId(children[0].id);
  }, [children]);

  const saveMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      unwrap(
        apiClient.children.createSessionNote(appointmentId, {
          child_id: childId,
          session_date: sessionDate || undefined,
          activity,
          observation: observation || undefined,
          progress_rating: rating,
          notes: notes || undefined,
        })
      ),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Catatan sesi tersimpan' });
      queryClient.invalidateQueries({ queryKey: qk.children.all() });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal menyimpan catatan sesi',
        variant: 'destructive',
      });
    },
  });

  const saving = saveMutation.isPending;

  const handleSubmit = () => {
    if (!appointment) return;
    if (!childId) {
      toast({ title: 'Error', description: 'Pilih anak terlebih dahulu', variant: 'destructive' });
      return;
    }
    if (!activity) {
      toast({ title: 'Error', description: 'Aktivitas sesi harus diisi', variant: 'destructive' });
      return;
    }
    if (rating < 1 || rating > 5) {
      toast({ title: 'Error', description: 'Beri penilaian kemajuan 1-5', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(appointment.id);
  };

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Catat Sesi Terapi</DialogTitle>
          <DialogDescription>
            Catatan ini akan terlihat oleh orang tua di timeline perkembangan anak
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Anak *</Label>
            {loadingChildren ? (
              <p className="text-sm text-gray-500">Memuat daftar anak...</p>
            ) : children.length === 0 ? (
              <p className="text-sm text-gray-500">
                Klien belum menambahkan profil anak. Minta orang tua mengisi menu
                &quot;Anak Saya&quot; terlebih dahulu.
              </p>
            ) : (
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger aria-label="Pilih anak">
                  <SelectValue placeholder="Pilih anak" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_date">Tanggal Sesi</Label>
            <Input
              id="session_date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_activity">Aktivitas *</Label>
            <Textarea
              id="session_activity"
              placeholder="Apa yang dilakukan selama sesi"
              rows={2}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_observation">Observasi</Label>
            <Textarea
              id="session_observation"
              placeholder="Respon dan perkembangan yang terlihat"
              rows={2}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Penilaian Kemajuan *</Label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Penilaian kemajuan 1 sampai 5">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={rating === i}
                  aria-label={`${i} dari 5`}
                  onClick={() => setRating(i)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Star
                    className={`h-6 w-6 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="session_notes">Catatan untuk Orang Tua</Label>
            <Textarea
              id="session_notes"
              placeholder="Saran latihan di rumah, hal yang perlu diperhatikan"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={saving || children.length === 0}>
            {saving ? 'Menyimpan...' : 'Simpan Catatan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CLINICAL_DOMAINS: { key: string; label: string }[] = [
  { key: 'motorik_kasar', label: 'Motorik Kasar' },
  { key: 'motorik_halus', label: 'Motorik Halus' },
  { key: 'bicara_bahasa', label: 'Bicara & Bahasa' },
  { key: 'sosialisasi_kemandirian', label: 'Sosial & Kemandirian' },
];

function ClinicalAssessmentDialog({
  appointment,
  onClose,
}: {
  appointment: AppointmentWithParties | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [childId, setChildId] = useState('');
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(CLINICAL_DOMAINS.map((d) => [d.key, 70]))
  );
  const [notes, setNotes] = useState('');

  const { data: children = [], isPending: loadingChildren } = useAppointmentChildren(appointment);

  useEffect(() => {
    if (!appointment) return;
    setChildId('');
    setNotes('');
    setScores(Object.fromEntries(CLINICAL_DOMAINS.map((d) => [d.key, 70])));
  }, [appointment]);

  useEffect(() => {
    if (children.length === 1) setChildId(children[0].id);
  }, [children]);

  const saveMutation = useMutation({
    mutationFn: (appointmentId: string) =>
      unwrap(
        apiClient.children.createClinicalAssessment(appointmentId, {
          child_id: childId,
          domain_scores: scores,
          notes: notes || undefined,
        })
      ),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Penilaian perkembangan tersimpan' });
      queryClient.invalidateQueries({ queryKey: qk.children.all() });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Gagal',
        description: error.message || 'Gagal menyimpan penilaian',
        variant: 'destructive',
      });
    },
  });

  const saving = saveMutation.isPending;

  const handleSubmit = () => {
    if (!appointment) return;
    if (!childId) {
      toast({ title: 'Error', description: 'Pilih anak terlebih dahulu', variant: 'destructive' });
      return;
    }
    saveMutation.mutate(appointment.id);
  };

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Penilaian Perkembangan</DialogTitle>
          <DialogDescription>
            Skor tiap domain (0-100) akan tampil sebagai grafik profil perkembangan di dashboard orang tua
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Anak *</Label>
            {loadingChildren ? (
              <p className="text-sm text-gray-500">Memuat daftar anak...</p>
            ) : children.length === 0 ? (
              <p className="text-sm text-gray-500">
                Klien belum menambahkan profil anak.
              </p>
            ) : (
              <Select value={childId} onValueChange={setChildId}>
                <SelectTrigger aria-label="Pilih anak">
                  <SelectValue placeholder="Pilih anak" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {CLINICAL_DOMAINS.map((d) => (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label>{d.label}</Label>
                <span className="text-sm font-medium text-gray-700">{scores[d.key]}</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={scores[d.key]}
                onChange={(e) => setScores((s) => ({ ...s, [d.key]: Number(e.target.value) }))}
                className="w-full accent-teal-600"
                aria-label={`Skor ${d.label}`}
              />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="clinical_notes">Catatan</Label>
            <Textarea
              id="clinical_notes"
              placeholder="Ringkasan observasi perkembangan"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Batal</Button>
          <Button onClick={handleSubmit} disabled={saving || children.length === 0}>
            {saving ? 'Menyimpan...' : 'Simpan Penilaian'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TherapistAppointmentCard({
  appointment,
  isPast = false,
  showComplete = false,
  onConfirm,
  onComplete,
  onCancel,
  onWriteSessionNote,
  onClinicalAssessment,
  getStatusBadge,
  formatDate,
  formatTime,
}: {
  appointment: AppointmentWithParties;
  isPast?: boolean;
  showComplete?: boolean;
  onConfirm?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  onWriteSessionNote?: () => void;
  onClinicalAssessment?: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}) {
  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'zoom':
      case 'meet':
        return <Video className="w-4 h-4" />;
      case 'call':
        return <Phone className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Date */}
          <div className="flex items-center gap-3 md:w-56">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {formatDate(appointment.start_at)}
              </p>
              <p className="text-sm text-gray-500">
                {formatTime(appointment.start_at)}
              </p>
            </div>
          </div>

          {/* Client & Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">
                {appointment.user_name || 'Klien'}
              </span>
              {getStatusBadge(appointment.status || 'pending')}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(appointment.start_at)} – {formatTime(appointment.end_at)}
              </span>
              {appointment.notes && (
                <span className="truncate max-w-xs">{appointment.notes}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          {isPast && (onWriteSessionNote || onClinicalAssessment) && (
            <div className="flex gap-2">
              {onWriteSessionNote && (
                <Button variant="outline" size="sm" onClick={onWriteSessionNote}>
                  <ClipboardList className="w-4 h-4 mr-1" />
                  Catat Sesi
                </Button>
              )}
              {onClinicalAssessment && (
                <Button variant="outline" size="sm" onClick={onClinicalAssessment}>
                  <Activity className="w-4 h-4 mr-1" />
                  Penilaian
                </Button>
              )}
            </div>
          )}
          {!isPast && (
            <div className="flex gap-2">
              {appointment.status === 'pending' && onConfirm && (
                <>
                  <Button size="sm" onClick={onConfirm}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Konfirmasi
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCancel}
                    className="text-red-600 hover:text-red-700"
                  >
                    Tolak
                  </Button>
                </>
              )}
              {showComplete && appointment.status === 'confirmed' && (
                <>
                  <Button size="sm" onClick={onComplete}>
                    Selesai
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
