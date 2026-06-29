// API Response Types
export interface PaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  next_cursor?: string;
  prev_cursor?: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  error?: string;
  message?: string;
  status?: number;
  meta?: PaginationMeta;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// User and Authentication Types
export interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  date_of_birth?: string;
  gender?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  user: User;
  access_token: string;
  expires_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expires_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export type UserRole = 'user_disabilitas' | 'orang_tua' | 'therapy' | 'therapist_independent' | 'admin';

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  parent_name?: string;
  phone?: string;
  role?: UserRole;
}

// Profile Types
export interface Profile {
  id: string;
  address?: string;
  city?: string;
  created_at: string;
  date_of_birth?: string;
  email?: string;
  full_name?: string;
  gender?: string;
  phone?: string;
  updated_at: string;
}

export interface ProfileInsert {
  address?: string;
  city?: string;
  date_of_birth?: string;
  email?: string;
  full_name?: string;
  gender?: string;
  phone?: string;
}

export interface ProfileUpdate extends Partial<ProfileInsert> {}

// Therapist Types
export interface Therapist {
  id: string;
  available?: boolean;
  bio?: string;
  created_at: string;
  experience_years?: number;
  expertise?: string[];
  image_url?: string;
  languages?: string[];
  location: string;
  name: string;
  price_per_session?: number;
  rating?: number;
  specialization: string;
  updated_at: string;
  user_id?: string;
}

export interface TherapistInsert {
  available?: boolean;
  bio?: string;
  experience_years?: number;
  expertise?: string[];
  image_url?: string;
  languages?: string[];
  location: string;
  name: string;
  price_per_session?: number;
  rating?: number;
  specialization: string;
  user_id?: string;
}

export interface TherapistUpdate extends Partial<TherapistInsert> {}

// Appointment Types
export interface Appointment {
  id: string;
  user_id: string;
  therapist_id: string;
  appointment_date: string;
  method: 'zoom' | 'meet' | 'call';
  meeting_link?: string | null;
  phone_number?: string | null;
  notes?: string;
  status?: string;
  is_free?: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
  therapist?: Therapist;
}

export interface AppointmentInsert {
  user_id: string;
  therapist_id: string;
  appointment_date: string;
  method: 'zoom' | 'meet' | 'call';
  meeting_link?: string | null;
  phone_number?: string | null;
  notes?: string;
  status?: string;
  is_free?: boolean;
}

export interface AppointmentUpdate extends Partial<AppointmentInsert> {}

// Forum Types
export interface ForumThread {
  id: string;
  user_id: string;
  community_id?: string;
  title: string;
  body: string;
  tags?: string;
  status: string;
  is_pinned?: boolean;
  reply_count?: number;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface ForumComment {
  id: string;
  thread_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Location Types
export interface Country {
  code: string;
  name: string;
}

export interface State {
  code: string;
  country_code: string;
  name: string;
}

export interface City {
  code: string;
  state_code: string;
  name: string;
  type: string;
}

// Location Type constants
export const LOCATION_TYPES = [
  { value: 'yayasan', label: 'Yayasan' },
  { value: 'klinik', label: 'Klinik' },
  { value: 'rumah_sakit', label: 'Rumah Sakit' },
  { value: 'praktek_mandiri', label: 'Praktek Mandiri' },
  { value: 'puskesmas', label: 'Puskesmas' },
  { value: 'lainnya', label: 'Lainnya' },
] as const;

export type LocationType = typeof LOCATION_TYPES[number]['value'];

export const LOCATION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  LOCATION_TYPES.map((t) => [t.value, t.label]),
);

// Therapy Location Types
export interface TherapyLocation {
  id: string;
  provider_user_id: string;
  name: string;
  type?: string;
  address: string;
  city_code?: string;
  city_name?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  is_verified: boolean;
  verified_at?: string;
  registrant_name?: string;
  registrant_email?: string;
  registrant_phone?: string;
  // True when contact details (phone/email/address) are hidden because the
  // viewer is not logged in. Set by the backend gating on public endpoints.
  contact_locked?: boolean;
  services?: string[];
  open_hours?: LocationHour[];
  created_at: string;
  updated_at: string;
}

export interface LocationHour {
  id?: string;
  location_id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
}

export interface LocationService {
  id?: string;
  location_id?: string;
  name: string;
}

export interface TherapyLocationInsert {
  name: string;
  type?: string;
  address: string;
  city_code?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
  open_hours?: LocationHour[];
}

export interface TherapyLocationUpdate extends Partial<TherapyLocationInsert> {
  is_verified?: boolean;
}

export interface TherapyLocationRegister {
  name: string;
  type?: string; // yayasan, klinik, rumah_sakit, praktek_mandiri, puskesmas, lainnya
  address: string;
  city_code?: string;
  description?: string;
  phone: string;
  email: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  contact_person?: string;
  provider_name: string;
  provider_email: string;
  provider_phone: string;
}

// Contact Message Types
export type ContactType = 'contact' | 'feedback' | 'bug' | 'aduan';
export type ContactCategory = 'general' | 'feature' | 'complaint' | 'praise';

export interface ContactMessage {
  id: string;
  type: ContactType;
  category: ContactCategory;
  rating?: number; // 1-5, optional for feedback
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  read_at?: string;
  replied_at?: string;
  reply_note?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactMessageInsert {
  type?: ContactType;
  category?: ContactCategory;
  rating?: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface ContactMessageUpdate {
  status?: string;
  reply_note?: string;
}

// Article Types (CMS)
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  cover_image?: string;
  author_id: string;
  author_name?: string;
  category: string;
  tags?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  view_count: number;
  created_at: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  cover_image?: string;
  author_id: string;
  author_name?: string;
  category: string;
  tags?: string;
  status: string;
  published_at?: string;
  view_count: number;
  created_at: string;
}

export interface ArticleInsert {
  title: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  category?: string;
  tags?: string;
  status?: string;
}

export interface ArticleUpdate {
  title?: string;
  content?: string;
  excerpt?: string;
  cover_image?: string;
  category?: string;
  tags?: string;
  status?: string;
}

// Learning Resource Types
export type ResourceType = 'article' | 'video' | 'pdf' | 'ebook' | 'infographic' | 'guide' | 'template';
export type ResourceCategory = 'panduan' | 'tutorial' | 'aksesibilitas' | 'komunitas' | 'hukum' | 'kesehatan' | 'pendidikan' | 'pekerjaan';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  content_url?: string;
  file_url?: string;
  file_size?: number; // in bytes
  file_type?: string; // pdf, docx, etc
  read_time: string;
  image_url?: string;
  is_published: boolean;
  is_downloadable: boolean;
  download_count?: number;
  author_id?: string;
  author_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceInsert {
  title: string;
  description?: string;
  category: string;
  type?: string;
  content_url?: string;
  file_url?: string;
  file_size?: number;
  file_type?: string;
  read_time?: string;
  image_url?: string;
  is_published?: boolean;
  is_downloadable?: boolean;
}

export interface ResourceUpdate extends Partial<ResourceInsert> {}

// Notification Types
export type NotificationType =
  | 'appointment'
  | 'community'
  | 'event'
  | 'therapy'
  | 'system'
  | 'chat';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: string;
  priority: NotificationPriority;
  read: boolean;
  read_at?: string;
  community_id?: string;
  event_id?: string;
  appointment_id?: string;
  created_at: string;
}

export interface NotificationStats {
  total_count: number;
  unread_count: number;
}

export interface NotificationListParams {
  limit?: number;
  offset?: number;
  type?: NotificationType;
  read?: boolean;
}

export interface NotificationCreate {
  user_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  data?: string;
}

// Event Types
export type EventMode = 'online' | 'offline' | 'hybrid' | 'zoom' | 'gmeet';
export type EventStatus = 'draft' | 'published';
export type RSVPStatus = 'going' | 'maybe' | 'not_going';

export interface Event {
  id: string;
  title: string;
  mode: EventMode;
  start_at: string;
  end_at: string;
  host_user_id?: string;
  community_id?: string;
  capacity?: number;
  location?: string;
  join_url?: string;
  host_url?: string;
  status: EventStatus;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  created_at: string;
}

export interface EventCreate {
  title: string;
  mode: EventMode;
  start_at: string;
  end_at: string;
  community_id?: string;
  capacity?: number;
  location?: string;
}

export interface EventUpdate {
  title?: string;
  mode?: EventMode;
  start_at?: string;
  end_at?: string;
  capacity?: number;
  location?: string;
  status?: EventStatus;
}

// Community Types
export interface Community {
  id: string;
  name: string;
  description?: string;
  tags?: string;
  is_private: boolean;
  created_by?: string;
  created_at: string;
}

export interface CommunityCreate {
  name: string;
  description?: string;
  tags?: string[];
}

export interface CommunityListParams {
  q?: string;
  page?: number;
  per_page?: number;
}

// Schedule Types
export interface ScheduleSlot {
  id: string;
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface WeeklySchedule {
  id: string;
  therapist_id: string;
  slot_duration_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleDetail {
  schedule: WeeklySchedule;
  slots: ScheduleSlot[];
  exceptions?: ScheduleException[];
}

export interface ScheduleException {
  id: string;
  therapist_id: string;
  date: string;
  is_available: boolean;
  reason?: string;
  start_time?: string;
  end_time?: string;
}

export interface AvailableSlot {
  date: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

// Therapy Provider (from search API)
export interface TherapyProvider {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  city?: string;
  district?: string;
  bio?: string;
  specialization?: string;
  experience_years?: number;
  certifications?: string;
  languages?: string;
  rate_per_session?: number;
  consultation_methods?: string;
  locations?: TherapyLocation[];
  contact_locked?: boolean;
}

// Affiliation Types
export interface LocationTherapistAffiliation {
  id: string;
  location_id: string;
  therapist_id: string;
  status: string;
  invited_by: string;
  role?: string;
  therapist_name?: string;
  therapist_email: string;
  location_name: string;
  created_at: string;
  updated_at: string;
}

// Password Reset Types
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetValidate {
  token: string;
}

export interface PasswordReset {
  token: string;
  new_password: string;
}

// AI Service Types
export interface SignRecognitionResult {
  signs: Array<{
    label: string;
    confidence: number;
  }>;
  num_hands: number;
}

export interface DictionaryEntry {
  key: string;
  label: string;
  description?: string;
  category?: string;
  image_url?: string;
  video_url?: string;
}

export interface ObjectDetectionResult {
  objects: Array<{
    label: string;
    confidence: number;
    bbox?: [number, number, number, number];
  }>;
}

export interface OCRResult {
  text: string;
  language?: string;
}

export interface SceneDescription {
  description: string;
  language: string;
}

export interface TTSRequest {
  text: string;
}

export interface CurrencyDetectionResult {
  currencies: Array<{
    label: string;
    denomination: number;
    currency_code: string;
    confidence: number;
    count?: number;
  }>;
  total_value?: number;
  currency?: string;
}

export interface AIHealthStatus {
  isyarat: 'ok' | 'unavailable' | 'not_configured';
  vision: 'ok' | 'unavailable' | 'not_configured';
  currency?: 'ok' | 'unavailable' | 'not_configured';
}

// Jobs (Cari Kerja)
export interface JobSummary {
  id: string;
  title: string;
  company_name: string;
  company_logo?: string;
  location: string;
  work_type: string;
  employment_type: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  disability_types?: string;
  accessibility_notes?: string;
  contact_wa?: string;
  experience_level?: string;
  status: string;
  deadline_apply: string;
  view_count: number;
  created_by?: string;
  author_name?: string;
  created_at: string;
}

export interface JobDetail extends JobSummary {
  description: string;
  company_website?: string;
  required_skills?: string;
  experience_level?: string;
  status: string;
  created_by: string;
  author_name?: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  job_title?: string;
  company_name?: string;
  cover_letter?: string;
  resume_url?: string;
  status: string;
  applied_at: string;
}

// Database-like Types for compatibility
export type Tables<T> = T extends 'profiles' 
  ? Profile
  : T extends 'therapists'
  ? Therapist
  : T extends 'appointments'
  ? Appointment
  : never;

export type TablesInsert<T> = T extends 'profiles'
  ? ProfileInsert
  : T extends 'therapists'
  ? TherapistInsert
  : T extends 'appointments'
  ? AppointmentInsert
  : never;

export type TablesUpdate<T> = T extends 'profiles'
  ? ProfileUpdate
  : T extends 'therapists'
  ? TherapistUpdate
  : T extends 'appointments'
  ? AppointmentUpdate
  : never;

// Trainings (Pelatihan)
export interface TrainingSummary {
  id: string;
  title: string;
  organizer_name: string;
  organizer_logo?: string;
  category: string;
  training_type: string;
  location?: string;
  start_date: string;
  end_date?: string;
  price: number;
  price_currency?: string;
  is_free: boolean;
  disability_types?: string;
  skill_level?: string;
  certificate: boolean;
  status: string;
  view_count: number;
  registration_count?: number;
  max_participants?: number;
  created_by: string;
  author_name?: string;
  created_at: string;
}

export interface TrainingDetail extends TrainingSummary {
  description: string;
  organizer_website?: string;
  training_url?: string;
  schedule_info?: string;
  status: string;
  created_by: string;
  author_name?: string;
  updated_at: string;
}

export interface TrainingRegistration {
  id: string;
  training_id: string;
  user_id: string;
  training_title?: string;
  organizer_name?: string;
  motivation?: string;
  status: string;
  registered_at: string;
  updated_at?: string;
}

export interface TrainingMaterial {
  id: string;
  training_id: string;
  name: string;
  s3_key: string;
  content_type: string;
  file_size: number;
  uploaded_by: string;
  created_at: string;
}

// Legacy Database type for compatibility
export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: Appointment;
        Insert: AppointmentInsert;
        Update: AppointmentUpdate;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      therapists: {
        Row: Therapist;
        Insert: TherapistInsert;
        Update: TherapistUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Recommendation types (Slope One + ACO)
export interface RecommendedLocation {
  id: string;
  lat: number;
  lng: number;
  predicted_rating: number;
  score: number;
  rank: number;
  distance_km: number;
  name?: string;
  type?: string | null;
  city_name?: string | null;
}

export interface RecommendationMeta {
  total: number;
  algorithm: string;
  lat: number;
  lng: number;
}

// Progress tracking anak (Sprint 3)
export interface ChildProfile {
  id: string;
  parent_user_id: string;
  full_name: string;
  date_of_birth?: string;
  disability_types?: string;
  assistive_needs?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ChildProfileInput {
  full_name: string;
  date_of_birth?: string;
  disability_types?: string;
  assistive_needs?: string;
  notes?: string;
}

export interface SessionNote {
  id: string;
  child_id: string;
  therapist_id: string;
  appointment_id?: string;
  session_date: string;
  activity: string;
  observation?: string;
  progress_rating: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionNoteInput {
  child_id: string;
  session_date?: string;
  activity: string;
  observation?: string;
  progress_rating: number;
  notes?: string;
}

export interface ChildMilestone {
  id: string;
  child_id: string;
  milestone_name: string;
  achieved_at: string;
  recorded_by: string;
  notes?: string;
  created_at: string;
}

export interface ChildMilestoneInput {
  milestone_name: string;
  achieved_at?: string;
  notes?: string;
}

export interface ProgressMonthlySummary {
  month: string;
  session_count: number;
  avg_rating: number;
  milestone_count: number;
}

// Komunitas dengan statistik aktivitas (endpoint publik, Fase 1 fokus komunitas)
export interface CommunityWithStats extends Community {
  member_count: number;
  thread_count: number;
  last_activity_at?: string;
}

// Laporan konten (Fase 2 fokus komunitas)
export type ReportReason = 'stigma' | 'kasar' | 'spam' | 'lainnya';

export interface ContentReport {
  id: string;
  target_type: 'thread' | 'reply';
  target_id: string;
  reason: string;
  details?: string;
  reporter_id: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolution_note?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ContentReportWithContext extends ContentReport {
  content_snippet: string;
  content_author: string;
  reporter_email: string;
  community_id?: string;
}

// --- Pricing & Commission (markup admin) ---
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
  submitted_by?: string;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionLedgerRow {
  id: string;
  price_item_id: string;
  transaction_type: 'appointment' | 'training_booking';
  transaction_ref_id: string;
  yayasan_id: string;
  harga_dasar: number;
  harga_jual: number;
  komisi_amount: number;
  status: 'recorded' | 'settled';
  created_at: string;
}

export interface CommissionReport {
  items: CommissionLedgerRow[];
  total_komisi: number;
  total_transaksi: number;
}
