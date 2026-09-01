import { useState } from 'react';
import { appointmentService } from '@/lib/api/services/appointmentService';
import type { Appointment, AppointmentInsert, AppointmentUpdate } from '@/lib/api/client';

interface AppointmentState {
  appointment: Appointment | null;
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
}

export const useAppointment = () => {
  const [appointmentState, setAppointmentState] = useState<AppointmentState>({
    appointment: null,
    appointments: [],
    isLoading: false,
    error: null,
  });

  const fetchAppointment = async (id: string) => {
    setAppointmentState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await appointmentService.getAppointment(id);
      const errorMessage = response.error;
      if (errorMessage) {
        setAppointmentState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      setAppointmentState(prev => ({ ...prev, isLoading: false, appointment: response.data as Appointment }));
      return response;
    } catch (error: any) {
      setAppointmentState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  };

  const fetchAppointments = async () => {
    setAppointmentState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await appointmentService.listAppointments();
      const errorMessage = response.error;
      if (errorMessage) {
        setAppointmentState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      setAppointmentState(prev => ({
        ...prev,
        isLoading: false,
        appointments: (response.data || []) as Appointment[]
      }));
      return response;
    } catch (error: any) {
      setAppointmentState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  };

  const fetchUserAppointments = async (userId: string) => {
    setAppointmentState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await appointmentService.getUserAppointments(userId);
      const errorMessage = response.error;
      if (errorMessage) {
        setAppointmentState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      setAppointmentState(prev => ({
        ...prev,
        isLoading: false,
        appointments: (response.data || []) as Appointment[]
      }));
      return response;
    } catch (error: any) {
      setAppointmentState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  };

  const fetchTherapistAppointments = async (therapistId: string) => {
    setAppointmentState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await appointmentService.getTherapistAppointments(therapistId);
      const errorMessage = response.error;
      if (errorMessage) {
        setAppointmentState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      setAppointmentState(prev => ({
        ...prev,
        isLoading: false,
        appointments: (response.data || []) as Appointment[]
      }));
      return response;
    } catch (error: any) {
      setAppointmentState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  };

  const createAppointment = async (data: AppointmentInsert) => {
    setAppointmentState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await appointmentService.createAppointment(data);
      const errorMessage = response.error;
      if (errorMessage) {
        setAppointmentState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      // Add the new appointment to the list
      setAppointmentState(prev => ({
        ...prev,
        isLoading: false,
        appointments: [...prev.appointments, response.data as Appointment]
      }));
      return response;
    } catch (error: any) {
      setAppointmentState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  };

  const updateAppointment = async (id: string, data: AppointmentUpdate) => {
    setAppointmentState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await appointmentService.updateAppointment(id, data);
      const errorMessage = response.error;
      if (errorMessage) {
        setAppointmentState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      // Update the appointment in the list
      setAppointmentState(prev => ({
        ...prev,
        isLoading: false,
        appointments: prev.appointments.map((app) =>
          app.id === id ? (response.data as Appointment) : app
        )
      }));
      return response;
    } catch (error: any) {
      setAppointmentState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  };

  const deleteAppointment = async (id: string) => {
    setAppointmentState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await appointmentService.deleteAppointment(id);
      const errorMessage = response.error;
      if (errorMessage) {
        setAppointmentState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      // Remove the appointment from the list
      setAppointmentState(prev => ({ 
        ...prev, 
        isLoading: false, 
        appointments: prev.appointments.filter(app => app.id !== id) 
      }));
      return response;
    } catch (error: any) {
      setAppointmentState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  };

  return {
    ...appointmentState,
    fetchAppointment,
    fetchAppointments,
    fetchUserAppointments,
    fetchTherapistAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
};
