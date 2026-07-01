const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const TERAPIS_TOKEN_KEY = 'terapis_token';

function token() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TERAPIS_TOKEN_KEY) ?? '';
}

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

/** Error yang membawa kode dari backend (mis. JOURNAL_REQUIRED). */
export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message ?? 'Request gagal', json.code);
  return json.data as T;
}

async function getList<T>(path: string): Promise<{ data: T[]; meta: { total: number } }> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message ?? 'Request gagal', json.code);
  return { data: json.data ?? [], meta: json.meta ?? { total: 0 } };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message ?? 'Request gagal', json.code);
  return json.data as T;
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message ?? 'Request gagal', json.code);
  return json.data as T;
}

async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'DELETE', headers: authHeaders() });
  const json = await res.json();
  if (!res.ok) throw new ApiError(json.message ?? 'Request gagal', json.code);
  return json.data as T;
}

export interface MeUser {
  ID: string;
  Email: string;
  Role: string;
  Profile?: { FullName?: string };
}

export interface ScheduleSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ScheduleDetail {
  schedule: { id: string; therapist_id: string; slot_duration_minutes: number; is_active: boolean };
  slots: ScheduleSlot[];
}

export interface ScheduleSaveInput {
  slot_duration_minutes?: number;
  slots: { day_of_week: number; start_time: string; end_time: string }[];
}

export interface Affiliation {
  id: string;
  location_id: string;
  therapist_id: string;
  status: string;
  location_name: string;
}

// Field appointment dari backend (sebagian PascalCase tanpa json tag).
export interface Appointment {
  ID: string;
  UserID: string;
  ProviderID: string;
  therapist_id?: string | null;
  location_id?: string | null;
  StartAt: string;
  EndAt: string;
  Status: string;
  Notes?: string | null;
}

export interface Child {
  id: string;
  full_name: string;
  date_of_birth?: string | null;
}

export interface SessionNoteInput {
  child_id: string;
  session_date?: string;
  activity: string;
  observation?: string;
  progress_rating: number;
  notes?: string;
}

export interface SessionNoteFeedItem {
  id: string;
  child_id: string;
  child_name: string;
  therapist_id: string;
  appointment_id?: string | null;
  session_date: string;
  activity: string;
  observation?: string | null;
  progress_rating: number;
  notes?: string | null;
  created_at: string;
}

export const api = {
  getMe: () => get<MeUser>('/me'),
  getAppointments: () => getList<Appointment>('/me/appointments?limit=100'),
  getMySessionNotes: () => getList<SessionNoteFeedItem>('/me/session-notes?limit=50'),
  getAppointmentChildren: (apptId: string) => get<Child[]>(`/appointments/${apptId}/children`),
  createSessionNote: (apptId: string, body: SessionNoteInput) =>
    post<unknown>(`/appointments/${apptId}/session-note`, body),
  completeAppointment: (apptId: string) =>
    put<Appointment>(`/appointments/${apptId}`, { status: 'completed' }),

  // Jadwal sendiri (hanya terapis independen; terapis milik yayasan diatur yayasan).
  getMyAffiliations: () => get<Affiliation[]>('/me/affiliations'),
  getSchedule: () => get<ScheduleDetail>('/schedule'),
  createSchedule: (body: ScheduleSaveInput) => post<ScheduleDetail>('/schedule', body),
  updateSchedule: (body: ScheduleSaveInput) => put<ScheduleDetail>('/schedule', body),
  deleteSchedule: () => del<{ deleted: boolean }>('/schedule'),
};
