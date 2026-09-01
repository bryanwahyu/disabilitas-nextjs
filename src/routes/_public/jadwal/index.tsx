
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
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { Appointment } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useProviderNames } from '@/hooks/useProviderNames';

export const Route = createFileRoute('/_public/jadwal/')({
  /*
   * Halaman akun: `noindex, nofollow`.
   *
   * Isinya milik satu pengguna dan tidak pernah berguna di hasil pencarian.
   * Sebelumnya tak ada `head` sama sekali, jadi tab browser menampilkan judul
   * default root — sulit dibedakan saat pengguna membuka banyak tab.
   */
  head: () => ({
    meta: [
      { title: 'Jadwal Saya | DisabilitasKu' },
      { name: 'description', content: 'Lihat dan kelola jadwal janji temu Anda.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: JadwalPage,
});


function JadwalPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upcoming');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: '/auth' });
  }, [user, authLoading, navigate]);

  const { data: appointments = [], isPending, error: listError } = useQuery({
    queryKey: qk.appointments.list(),
    queryFn: () => unwrap(apiClient.appointments.list()),
    enabled: !!user,
  });

  const providerNames = useProviderNames(appointments.map((a) => a.provider_id));

  useEffect(() => {
    if (!listError) return;
    toast({
      title: 'Error',
      description: listError.message || 'Gagal memuat jadwal',
      variant: 'destructive',
    });
  }, [listError, toast]);

  const cancelMutation = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.appointments.update(id, { status: 'cancelled' })),
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Jadwal telah dibatalkan',
      });
      queryClient.invalidateQueries({ queryKey: qk.appointments.all() });
    },
    onError: (err: Error) => {
      toast({
        title: 'Gagal',
        description: err.message || 'Gagal membatalkan jadwal',
        variant: 'destructive',
      });
    },
  });

  const handleCancelAppointment = (id: string) => cancelMutation.mutate(id);

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.start_at) >= now && a.status !== 'cancelled'
  );
  const pastAppointments = appointments.filter(
    (a) => new Date(a.start_at) < now || a.status === 'completed'
  );
  const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled');

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
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-10 w-48 mb-6" />
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
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Jadwal Saya</h1>
              <p className="text-gray-600 mt-1">Kelola jadwal konsultasi dan terapi Anda</p>
            </div>
            <Button onClick={() => navigate({ to: '/layanan' })}>
              <Plus className="w-4 h-4 mr-2" />
              Buat Jadwal
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full mb-6">
              <TabsTrigger value="upcoming" className="flex-1">
                Akan Datang ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Riwayat ({pastAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex-1">
                Dibatalkan ({cancelledAppointments.length})
              </TabsTrigger>
            </TabsList>

            {/* Upcoming */}
            <TabsContent value="upcoming">
              {upcomingAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tidak Ada Jadwal
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Anda belum memiliki jadwal konsultasi yang akan datang.
                    </p>
                    <Button onClick={() => navigate({ to: '/layanan' })}>
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Jadwal Baru
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      therapistName={providerNames[appointment.provider_id]}
                      onCancel={() => handleCancelAppointment(appointment.id)}
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Past */}
            <TabsContent value="past">
              {pastAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
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
                  {pastAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      therapistName={providerNames[appointment.provider_id]}
                      isPast
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Cancelled */}
            <TabsContent value="cancelled">
              {cancelledAppointments.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tidak Ada Pembatalan
                    </h3>
                    <p className="text-gray-500">
                      Jadwal yang dibatalkan akan muncul di sini.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {cancelledAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      therapistName={providerNames[appointment.provider_id]}
                      isPast
                      getStatusBadge={getStatusBadge}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function AppointmentCard({
  appointment,
  therapistName,
  isPast = false,
  onCancel,
  getStatusBadge,
  formatDate,
  formatTime,
}: {
  appointment: Appointment;
  /** Nama provider; appointment hanya menyimpan `provider_id`. */
  therapistName?: string;
  isPast?: boolean;
  onCancel?: () => void;
  getStatusBadge: (status: string) => React.ReactNode;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Date */}
          <div className="flex items-center gap-3 md:w-48">
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

          {/* Therapist & Details */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">
                {therapistName || 'Terapis'}
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
          {!isPast && appointment.status !== 'cancelled' && onCancel && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-red-600 hover:text-red-700"
              >
                Batalkan
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
