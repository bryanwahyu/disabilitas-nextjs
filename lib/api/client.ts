import type {
  ApiResponse,
  User,
  Session,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  Therapist,
  Appointment,
  AppointmentInsert,
  AppointmentUpdate,
  Profile,
  ProfileUpdate,
  ForumThread,
  ForumComment,
  Resource,
  ResourceInsert,
  ResourceUpdate,
  Country,
  State,
  City,
  TherapyLocation,
  TherapyLocationInsert,
  TherapyLocationUpdate,
  TherapyLocationRegister,
  ContactMessage,
  ContactMessageInsert,
  ContactMessageUpdate,
  Article,
  ArticleSummary,
  ArticleInsert,
  ArticleUpdate,
  Notification,
  NotificationStats,
  NotificationListParams,
  NotificationCreate,
  Event,
  EventCreate,
  EventUpdate,
  EventParticipant,
  RSVPStatus,
  Community,
  CommunityCreate,
  CommunityListParams,
  PasswordResetRequest,
  PasswordResetValidate,
  PasswordReset,
  SignRecognitionResult,
  DictionaryEntry,
  ObjectDetectionResult,
  OCRResult,
  SceneDescription,
  CurrencyDetectionResult,
  AIHealthStatus,
  JobSummary,
  JobDetail,
  JobApplication,
  TrainingSummary,
  TrainingDetail,
  TrainingRegistration,
  TrainingMaterial,
  ScheduleDetail,
  AvailableSlot,
  TherapyProvider,
  LocationTherapistAffiliation,
  RecommendedLocation,
  ChildProfile,
  ChildProfileInput,
  SessionNote,
  SessionNoteInput,
  ChildMilestone,
  ChildMilestoneInput,
  ProgressMonthlySummary,
} from './types';

/** Shape returned by the /me endpoint (PascalCase or snake_case from Go backend) */
interface RawMeResponse {
  ID?: string;
  id?: string;
  user_id?: string;
  Email?: string;
  email?: string;
  Role?: string;
  role?: string;
  Profile?: { FullName?: string; full_name?: string };
  profile?: { full_name?: string };
  full_name?: string;
  FullName?: string;
}

/** Shape returned by raw event from API (PascalCase or snake_case) */
interface RawEvent {
  ID?: string;
  id?: string;
  Title?: string;
  title?: string;
  Mode?: string;
  mode?: string;
  StartAt?: string;
  start_at?: string;
  EndAt?: string;
  end_at?: string;
  HostUserID?: string;
  host_user_id?: string;
  CommunityID?: string;
  community_id?: string;
  Capacity?: number;
  capacity?: number;
  Location?: string;
  location?: string;
  JoinURL?: string;
  join_url?: string;
  HostURL?: string;
  host_url?: string;
  Status?: string;
  status?: string;
  PublishedAt?: string;
  published_at?: string;
  CreatedAt?: string;
  created_at?: string;
  UpdatedAt?: string;
  updated_at?: string;
}

/** Shape returned by raw community from API (PascalCase or snake_case) */
interface RawCommunity {
  ID?: string;
  id?: string;
  Name?: string;
  name?: string;
  Description?: string;
  description?: string;
  Tags?: string;
  tags?: string;
  IsPrivate?: boolean;
  is_private?: boolean;
  CreatedBy?: string;
  created_by?: string;
  CreatedAt?: string;
  created_at?: string;
}

/** Shape returned by raw user from API (PascalCase or snake_case) */
interface RawUser {
  ID?: string;
  id?: string;
  user_id?: string;
  Email?: string;
  email?: string;
  Role?: string;
  role?: string;
  FullName?: string;
  full_name?: string;
  name?: string;
  Phone?: string;
  phone?: string;
  Address?: string;
  address?: string;
  City?: string;
  city?: string;
  DateOfBirth?: string;
  date_of_birth?: string;
  Gender?: string;
  gender?: string;
  AvatarURL?: string;
  avatar_url?: string;
  CreatedAt?: string;
  created_at?: string;
  UpdatedAt?: string;
  updated_at?: string;
  Profile?: {
    FullName?: string;
    full_name?: string;
    Phone?: string;
    phone?: string;
    Address?: string;
    address?: string;
    City?: string;
    city?: string;
    DateOfBirth?: string;
    date_of_birth?: string;
    Gender?: string;
    gender?: string;
    AvatarURL?: string;
    avatar_url?: string;
  };
  profile?: {
    full_name?: string;
    phone?: string;
    address?: string;
    city?: string;
    date_of_birth?: string;
    gender?: string;
    avatar_url?: string;
  };
}

/** Auth response shape: success path for signUp/signIn */
interface AuthSuccessResult {
  data: { token: string; user: User };
  error: undefined;
}

/** Auth response shape: error path for signUp/signIn */
interface AuthErrorResult {
  data: null;
  error: string;
  status?: number;
}

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082/v1';
    this.timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '10000');

    // Load existing token from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
      this.authToken = localStorage.getItem(tokenKey);
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));

        // Clear token on 401 Unauthorized
        if (response.status === 401) {
          this.removeAuthToken();
        }

        return { data: null, error: errorData.error || errorData.message || response.statusText, status: response.status };
      }

      const data = await response.json();
      return { data: data.data, error: undefined, ...(data.meta && { meta: data.meta }) };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { data: null, error: 'Request timeout' };
        }
        return { data: null, error: error.message };
      }
      return { data: null, error: 'Unknown error occurred' };
    }
  }

  private async fetchUrl<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));

        // Clear token on 401 Unauthorized
        if (response.status === 401) {
          this.removeAuthToken();
        }

        return { data: null as unknown as T, error: errorData.error || errorData.message || response.statusText, status: response.status };
      }

      const data = await response.json();
      return { data: data.data, error: undefined, ...(data.meta && { meta: data.meta }) };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { data: null as unknown as T, error: 'Request timeout' };
        }
        return { data: null as unknown as T, error: error.message };
      }
      return { data: null as unknown as T, error: 'Unknown error occurred' };
    }
  }

  // Auth methods
  auth = {
    signUp: async (credentials: RegisterCredentials): Promise<AuthSuccessResult | AuthErrorResult> => {
      const response = await this.makeRequest<{ access_token: string; refresh_token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.data && !response.error) {
        this.setAuthToken(response.data.access_token);
        // Return in expected format
        return { data: { token: response.data.access_token, user: response.data.user }, error: undefined };
      }

      return { data: null, error: response.error || 'Registration failed', status: response.status };
    },

    signInWithPassword: async (credentials: LoginCredentials): Promise<AuthSuccessResult | AuthErrorResult> => {
      const response = await this.makeRequest<{ access_token: string; refresh_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.data && !response.error) {
        this.setAuthToken(response.data.access_token);

        // Fetch user info from /me endpoint
        const meResponse = await this.makeRequest<RawMeResponse>('/me');
        const user: User = {
          id: meResponse.data?.ID || meResponse.data?.id || meResponse.data?.user_id || '',
          email: meResponse.data?.Email || meResponse.data?.email || credentials.email,
          role: meResponse.data?.Role || meResponse.data?.role || 'user_disabilitas',
          full_name: meResponse.data?.Profile?.FullName || meResponse.data?.profile?.full_name || meResponse.data?.full_name,
        };

        return { data: { token: response.data.access_token, user }, error: undefined };
      }

      return { data: null, error: response.error || 'Login failed', status: response.status };
    },

    signOut: async () => {
      // Always clear all tokens first, regardless of API response
      this.clearAllTokens();

      try {
        await this.makeRequest<void>('/auth/logout', {
          method: 'POST',
        });
      } catch (_e: unknown) {
        // Ignore API errors on logout - tokens are already cleared
      }

      return { data: null, error: undefined };
    },

    getSession: async (): Promise<{ data: { session: Session | null } }> => {
      if (!this.authToken) {
        return { data: { session: null } };
      }

      try {
        // Get user info from /me endpoint
        const response = await this.makeRequest<RawMeResponse>('/me');
        if (response.error || !response.data) {
          this.removeAuthToken();
          return { data: { session: null } };
        }

        const user: User = {
          id: response.data.ID || response.data.id || response.data.user_id || '',
          email: response.data.Email || response.data.email || '',
          role: response.data.Role || response.data.role || 'user_disabilitas',
          full_name: response.data.Profile?.FullName || response.data.profile?.full_name || response.data.full_name,
        };

        const session: Session = {
          user,
          access_token: this.authToken,
        };

        return { data: { session } };
      } catch (_e: unknown) {
        this.removeAuthToken();
        return { data: { session: null } };
      }
    },

    onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
      // For API-based auth, we'll simulate the state change events
      // This is a simplified version - you might want to implement WebSocket or polling for real-time updates
      const checkAuthState = async () => {
        const { data: { session } } = await this.auth.getSession();
        callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);
      };

      // Initial check
      checkAuthState();

      // Return unsubscribe function
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              // Cleanup if needed
            }
          }
        }
      };
    },

    // Password reset methods
    requestPasswordReset: async (data: PasswordResetRequest) => {
      return await this.makeRequest<{ message: string }>('/auth/password/reset-request', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    validateResetToken: async (data: PasswordResetValidate) => {
      return await this.makeRequest<{ valid: boolean }>('/auth/password/validate-token', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    resetPassword: async (data: PasswordReset) => {
      return await this.makeRequest<{ message: string }>('/auth/password/reset', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

  };

  // Public endpoints
  public = {
    therapists: {
      list: async (params: {
        search?: string;
        location?: string;
        specialization?: string;
        available?: boolean;
        sort?: 'rating' | 'created_at';
        order?: 'asc' | 'desc';
        page_size?: number;
      } = {}) => {
        const qs = new URLSearchParams();
        if (params.search) qs.set('search', params.search);
        if (params.location) qs.set('city_code', params.location);
        if (params.page_size) qs.set('limit', String(params.page_size));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<Therapist[]>(`/public/therapists${suffix}`);
      },
      fetchCursor: async (cursorUrl: string) => {
        return await this.fetchUrl<Therapist[]>(cursorUrl);
      }
    },
    resources: {
      list: async (params: { category?: string; limit?: number; offset?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.category) qs.set('category', params.category);
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.offset) qs.set('offset', String(params.offset));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<Resource[]>(`/public/resources${suffix}`);
      },
      get: async (id: string) => {
        return await this.makeRequest<Resource>(`/public/resources/${id}`);
      },
      getCategories: async () => {
        return await this.makeRequest<string[]>(`/public/resources/categories`);
      },
      getTypes: async () => {
        return await this.makeRequest<string[]>(`/public/resources/types`);
      },
      listDownloadable: async (params: { category?: string; limit?: number; offset?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.category) qs.set('category', params.category);
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.offset) qs.set('offset', String(params.offset));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<Resource[]>(`/public/resources/downloadable${suffix}`);
      },
      download: async (id: string) => {
        return await this.makeRequest<{ id: string; title: string; file_url: string; file_type: string; file_size: number }>(`/public/resources/${id}/download`, {
          method: 'POST',
        });
      }
    },
    therapyLocations: {
      list: async (params: { city_code?: string; limit?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.city_code) qs.set('city_code', params.city_code);
        if (params.limit) qs.set('limit', String(params.limit));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<TherapyLocation[]>(`/therapy/locations${suffix}`);
      },
      get: async (id: string) => {
        return await this.makeRequest<TherapyLocation>(`/therapy/locations/${id}`);
      }
    },
    contact: {
      submit: async (data: ContactMessageInsert) => {
        return await this.makeRequest<ContactMessage>('/public/contact', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },
    therapyLocationRegister: {
      submit: async (data: TherapyLocationRegister) => {
        return await this.makeRequest<{ id: string; message: string }>('/public/therapy/locations/register', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      }
    },
    articles: {
      list: async (params: { q?: string; category?: string; limit?: number; offset?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.category) qs.set('category', params.category);
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.offset) qs.set('offset', String(params.offset));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<ArticleSummary[]>(`/public/articles${suffix}`);
      },
      get: async (idOrSlug: string) => {
        return await this.makeRequest<Article>(`/public/articles/${idOrSlug}`);
      },
      getCategories: async () => {
        return await this.makeRequest<string[]>('/public/articles/categories');
      }
    },
    jobs: {
      list: async (params: { q?: string; work_type?: string; employment_type?: string; location?: string; disability_type?: string; remote?: boolean; limit?: number; offset?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.work_type) qs.set('work_type', params.work_type);
        if (params.employment_type) qs.set('employment_type', params.employment_type);
        if (params.location) qs.set('location', params.location);
        if (params.disability_type) qs.set('disability_type', params.disability_type);
        if (params.remote) qs.set('remote', 'true');
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.offset) qs.set('offset', String(params.offset));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<JobSummary[]>(`/public/jobs${suffix}`);
      },
      get: async (id: string) => {
        return await this.makeRequest<JobDetail>(`/public/jobs/${id}`);
      }
    },
    trainings: {
      list: async (params: { q?: string; category?: string; training_type?: string; skill_level?: string; is_free?: string; limit?: number; offset?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.q) qs.set('q', params.q);
        if (params.category) qs.set('category', params.category);
        if (params.training_type) qs.set('training_type', params.training_type);
        if (params.skill_level) qs.set('skill_level', params.skill_level);
        if (params.is_free) qs.set('is_free', params.is_free);
        if (params.limit) qs.set('limit', String(params.limit));
        if (params.offset) qs.set('offset', String(params.offset));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<TrainingSummary[]>(`/public/trainings${suffix}`);
      },
      get: async (id: string) => {
        return await this.makeRequest<TrainingDetail>(`/public/trainings/${id}`);
      }
    },
    recommendations: {
      locations: async (params: { lat?: number; lng?: number; limit?: number } = {}) => {
        const qs = new URLSearchParams();
        if (params.lat != null) qs.set('lat', String(params.lat));
        if (params.lng != null) qs.set('lng', String(params.lng));
        if (params.limit) qs.set('limit', String(params.limit));
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        return await this.makeRequest<RecommendedLocation[]>(`/public/recommendations/locations${suffix}`);
      }
    }
  };

  // Location API methods
  locations = {
    countries: async (params: { q?: string; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const response = await this.makeRequest<{ count: number; total: number; items: Country[] }>(`/locations/countries${suffix}`);
      return { ...response, data: response.data?.items || [], total: response.data?.total || 0 };
    },
    states: async (countryCode?: string, params: { q?: string; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (countryCode) qs.set('country_code', countryCode);
      if (params.q) qs.set('q', params.q);
      if (params.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const response = await this.makeRequest<{ count: number; total: number; items: State[] }>(`/locations/states${suffix}`);
      return { ...response, data: response.data?.items || [], total: response.data?.total || 0 };
    },
    cities: async (stateCode?: string, params: { q?: string; limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (stateCode) qs.set('state_code', stateCode);
      if (params.q) qs.set('q', params.q);
      if (params.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const response = await this.makeRequest<{ count: number; total: number; items: City[] }>(`/locations/cities${suffix}`);
      return { ...response, data: response.data?.items || [], total: response.data?.total || 0 };
    }
  };

  // Admin location management (countries, states, cities)
  adminLocations = {
    createCountry: async (data: { code: string; name: string }) => {
      return await this.makeRequest<{ code: string; name: string }>('/admin/locations/countries', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateCountry: async (code: string, name: string) => {
      return await this.makeRequest<{ code: string; name: string }>(`/admin/locations/countries/${code}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
    },
    deleteCountry: async (code: string) => {
      return await this.makeRequest<void>(`/admin/locations/countries/${code}`, { method: 'DELETE' });
    },
    createState: async (data: { code: string; country_code: string; name: string }) => {
      return await this.makeRequest<{ code: string; country_code: string; name: string }>('/admin/locations/states', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateState: async (code: string, data: { country_code?: string; name?: string }) => {
      return await this.makeRequest<any>(`/admin/locations/states/${code}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteState: async (code: string) => {
      return await this.makeRequest<void>(`/admin/locations/states/${code}`, { method: 'DELETE' });
    },
    createCity: async (data: { code: string; state_code: string; name: string; type: string; aliases?: string[] }) => {
      return await this.makeRequest<any>('/admin/locations/cities', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateCity: async (code: string, data: { state_code?: string; name?: string; type?: string; aliases?: string[] }) => {
      return await this.makeRequest<any>(`/admin/locations/cities/${code}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteCity: async (code: string) => {
      return await this.makeRequest<void>(`/admin/locations/cities/${code}`, { method: 'DELETE' });
    },
  };

  // Admin therapy locations
  adminTherapyLocations = {
    list: async (params: { limit?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<TherapyLocation[]>(`/therapy/locations${suffix}`);
    },
    create: async (data: TherapyLocationInsert) => {
      return await this.makeRequest<TherapyLocation>('/therapy/locations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: TherapyLocationUpdate) => {
      return await this.makeRequest<TherapyLocation>(`/therapy/locations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/therapy/locations/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Admin contacts methods
  adminContacts = {
    list: async (params: { status?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.status) qs.set('status', params.status);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<ContactMessage[]>(`/admin/contacts${suffix}`);
    },
    get: async (id: string) => {
      return await this.makeRequest<ContactMessage>(`/admin/contacts/${id}`);
    },
    update: async (id: string, data: ContactMessageUpdate) => {
      return await this.makeRequest<ContactMessage>(`/admin/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/contacts/${id}`, {
        method: 'DELETE',
      });
    },
    getUnreadCount: async () => {
      return await this.makeRequest<{ unread_count: number }>('/admin/contacts/unread-count');
    }
  };

  // Admin resources methods
  adminResources = {
    list: async (params: { category?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.category) qs.set('category', params.category);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<Resource[]>(`/admin/resources${suffix}`);
    },
    create: async (data: ResourceInsert) => {
      return await this.makeRequest<Resource>('/admin/resources', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: ResourceUpdate) => {
      return await this.makeRequest<Resource>(`/admin/resources/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/resources/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Admin articles methods
  adminArticles = {
    list: async (params: { q?: string; category?: string; status?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.category) qs.set('category', params.category);
      if (params.status) qs.set('status', params.status);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<ArticleSummary[]>(`/admin/articles${suffix}`);
    },
    get: async (id: string) => {
      return await this.makeRequest<Article>(`/admin/articles/${id}`);
    },
    create: async (data: ArticleInsert) => {
      return await this.makeRequest<Article>('/admin/articles', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: ArticleUpdate) => {
      return await this.makeRequest<Article>(`/admin/articles/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/articles/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Notification methods (authenticated)
  notifications = {
    list: async (params: NotificationListParams = {}) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      if (params.type) qs.set('type', params.type);
      if (params.read !== undefined) qs.set('read', String(params.read));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<Notification[]>(`/notifications${suffix}`);
    },
    get: async (id: string) => {
      return await this.makeRequest<Notification>(`/notifications/${id}`);
    },
    getStats: async () => {
      return await this.makeRequest<NotificationStats>('/notifications/stats');
    },
    getUnreadCount: async () => {
      return await this.makeRequest<{ unread_count: number }>('/notifications/unread-count');
    },
    markAsRead: async (id: string) => {
      return await this.makeRequest<void>(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },
    markAllAsRead: async () => {
      return await this.makeRequest<void>('/notifications/mark-all-read', {
        method: 'POST',
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/notifications/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Admin notifications methods
  adminNotifications = {
    list: async (params: { user_id?: string; type?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.user_id) qs.set('user_id', params.user_id);
      if (params.type) qs.set('type', params.type);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<Notification[]>(`/admin/notifications${suffix}`);
    },
    create: async (data: NotificationCreate) => {
      return await this.makeRequest<Notification>('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/notifications/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Admin users methods
  adminUsers = {
    list: async (params: { page?: number; page_size?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.page) qs.set('page', String(params.page));
      if (params.page_size) qs.set('page_size', String(params.page_size));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const response = await this.makeRequest<RawUser[]>(`/admin/users${suffix}`);
      if (response.data && Array.isArray(response.data)) {
        return { ...response, data: response.data.map(u => this.transformUser(u)) };
      }
      return response as ApiResponse<User[]>;
    },
    create: async (data: { email: string; password: string; role?: string; full_name?: string }) => {
      return await this.makeRequest<User>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateRole: async (id: string, role: string) => {
      return await this.makeRequest<User>(`/admin/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/users/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Admin jobs methods
  adminJobs = {
    list: async (params: { q?: string; status?: string; work_type?: string; employment_type?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.status) qs.set('status', params.status);
      if (params.work_type) qs.set('work_type', params.work_type);
      if (params.employment_type) qs.set('employment_type', params.employment_type);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<JobSummary[]>(`/admin/jobs/${suffix}`);
    },
    get: async (id: string) => {
      return await this.makeRequest<JobDetail>(`/admin/jobs/${id}`);
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/jobs/${id}`, {
        method: 'DELETE',
      });
    },
    applications: async (jobId: string) => {
      return await this.makeRequest<JobApplication[]>(`/admin/jobs/${jobId}/applications`);
    },
    create: async (data: Record<string, unknown>) => {
      return await this.makeRequest<JobDetail>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Record<string, unknown>) => {
      return await this.makeRequest<JobDetail>(`/jobs/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
  };

  // User methods
  users = {
    get: async (id: string) => {
      const response = await this.makeRequest<RawUser>(`/users/${id}`);
      if (response.data) {
        return { ...response, data: this.transformUser(response.data) };
      }
      return response as ApiResponse<User>;
    },

    getCurrent: async () => {
      const response = await this.makeRequest<RawUser>('/user');
      if (response.data) {
        return { ...response, data: this.transformUser(response.data) };
      }
      return response as ApiResponse<User>;
    },

    update: async (id: string, data: ProfileUpdate) => {
      const response = await this.makeRequest<RawUser>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (response.data) {
        return { ...response, data: this.transformUser(response.data) };
      }
      return response as ApiResponse<User>;
    },

    delete: async (id: string) => {
      return await this.makeRequest<void>(`/users/${id}`, {
        method: 'DELETE',
      });
    },

    list: async () => {
      return await this.makeRequest<User[]>('/users');
    }
  };

  // Appointment methods
  appointments = {
    get: async (id: string) => {
      return await this.makeRequest<Appointment>(`/appointments/${id}`);
    },

    list: async () => {
      return await this.makeRequest<Appointment[]>('/appointments');
    },

    create: async (data: AppointmentInsert) => {
      return await this.makeRequest<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: AppointmentUpdate) => {
      return await this.makeRequest<Appointment>(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return await this.makeRequest<void>(`/appointments/${id}`, {
        method: 'DELETE',
      });
    },

    getUserAppointments: async (userId: string) => {
      return await this.makeRequest<Appointment[]>(`/users/${userId}/appointments`);
    },

    getTherapistAppointments: async (therapistId: string) => {
      return await this.makeRequest<Appointment[]>(`/therapists/${therapistId}/appointments`);
    }
  };

  // Child profiles & progress tracking (orang_tua)
  children = {
    list: async () => {
      return await this.makeRequest<ChildProfile[]>('/me/children');
    },

    get: async (id: string) => {
      return await this.makeRequest<ChildProfile>(`/me/children/${id}`);
    },

    create: async (data: ChildProfileInput) => {
      return await this.makeRequest<ChildProfile>('/me/children', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (id: string, data: Partial<ChildProfileInput>) => {
      return await this.makeRequest<ChildProfile>(`/me/children/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return await this.makeRequest<void>(`/me/children/${id}`, {
        method: 'DELETE',
      });
    },

    sessionNotes: async (childId: string) => {
      return await this.makeRequest<SessionNote[]>(`/me/children/${childId}/session-notes`);
    },

    progressSummary: async (childId: string) => {
      return await this.makeRequest<ProgressMonthlySummary[]>(`/me/children/${childId}/progress-summary`);
    },

    milestones: async (childId: string) => {
      return await this.makeRequest<ChildMilestone[]>(`/me/children/${childId}/milestones`);
    },

    createMilestone: async (childId: string, data: ChildMilestoneInput) => {
      return await this.makeRequest<ChildMilestone>(`/me/children/${childId}/milestones`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    // Therapist side: children of the appointment's booker (to pick for a session note)
    forAppointment: async (appointmentId: string) => {
      return await this.makeRequest<ChildProfile[]>(`/appointments/${appointmentId}/children`);
    },

    // Therapist side: record a session note on an appointment
    createSessionNote: async (appointmentId: string, data: SessionNoteInput) => {
      return await this.makeRequest<SessionNote>(`/appointments/${appointmentId}/session-note`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  // Schedule methods (therapist)
  schedule = {
    get: async () => {
      return await this.makeRequest<ScheduleDetail>('/schedule');
    },
    create: async (data: { slot_duration_minutes?: number; slots: Array<{ day_of_week: number; start_time: string; end_time: string }> }) => {
      return await this.makeRequest<ScheduleDetail>('/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (data: { slot_duration_minutes?: number; slots: Array<{ day_of_week: number; start_time: string; end_time: string }> }) => {
      return await this.makeRequest<ScheduleDetail>('/schedule', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async () => {
      return await this.makeRequest<void>('/schedule', { method: 'DELETE' });
    },
    addException: async (data: { date: string; is_available?: boolean; reason?: string; start_time?: string; end_time?: string }) => {
      return await this.makeRequest<unknown>('/schedule/exceptions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    deleteException: async (id: string) => {
      return await this.makeRequest<void>(`/schedule/exceptions/${id}`, { method: 'DELETE' });
    },
    getTherapistSchedule: async (therapistId: string) => {
      return await this.makeRequest<ScheduleDetail>(`/therapists/${therapistId}/schedule`);
    },
    getAvailableSlots: async (therapistId: string, from: string, to: string) => {
      return await this.makeRequest<AvailableSlot[]>(`/therapists/${therapistId}/available-slots?from=${from}&to=${to}`);
    },
  };

  // Affiliation methods
  affiliations = {
    invite: async (data: { location_id: string; therapist_id: string; role?: string }) => {
      return await this.makeRequest<LocationTherapistAffiliation>('/affiliations/invite', {
        method: 'POST', body: JSON.stringify(data),
      });
    },
    accept: async (id: string) => {
      return await this.makeRequest<unknown>(`/affiliations/${id}/accept`, { method: 'POST' });
    },
    reject: async (id: string) => {
      return await this.makeRequest<unknown>(`/affiliations/${id}/reject`, { method: 'POST' });
    },
    deactivate: async (id: string) => {
      return await this.makeRequest<unknown>(`/affiliations/${id}/deactivate`, { method: 'POST' });
    },
    remove: async (id: string) => {
      return await this.makeRequest<void>(`/affiliations/${id}`, { method: 'DELETE' });
    },
    myInvitations: async () => {
      return await this.makeRequest<LocationTherapistAffiliation[]>('/me/affiliations');
    },
    listByLocation: async (locationId: string) => {
      return await this.makeRequest<LocationTherapistAffiliation[]>(`/therapy/locations/${locationId}/therapists`);
    },
  };

  // Therapy providers search (includes profile data)
  therapyProviders = {
    search: async (params: { q?: string; city?: string; with?: string; page?: number; per_page?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.city) qs.set('city_code', params.city);
      if (params.with) qs.set('with', params.with);
      if (params.page) qs.set('page', String(params.page));
      if (params.per_page) qs.set('per_page', String(params.per_page));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<TherapyProvider[]>(`/therapy/providers${suffix}`);
    },
  };

  // Forum methods
  forum = {
    listThreads: async () => {
      return await this.makeRequest<ForumThread[]>(`/public/forum/threads`);
    },
    getThread: async (id: string) => {
      return await this.makeRequest<ForumThread & { comments: ForumComment[] }>(`/public/forum/threads/${id}`);
    },
    createThread: async (data: { user_id: string; title: string; body: string }) => {
      return await this.makeRequest<ForumThread>(`/forum/threads`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    addComment: async (threadId: string, data: { user_id: string; body: string }) => {
      return await this.makeRequest<ForumComment>(`/forum/threads/${threadId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    addAnonymousComment: async (threadId: string, data: { body: string; display_name?: string }) => {
      return await this.makeRequest<ForumComment>(`/public/forum/threads/${threadId}/comments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  };

  // Helper to transform PascalCase to snake_case for event data
  private transformEvent(e: RawEvent): Event {
    return {
      id: e.ID || e.id || '',
      title: e.Title || e.title || '',
      mode: (e.Mode || e.mode || 'online').toLowerCase() as Event['mode'],
      start_at: e.StartAt || e.start_at || '',
      end_at: e.EndAt || e.end_at || '',
      host_user_id: e.HostUserID || e.host_user_id,
      community_id: e.CommunityID || e.community_id,
      capacity: e.Capacity || e.capacity,
      location: e.Location || e.location,
      join_url: e.JoinURL || e.join_url,
      host_url: e.HostURL || e.host_url,
      status: (e.Status || e.status || 'published') as Event['status'],
      published_at: e.PublishedAt || e.published_at,
      created_at: e.CreatedAt || e.created_at || '',
      updated_at: e.UpdatedAt || e.updated_at || '',
    };
  }

  // Helper to transform PascalCase to snake_case for community data
  private transformCommunity(c: RawCommunity): Community {
    return {
      id: c.ID || c.id || '',
      name: c.Name || c.name || '',
      description: c.Description || c.description,
      tags: c.Tags || c.tags,
      is_private: c.IsPrivate || c.is_private || false,
      created_by: c.CreatedBy || c.created_by,
      created_at: c.CreatedAt || c.created_at || '',
    };
  }

  // Helper to transform PascalCase to snake_case for user data
  private transformUser(u: RawUser): User {
    const p = (u.Profile || u.profile || {}) as Record<string, string | undefined>;
    return {
      id: u.ID || u.id || u.user_id || '',
      email: u.Email || u.email || '',
      role: u.Role || u.role || 'user_disabilitas',
      full_name: p.FullName || p.full_name || u.FullName || u.full_name || u.name,
      name: p.FullName || p.full_name || u.FullName || u.full_name || u.name,
      phone: p.Phone || p.phone || u.Phone || u.phone,
      address: p.Address || p.address || u.Address || u.address,
      city: p.City || p.city || u.City || u.city,
      date_of_birth: p.DateOfBirth || p.date_of_birth || u.DateOfBirth || u.date_of_birth,
      gender: p.Gender || p.gender || u.Gender || u.gender,
      avatar_url: p.AvatarURL || p.avatar_url || u.AvatarURL || u.avatar_url,
      created_at: u.CreatedAt || u.created_at,
      updated_at: u.UpdatedAt || u.updated_at,
    };
  }

  // Events methods
  events = {
    list: async (params: { limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const response = await this.makeRequest<RawEvent[]>(`/events${suffix}`);
      if (response.data && Array.isArray(response.data)) {
        return { ...response, data: response.data.map(e => this.transformEvent(e)) };
      }
      return response as ApiResponse<Event[]>;
    },
    get: async (id: string) => {
      const response = await this.makeRequest<RawEvent>(`/events/${id}`);
      if (response.data) {
        return { ...response, data: this.transformEvent(response.data) };
      }
      return response as ApiResponse<Event>;
    },
    create: async (data: EventCreate) => {
      return await this.makeRequest<Event>('/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    rsvp: async (id: string, status: RSVPStatus) => {
      return await this.makeRequest<EventParticipant>(`/events/${id}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
    }
  };

  // Jobs methods (protected)
  jobs = {
    create: async (data: Record<string, unknown>) => {
      return await this.makeRequest<JobDetail>('/jobs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    apply: async (jobId: string, data: { cover_letter?: string; resume_url?: string }) => {
      return await this.makeRequest<JobApplication>(`/jobs/${jobId}/apply`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    myApplications: async () => {
      return await this.makeRequest<JobApplication[]>('/me/job-applications');
    }
  };

  // Trainings methods (protected)
  trainings = {
    create: async (data: Record<string, unknown>) => {
      return await this.makeRequest<TrainingDetail>('/trainings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    register: async (trainingId: string, data: { motivation?: string }) => {
      return await this.makeRequest<TrainingRegistration>(`/trainings/${trainingId}/register`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    myRegistrations: async () => {
      return await this.makeRequest<TrainingRegistration[]>('/me/training-registrations');
    },
    materials: async (trainingId: string) => {
      return await this.makeRequest<TrainingMaterial[]>(`/trainings/${trainingId}/materials`);
    },
    materialDownload: async (trainingId: string, materialId: string) => {
      return await this.makeRequest<{ download_url: string; material: TrainingMaterial }>(`/trainings/${trainingId}/materials/${materialId}/download`);
    }
  };

  // Admin trainings methods
  adminTrainings = {
    list: async (params: { q?: string; status?: string; category?: string; training_type?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.status) qs.set('status', params.status);
      if (params.category) qs.set('category', params.category);
      if (params.training_type) qs.set('training_type', params.training_type);
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<TrainingSummary[]>(`/admin/trainings/${suffix}`);
    },
    get: async (id: string) => {
      return await this.makeRequest<TrainingDetail>(`/admin/trainings/${id}`);
    },
    create: async (data: Record<string, unknown>) => {
      return await this.makeRequest<TrainingDetail>('/admin/trainings/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: Record<string, unknown>) => {
      return await this.makeRequest<TrainingDetail>(`/admin/trainings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/trainings/${id}`, {
        method: 'DELETE',
      });
    },
    registrations: async (trainingId: string) => {
      return await this.makeRequest<TrainingRegistration[]>(`/admin/trainings/${trainingId}/registrations`);
    },
    updateRegistrationStatus: async (trainingId: string, regId: string, status: string) => {
      return await this.makeRequest<{ id: string; status: string }>(`/admin/trainings/${trainingId}/registrations/${regId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
    },
    presignUpload: async (trainingId: string, data: { file_name: string; content_type: string; file_size: number }) => {
      return await this.makeRequest<{ upload_url: string; material_id: string; s3_key: string; content_type: string; file_name: string; file_size: number }>(`/admin/trainings/${trainingId}/materials/presign`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    confirmMaterial: async (trainingId: string, data: { material_id: string; name: string; s3_key: string; content_type: string; file_size: number }) => {
      return await this.makeRequest<TrainingMaterial>(`/admin/trainings/${trainingId}/materials`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    listMaterials: async (trainingId: string) => {
      return await this.makeRequest<TrainingMaterial[]>(`/admin/trainings/${trainingId}/materials`);
    },
    downloadMaterial: async (trainingId: string, materialId: string) => {
      return await this.makeRequest<{ download_url: string; material: TrainingMaterial }>(`/admin/trainings/${trainingId}/materials/${materialId}/download`);
    },
    deleteMaterial: async (trainingId: string, materialId: string) => {
      return await this.makeRequest<void>(`/admin/trainings/${trainingId}/materials/${materialId}`, {
        method: 'DELETE',
      });
    },
  };

  // Admin events methods
  adminEvents = {
    list: async (params: { limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const response = await this.makeRequest<RawEvent[]>(`/admin/events${suffix}`);
      if (response.data && Array.isArray(response.data)) {
        return { ...response, data: response.data.map(e => this.transformEvent(e)) };
      }
      return response as ApiResponse<Event[]>;
    },
    get: async (id: string) => {
      const response = await this.makeRequest<RawEvent>(`/admin/events/${id}`);
      if (response.data) {
        return { ...response, data: this.transformEvent(response.data) };
      }
      return response as ApiResponse<Event>;
    },
    create: async (data: EventCreate) => {
      return await this.makeRequest<Event>('/admin/events', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: EventUpdate) => {
      return await this.makeRequest<Event>(`/admin/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return await this.makeRequest<void>(`/admin/events/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Admin Forum methods
  adminForum = {
    getStats: async () => {
      return await this.makeRequest<{ total_threads: number; total_replies: number }>('/admin/forum/stats');
    },
    listThreads: async (params: { limit?: number; offset?: number; q?: string } = {}) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      if (params.q) qs.set('q', params.q);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<ForumThread[]>(`/admin/forum/threads${suffix}`);
    },
    getThread: async (id: string) => {
      return await this.makeRequest<ForumThread & { comments: ForumComment[] }>(`/admin/forum/threads/${id}`);
    },
    updateThread: async (id: string, data: { title?: string; body?: string; status?: string; is_pinned?: boolean }) => {
      return await this.makeRequest<ForumThread>(`/admin/forum/threads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteThread: async (id: string) => {
      return await this.makeRequest<void>(`/admin/forum/threads/${id}`, {
        method: 'DELETE',
      });
    },
    listReplies: async (params: { limit?: number; offset?: number; thread_id?: string } = {}) => {
      const qs = new URLSearchParams();
      if (params.limit) qs.set('limit', String(params.limit));
      if (params.offset) qs.set('offset', String(params.offset));
      if (params.thread_id) qs.set('thread_id', params.thread_id);
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return await this.makeRequest<ForumComment[]>(`/admin/forum/replies${suffix}`);
    },
    updateReply: async (id: string, data: { body?: string; status?: string }) => {
      return await this.makeRequest<ForumComment>(`/admin/forum/replies/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    deleteReply: async (id: string) => {
      return await this.makeRequest<void>(`/admin/forum/replies/${id}`, {
        method: 'DELETE',
      });
    }
  };

  // Communities methods
  communities = {
    list: async (params: CommunityListParams = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.page) qs.set('page', String(params.page));
      if (params.per_page) qs.set('per_page', String(params.per_page));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      const response = await this.makeRequest<RawCommunity[]>(`/communities${suffix}`);
      if (response.data && Array.isArray(response.data)) {
        return { ...response, data: response.data.map(c => this.transformCommunity(c)) };
      }
      return response as ApiResponse<Community[]>;
    },
    get: async (id: string) => {
      const response = await this.makeRequest<RawCommunity>(`/communities/${id}`);
      if (response.data) {
        return { ...response, data: this.transformCommunity(response.data) };
      }
      return response as ApiResponse<Community>;
    },
    create: async (data: CommunityCreate) => {
      return await this.makeRequest<Community>('/communities', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  };

  // Shortcuts for backward compatibility
  get publicArticles() {
    return {
      list: this.public.articles.list,
      get: this.public.articles.get,
      categories: this.public.articles.getCategories
    };
  }

  get publicJobs() {
    return {
      list: this.public.jobs.list,
      get: this.public.jobs.get,
    };
  }

  get publicTrainings() {
    return {
      list: this.public.trainings.list,
      get: this.public.trainings.get,
    };
  }

  get publicResources() {
    return {
      list: this.public.resources.list,
      get: this.public.resources.get,
      categories: this.public.resources.getCategories
    };
  }

  get publicTherapists() {
    return this.public.therapists;
  }

  get publicTherapyLocations() {
    return this.public.therapyLocations;
  }

  // Database-like methods (kept for backward compatibility)
  from = (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: string | number | boolean) => this.makeRequest<unknown>(`/${table}?${column}=${encodeURIComponent(String(value))}&select=${columns || '*'}`),
      execute: () => this.makeRequest<unknown>(`/${table}?select=${columns || '*'}`)
    }),
    insert: (data: Record<string, unknown>) => this.makeRequest<unknown>(`/${table}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (data: Record<string, unknown>) => ({
      eq: (column: string, value: string | number | boolean) => this.makeRequest<unknown>(`/${table}/${encodeURIComponent(String(value))}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    }),
    delete: () => ({
      eq: (column: string, value: string | number | boolean) => this.makeRequest<void>(`/${table}/${encodeURIComponent(String(value))}`, {
        method: 'DELETE',
      })
    })
  });

  private async makeFormDataRequest<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for AI

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        return { data: null as unknown as T, error: errorData.error || errorData.message || response.statusText, status: response.status };
      }

      const contentType = response.headers.get('Content-Type') || '';

      // Handle audio response (TTS returns audio)
      if (contentType.includes('audio/')) {
        const blob = await response.blob();
        return { data: blob as unknown as T, error: undefined };
      }

      const data = await response.json();
      return { data: data.data ?? data, error: undefined };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { data: null as unknown as T, error: 'Request timeout' };
        }
        return { data: null as unknown as T, error: error.message };
      }
      return { data: null as unknown as T, error: 'Unknown error occurred' };
    }
  }

  private async makeBlobRequest(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<ApiResponse<Blob>> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        return { data: null as unknown as Blob, error: errorData.error || errorData.message || response.statusText, status: response.status };
      }

      const blob = await response.blob();
      return { data: blob, error: undefined };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { data: null as unknown as Blob, error: 'Request timeout' };
        }
        return { data: null as unknown as Blob, error: error.message };
      }
      return { data: null as unknown as Blob, error: 'Unknown error occurred' };
    }
  }

  // AI Isyarat (Sign Language) methods
  aiIsyarat = {
    recognize: async (image: File) => {
      const formData = new FormData();
      formData.append('file', image);
      return await this.makeFormDataRequest<SignRecognitionResult>('/ai/isyarat/recognize', formData);
    },

    recognizeSequence: async (images: File[]) => {
      const formData = new FormData();
      images.forEach(img => formData.append('files', img));
      return await this.makeFormDataRequest<SignRecognitionResult>('/ai/isyarat/recognize/sequence', formData);
    },

    dictionary: async (query?: string) => {
      const qs = query ? `?q=${encodeURIComponent(query)}` : '';
      return await this.makeRequest<DictionaryEntry[]>(`/ai/isyarat/dictionary${qs}`);
    },

    dictionaryGet: async (key: string) => {
      return await this.makeRequest<DictionaryEntry>(`/ai/isyarat/dictionary/${key}`);
    },

    tts: async (text: string) => {
      return await this.makeBlobRequest('/ai/isyarat/tts', { text });
    },
  };

  // AI Vision methods
  aiVision = {
    detect: async (image: File) => {
      const formData = new FormData();
      formData.append('file', image);
      return await this.makeFormDataRequest<ObjectDetectionResult>('/ai/vision/detect', formData);
    },

    ocr: async (image: File) => {
      const formData = new FormData();
      formData.append('file', image);
      return await this.makeFormDataRequest<OCRResult>('/ai/vision/ocr', formData);
    },

    describe: async (image: File) => {
      const formData = new FormData();
      formData.append('file', image);
      return await this.makeFormDataRequest<SceneDescription>('/ai/vision/describe', formData);
    },

    tts: async (text: string) => {
      return await this.makeBlobRequest('/ai/vision/tts', { text });
    },
  };

  // AI Currency Detection methods
  aiCurrency = {
    detect: async (image: File) => {
      const formData = new FormData();
      formData.append('file', image);
      return await this.makeFormDataRequest<CurrencyDetectionResult>('/ai/currency/detect', formData);
    },

    tts: async (text: string) => {
      return await this.makeBlobRequest('/ai/currency/tts', { text });
    },
  };

  // AI Health check
  aiHealth = async () => {
    return await this.makeRequest<AIHealthStatus>('/ai/health');
  };

  private setAuthToken(token: string) {
    this.authToken = token;
    const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
    localStorage.setItem(tokenKey, token);
  }

  private removeAuthToken() {
    this.authToken = null;
    const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';
    localStorage.removeItem(tokenKey);
  }

  private clearAllTokens() {
    this.authToken = null;
    const tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY || 'auth_token';

    // Remove all possible auth-related keys
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('session');
  }
}

export const apiClient = new ApiClient();

// Export everything from types for convenience
export * from './types';
