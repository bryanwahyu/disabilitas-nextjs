

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, type Appointment } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

const AppointmentManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: appointments = [], isPending, error: listError } = useQuery({
    queryKey: qk.admin.appointments.list(),
    queryFn: () => unwrap(apiClient.appointments.list()),
  });

  React.useEffect(() => {
    if (!listError) return;
    console.error('Error fetching appointments:', listError);
    toast({
      title: "Error",
      description: "Gagal mengambil data janji temu",
      variant: "destructive",
    });
  }, [listError, toast]);

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ appointmentId, newStatus }: { appointmentId: string; newStatus: AppointmentStatus }) =>
      unwrap(apiClient.appointments.update(appointmentId, { status: newStatus })),
    onSuccess: (_data, { newStatus }) => {
      toast({
        title: "Berhasil",
        description: `Status janji temu berhasil diubah menjadi ${newStatus}`,
      });
      queryClient.invalidateQueries({ queryKey: qk.admin.appointments.lists() });
    },
    onError: (error) => {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status janji temu",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentStatus = (appointmentId: string, newStatus: AppointmentStatus) =>
    updateStatus({ appointmentId, newStatus });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Menunggu', variant: 'secondary' as const },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
      completed: { label: 'Selesai', variant: 'outline' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const },
    };

    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  const getStatusActions = (appointment: Appointment) => {
    const actions: React.ReactNode[] = [];

    if (appointment.status === 'pending') {
      actions.push(
        <Button
          key="confirm"
          size="sm"
          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
        >
          Konfirmasi
        </Button>
      );
      actions.push(
        <Button
          key="cancel"
          size="sm"
          variant="destructive"
          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
        >
          Batalkan
        </Button>
      );
    } else if (appointment.status === 'confirmed') {
      actions.push(
        <Button
          key="complete"
          size="sm"
          variant="outline"
          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
        >
          Selesai
        </Button>
      );
    }

    return actions;
  };

  if (isPending) {
    return <div className="text-center py-8">Memuat data janji temu...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manajemen Janji Temu</CardTitle>
        <CardDescription>
          Kelola dan pantau semua janji temu terapi
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada janji temu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        Janji Temu #{appointment.id.slice(0, 8)}
                      </h3>
                      <Badge variant={getStatusBadge(appointment.status ?? 'pending').variant}>
                        {getStatusBadge(appointment.status ?? 'pending').label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{appointment.user_name || `User ${appointment.user_id.slice(0, 8)}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(appointment.start_at).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {new Date(appointment.start_at).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{appointment.provider_name || `Provider ${appointment.provider_id.slice(0, 8)}`}</span>
                        </div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                          <strong>Catatan:</strong> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {getStatusActions(appointment)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentManager;
