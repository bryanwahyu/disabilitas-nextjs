import { env } from '@/lib/env';

const BASE = env.apiBaseUrl;

function token() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('yayasan_token') ?? '';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request gagal');
  return json.data as T;
}

async function getList<T>(path: string): Promise<{ data: T[]; meta: { total: number } }> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request gagal');
  return { data: json.data ?? [], meta: json.meta ?? { total: 0 } };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request gagal');
  return json.data as T;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request gagal');
  return json.data as T;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request gagal');
  return json.data as T;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message ?? 'Request gagal');
  return json.data as T;
}

export interface MeUser {
  ID: string;
  Email: string;
  Role: string;
  Profile?: {
    FullName?: string;
    Phone?: string;
    City?: string;
    Bio?: string;
    CompanyWebsite?: string;
  };
}

export interface Location {
  id: string;
  name: string;
  type?: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  city_code?: string;
  city_name?: string;
  is_verified: boolean;
  provider_user_id: string;
  services: string[];
  consultation_methods?: string;
}

/** Mode layanan platform — hanya tiga ini. */
export const SERVICE_MODES: { value: string; label: string }[] = [
  { value: 'onsite', label: 'Tatap muka di tempat terapis' },
  { value: 'home_visit', label: 'Tatap muka ke rumah' },
  { value: 'chat', label: 'Chat' },
];
export const SERVICE_MODE_LABEL: Record<string, string> = Object.fromEntries(
  SERVICE_MODES.map(m => [m.value, m.label]),
);

export interface Affiliation {
  id: string;
  location_id: string;
  therapist_id: string;
  status: string;
  invited_by: string;
  therapist_name?: string;
  therapist_email: string;
  location_name: string;
  created_at: string;
}

// Appointment mengikuti `internal/domain/appointments/entity.go`.
//
// Dulu sebagian field PascalCase karena entity Go-nya belum punya `json` tag.
// Tag itu sudah dipasang (2026-08-23) sehingga seluruh field kini snake_case,
// sama dengan endpoint lain. `user_name`/`provider_name` dilengkapi backend di
// endpoint daftar supaya portal tidak perlu menebak nama dari id.
export interface Appointment {
  id: string;
  user_id: string;
  provider_id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes?: string;
  cancelled_reason?: string;
  created_at: string;
  user_name?: string;
  provider_name?: string;
}

export interface Training {
  id: string;
  title: string;
  description: string;
  category: string;
  training_type: string;
  start_date: string;
  end_date?: string;
  max_participants?: number;
  price: number;
  is_free: boolean;
  status: string;
  reject_reason?: string;
  created_by: string;
  created_at: string;
}

export interface CreatedTherapist {
  id: string;
  email: string;
  password: string;
  full_name: string;
  location_id: string;
  affiliation_status: string;
}

export interface EventRequest {
  id: string;
  title: string;
  description?: string;
  mode: string;
  start_at: string;
  end_at: string;
  location?: string;
  capacity?: number;
  status: string;
  requested_by: string;
  created_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  target_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}

export interface ScheduleSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ScheduleSaveInput {
  slot_duration_minutes?: number;
  slots: { day_of_week: number; start_time: string; end_time: string }[];
}

export interface ScheduleDetail {
  schedule: {
    id: string;
    therapist_id: string;
    slot_duration_minutes: number;
    is_active: boolean;
  };
  slots: ScheduleSlot[];
}

export type PriceItemType = 'therapy_service' | 'training';
export type PriceStatus = 'pending' | 'approved' | 'rejected';

export interface PriceItem {
  id: string;
  yayasan_id: string;
  item_type: PriceItemType;
  item_ref_id: string;
  harga_dasar: number;
  harga_jual?: number | null;
  komisi?: number | null;
  status: PriceStatus;
  admin_note?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const api = {
  getMe: () => get<MeUser>('/me'),

  // Harga (markup admin): yayasan ajukan harga dasar, admin set harga jual & komisi.
  getPrices: () => get<PriceItem[]>('/yayasan/prices'),
  createPrice: (body: { item_type: PriceItemType; item_ref_id: string; harga_dasar: number }) =>
    post<PriceItem>('/yayasan/prices', body),
  updatePrice: (id: string, harga_dasar: number) =>
    put<PriceItem>(`/yayasan/prices/${id}`, { harga_dasar }),

  // Locations
  getLocations: (providerID: string) =>
    getList<Location>(`/therapy/locations?provider_id=${providerID}&limit=100`),
  createLocation: (body: object) => post<Location>('/therapy/locations', body),
  updateLocation: (id: string, body: object) => patch<Location>(`/therapy/locations/${id}`, body),
  deleteLocation: (id: string) => del<{ id: string }>(`/therapy/locations/${id}`),

  // Affiliations
  getLocationTherapists: (locationId: string) =>
    get<Affiliation[]>(`/therapy/locations/${locationId}/therapists`),
  inviteTherapist: (body: { location_id: string; therapist_id: string }) =>
    post<Affiliation>('/affiliations/invite', body),
  removeAffiliation: (id: string) => del<{ deleted: boolean }>(`/affiliations/${id}`),
  createTherapist: (body: { email: string; password: string; full_name: string; location_id: string }) =>
    post<CreatedTherapist>('/yayasan/therapists', body),

  // Appointments
  getAppointments: () => getList<Appointment>('/appointments?limit=100'),
  updateAppointment: (id: string, status: string) =>
    put<Appointment>(`/appointments/${id}`, { status }),

  // Trainings
  getMyTrainings: () => getList<Training>('/me/trainings?limit=100'),
  createTraining: (body: object) => post<Training>('/trainings', body),
  submitTraining: (id: string) => patch<Training>(`/trainings/${id}`, { status: 'pending' }),

  // Events
  getEventRequests: () => getList<EventRequest>('/event-requests?limit=100'),
  createEventRequest: (body: object) => post<EventRequest>('/event-requests', body),

  // Reviews
  getReviews: (uid: string) => get<Review[]>(`/reviews/${uid}`),

  // Profile
  updateProfile: (uid: string, body: object) => put<MeUser>(`/users/${uid}`, body),

  // Schedule
  getSchedule: () => get<ScheduleDetail>('/schedule'),

  // Jadwal terapis milik yayasan (yayasan yang mengatur).
  getTherapistSchedule: (tid: string) =>
    get<ScheduleDetail>(`/yayasan/therapists/${tid}/schedule`),
  createTherapistSchedule: (tid: string, body: ScheduleSaveInput) =>
    post<ScheduleDetail>(`/yayasan/therapists/${tid}/schedule`, body),
  updateTherapistSchedule: (tid: string, body: ScheduleSaveInput) =>
    put<ScheduleDetail>(`/yayasan/therapists/${tid}/schedule`, body),
  deleteTherapistSchedule: (tid: string) =>
    del<{ deleted: boolean }>(`/yayasan/therapists/${tid}/schedule`),

  // Password reset
  requestPasswordReset: (email: string) =>
    post<void>('/auth/password/reset-request', { email }),
};
