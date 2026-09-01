import { env } from '@/lib/env';

const BASE = env.apiBaseUrl;

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

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(body) });
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

/**
 * Profil terapis apa adanya dari `GET /me`.
 *
 * Bentuknya campur: kolom lama di `user_profiles` belum punya `json` tag di Go
 * sehingga terkirim PascalCase (`FullName`, `City`), sedangkan kolom provider
 * yang ditambahkan belakangan sudah snake_case. Dua-duanya ditulis di sini
 * supaya pembacanya tidak perlu menebak — `PUT /users/:id` sendiri menerima
 * snake_case untuk semuanya.
 */
export interface TherapistProfile {
  FullName?: string | null;
  Phone?: string | null;
  City?: string | null;
  District?: string | null;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  district?: string | null;

  bio?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  certifications?: string | null;
  languages?: string | null;
  rate_min?: number | null;
  rate_max?: number | null;
  rate_per_session?: number | null;
  bpjs_accepted?: boolean;
  consultation_methods?: string | null;
  is_verified?: boolean;
}

export interface MeUser {
  ID: string;
  Email: string;
  Role: string;
  Profile?: TherapistProfile;
}

/** Body `PUT /users/:id` — hanya field yang relevan untuk terapis. */
export interface TherapistProfileInput {
  full_name?: string;
  phone?: string;
  city?: string;
  district?: string;
  bio?: string;
  specialization?: string;
  experience_years?: number;
  certifications?: string;
  languages?: string;
  rate_min?: number;
  rate_max?: number;
  bpjs_accepted?: boolean;
  consultation_methods?: string;
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

/** Tanggal libur/cuti yang mengesampingkan jadwal mingguan. */
export interface ScheduleException {
  id: string;
  date: string;
  is_available: boolean;
  reason?: string | null;
  start_time?: string | null;
  end_time?: string | null;
}

export interface ExceptionInput {
  date: string;
  /** false = libur seharian. true dipakai untuk membuka tanggal di luar jadwal. */
  is_available: boolean;
  reason?: string;
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
  therapist_id?: string | null;
  location_id?: string | null;
  start_at: string;
  end_at: string;
  status: string;
  notes?: string | null;
  user_name?: string;
  provider_name?: string;
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

/** Antrian konsultasi screening berbayar yang masuk ke akun mitra. */
export interface ConsultationQueueItem {
  id: string;
  user_id: string;
  child_id?: string;
  assessment_id?: string;
  status: string;
  amount: number;
  paid_at?: string;
  created_at: string;
  intake?: {
    complaints: string;
    main_concern: string;
    assessment_summary?: string;
  } | null;
}

export interface ReviewSummary {
  target_id: string;
  average_rating: number;
  total_reviews: number;
}

export interface ReviewItem {
  id: string;
  reviewer_id: string;
  target_id: string;
  target_type: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer_name?: string | null;
}

/** Pelatihan yang diselenggarakan terapis ini (`/me/trainings`). */
export interface MyTraining {
  id: string;
  title: string;
  category: string;
  training_type: string;
  status: string;
  start_date: string;
  end_date?: string | null;
  location?: string | null;
  is_free: boolean;
  price: number;
  max_participants?: number | null;
}

/**
 * Komunitas yang diikuti.
 *
 * Entity Community di Go belum punya `json` tag, jadi field-nya PascalCase.
 * Varian snake_case ikut ditulis agar tetap benar bila tag itu dipasang nanti.
 */
export interface MyCommunity {
  ID?: string;
  Name?: string;
  Description?: string | null;
  id?: string;
  name?: string;
  description?: string | null;
}

/** Satu preferensi hari + jam mingguan untuk penjadwalan sesi program. */
export interface SlotPref {
  day_of_week: number;
  start_time: string;
}

/** Paket terapi berjalan yang ditangani terapis. */
export interface TherapyProgram {
  id: string;
  user_id: string;
  child_id: string;
  provider_id: string;
  therapist_id?: string | null;
  title: string;
  total_sessions: number;
  frequency_per_week: number;
  slot_duration_minutes: number;
  start_date: string;
  preferred_slots: string;
  status: 'draft' | 'pending_payment' | 'active' | 'completed' | 'cancelled';
  amount: number;
  currency: string;
  paid_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  child_name: string;
  provider_name?: string;
  therapist_name?: string;
}

export interface TherapyProgramListItem extends TherapyProgram {
  attended: number;
  remaining: number;
  next_session_at?: string | null;
}

export interface TherapyGoal {
  id: string;
  program_id: string;
  title: string;
  baseline?: string | null;
  target?: string | null;
  status: 'open' | 'achieved' | 'dropped';
  achieved_at?: string | null;
  achieved_note?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TherapyEvaluation {
  id: string;
  program_id: string;
  therapist_id: string;
  period: string;
  sessions_count: number;
  summary: string;
  recommendation?: string | null;
  next_step: 'continue' | 'graduate' | 'refer';
  created_at: string;
}

export interface TherapyProgramSession {
  appointment_id: string;
  session_seq: number;
  start_at: string;
  end_at: string;
  status: string;
  has_note: boolean;
  progress_rating?: number | null;
  activity?: string | null;
  note_created_at?: string | null;
}

export interface TherapyProgramStats {
  total_sessions: number;
  attended: number;
  absent: number;
  cancelled: number;
  upcoming: number;
  scheduled: number;
  remaining: number;
  avg_rating: number;
  goals_total: number;
  goals_achieved: number;
  next_session_at?: string | null;
  completion_rate: number;
}

export interface TherapyProgramDetail extends TherapyProgram {
  goals: TherapyGoal[];
  evaluations: TherapyEvaluation[];
  sessions: TherapyProgramSession[];
  stats: TherapyProgramStats;
}

export const api = {
  getMe: () => get<MeUser>('/me'),
  updateProfile: (userId: string, body: TherapistProfileInput) =>
    put<MeUser>(`/users/${userId}`, body),
  getConsultationQueue: (status = 'paid') =>
    get<ConsultationQueueItem[]>(`/me/consultations/intake?status=${encodeURIComponent(status)}`),
  getAppointments: () => getList<Appointment>('/me/appointments?limit=100'),
  getMySessionNotes: () => getList<SessionNoteFeedItem>('/me/session-notes?limit=50'),
  getAppointmentChildren: (apptId: string) => get<Child[]>(`/appointments/${apptId}/children`),
  createSessionNote: (apptId: string, body: SessionNoteInput) =>
    post<unknown>(`/appointments/${apptId}/session-note`, body),
  completeAppointment: (apptId: string) =>
    put<Appointment>(`/appointments/${apptId}`, { status: 'completed' }),
  /**
   * Konfirmasi, tolak, atau catat kehadiran sesi.
   *
   * `completed` = hadir (butuh jurnal lebih dulu), `no_show` = tidak datang.
   * Keduanya menghanguskan satu kuota sesi bila sesi ini bagian dari program.
   */
  setAppointmentStatus: (
    apptId: string,
    status: 'confirmed' | 'cancelled' | 'completed' | 'no_show',
  ) => put<Appointment>(`/appointments/${apptId}`, { status }),

  // --- Terapi berjalan ---

  getPrograms: () => get<TherapyProgramListItem[]>('/me/therapy-programs'),
  getProgram: (id: string) => get<TherapyProgramDetail>(`/me/programs/${id}`),
  addProgramGoal: (programId: string, body: { title: string; baseline?: string; target?: string }) =>
    post<TherapyGoal>(`/me/programs/${programId}/goals`, body),
  updateProgramGoal: (
    programId: string,
    goalId: string,
    body: { status?: TherapyGoal['status']; achieved_note?: string; target?: string; title?: string },
  ) => patch<TherapyGoal>(`/me/programs/${programId}/goals/${goalId}`, body),
  addProgramEvaluation: (
    programId: string,
    body: { period?: string; summary: string; recommendation?: string; next_step?: TherapyEvaluation['next_step'] },
  ) => post<TherapyEvaluation>(`/me/programs/${programId}/evaluations`, body),

  // Jadwal sendiri (hanya terapis independen; terapis milik yayasan diatur yayasan).
  getMyAffiliations: () => get<Affiliation[]>('/me/affiliations'),

  /**
   * Cari kota dari data `location_cities`.
   *
   * Filter kota di direktori membandingkan `user_profiles.city` dengan NAMA
   * kota hasil `CityByCode` — kalau terapis mengetik kota bebas ("Jkt",
   * "Jakarta Selatan "), filternya tidak pernah cocok. Karena itu profil harus
   * memilih dari daftar ini, bukan mengetik bebas.
   */
  searchCities: (q: string) =>
    get<{ items: Array<{ code: string; name: string; state_code: string }> }>(
      `/locations/cities?limit=10&q=${encodeURIComponent(q)}`
    ),

  getMyTrainings: () => getList<MyTraining>('/me/trainings?limit=50'),
  getMyCommunities: () => getList<MyCommunity>('/me/communities?limit=50'),
  /**
   * Ganti password lewat tautan email.
   *
   * Tidak ada endpoint ganti-password-saat-login di backend; yang tersedia
   * hanya alur reset. Memakainya di sini lebih jujur daripada membuat form
   * yang tidak punya endpoint.
   */
  requestPasswordReset: (email: string) =>
    post<unknown>('/auth/password/reset-request', { email }),

  // Ulasan: endpoint-nya publik dan sudah lama ada, tapi tidak pernah punya
  // pembungkus di klien mana pun — kartu "Rating" di dashboard karenanya
  // mustahil terisi.
  getReviewSummary: (therapistId: string) =>
    get<ReviewSummary>(`/reviews/${therapistId}/summary?type=therapist`),
  getReviews: (therapistId: string) =>
    getList<ReviewItem>(`/reviews/${therapistId}?type=therapist&limit=50`),
  getSchedule: () => get<ScheduleDetail>('/schedule'),
  getScheduleExceptions: () => get<ScheduleException[]>('/schedule/exceptions'),
  addScheduleException: (body: ExceptionInput) =>
    post<ScheduleException>('/schedule/exceptions', body),
  deleteScheduleException: (id: string) => del<unknown>(`/schedule/exceptions/${id}`),
  createSchedule: (body: ScheduleSaveInput) => post<ScheduleDetail>('/schedule', body),
  updateSchedule: (body: ScheduleSaveInput) => put<ScheduleDetail>('/schedule', body),
  deleteSchedule: () => del<{ deleted: boolean }>('/schedule'),
};
