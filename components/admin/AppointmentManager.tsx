'use client';


import React, { useState, useEffect } from 'react';
import { apiClient, type Appointment } from '@/lib/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AppointmentManager = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await apiClient.appointments.list();

      if (error) throw new Error(error);
      setAppointments(data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Gagal mengambil data janji temu",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await apiClient.appointments.update(appointmentId, { status: newStatus });

      if (error) throw new Error(error);

      toast({
        title: "Berhasil",
        description: `Status janji temu berhasil diubah menjadi ${newStatus}`,
      });

      fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status janji temu",
        variant: "destructive",
      });
    }
  };

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
    const actions = [];

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

  if (loading) {
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
                          <span>User ID: {appointment.user_id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(appointment.appointment_date).toLocaleDateString('id-ID', {
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
                            {new Date(appointment.appointment_date).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>Provider ID: {appointment.therapist_id}</span>
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
