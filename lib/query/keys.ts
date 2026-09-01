/**
 * Query key factory.
 *
 * Semua key diawali `['dsk']` supaya `queryClient.invalidateQueries()` per-domain
 * tidak pernah menyenggol cache library lain, dan bentuknya seragam:
 *
 *   ['dsk', <domain>, 'list', <params>]
 *   ['dsk', <domain>, 'detail', <id>]
 *   ['dsk', <domain>, 'detail', <id>, <sub>, <params>]
 *
 * Karena hierarkis, invalidasi bisa dipilih selebar yang dibutuhkan:
 *
 *   qk.articles.all()          → semua artikel (list + detail)
 *   qk.articles.lists()        → semua varian list, apa pun filternya
 *   qk.articles.detail(slug)   → satu artikel
 *
 * Jangan tulis key sebagai array literal di halaman — selalu lewat factory ini,
 * supaya mutation tahu persis apa yang harus di-invalidate.
 */

const ROOT = 'dsk' as const;

type Params = Record<string, unknown> | undefined;

function domain<D extends string>(name: D) {
  return {
    all: () => [ROOT, name] as const,
    lists: () => [ROOT, name, 'list'] as const,
    list: (params?: Params) => [ROOT, name, 'list', params ?? {}] as const,
    details: () => [ROOT, name, 'detail'] as const,
    detail: (id: string | number) => [ROOT, name, 'detail', String(id)] as const,
    /** Resource turunan dari satu entitas, mis. jurnal milik seorang anak. */
    sub: (id: string | number, sub: string, params?: Params) =>
      [ROOT, name, 'detail', String(id), sub, params ?? {}] as const,
    /** Endpoint tunggal tanpa id, mis. daftar kategori. */
    of: (sub: string, params?: Params) => [ROOT, name, sub, params ?? {}] as const,
  };
}

export const qk = {
  all: [ROOT] as const,

  // --- Sesi & identitas ---
  me: () => [ROOT, 'me'] as const,
  session: domain('session'),
  users: domain('users'),
  profile: domain('profile'),
  notifications: domain('notifications'),

  // --- Konten publik ---
  articles: domain('articles'),
  reviews: domain('reviews'),
  trainings: domain('trainings'),
  events: domain('events'),
  forum: domain('forum'),
  communities: domain('communities'),
  jobs: domain('jobs'),
  reports: domain('reports'),
  complaints: domain('complaints'),
  tumbuhKembang: domain('tumbuh-kembang'),

  // --- Discovery layanan ---
  locations: domain('locations'),
  therapists: domain('therapists'),
  therapyProviders: domain('therapy-providers'),

  // --- Alur terapi ---
  appointments: domain('appointments'),
  children: domain('children'),
  schedule: domain('schedule'),
  availableSlots: domain('available-slots'),
  sessionNotes: domain('session-notes'),
  affiliations: domain('affiliations'),
  consultations: domain('consultations'),
  programs: domain('programs'),
  pricing: domain('pricing'),

  // --- Portal admin (dipisah supaya invalidasi admin tak menyentuh cache publik) ---
  admin: {
    users: domain('admin/users'),
    locations: domain('admin/locations'),
    therapyLocations: domain('admin/therapy-locations'),
    articles: domain('admin/articles'),
    trainings: domain('admin/trainings'),
    events: domain('admin/events'),
    forum: domain('admin/forum'),
    jobs: domain('admin/jobs'),
    books: domain('admin/books'),
    resources: domain('admin/resources'),
    contacts: domain('admin/contacts'),
    complaints: domain('admin/complaints'),
    consultations: domain('admin/consultations'),
    notifications: domain('admin/notifications'),
    pricing: domain('admin/pricing'),
    reports: domain('admin/reports'),
    appointments: domain('admin/appointments'),
    holidays: domain('admin/holidays'),
  },

  // --- Portal yayasan ---
  yayasan: {
    locations: domain('yayasan/locations'),
    therapists: domain('yayasan/therapists'),
    schedule: domain('yayasan/schedule'),
    appointments: domain('yayasan/appointments'),
    events: domain('yayasan/events'),
    trainings: domain('yayasan/trainings'),
    pricing: domain('yayasan/pricing'),
    reviews: domain('yayasan/reviews'),
  },

  // --- Portal terapis ---
  terapis: {
    schedule: domain('terapis/schedule'),
    scheduleExceptions: domain('terapis/schedule-exceptions'),
    myTrainings: domain('terapis/my-trainings'),
    myCommunities: domain('terapis/my-communities'),
    appointments: domain('terapis/appointments'),
    sessionNotes: domain('terapis/session-notes'),
    affiliations: domain('terapis/affiliations'),
    reviews: domain('terapis/reviews'),
    trainings: domain('terapis/trainings'),
    communities: domain('terapis/communities'),
    consultations: domain('terapis/consultations'),
    profile: domain('terapis/profile'),
  },
} as const;

export type QueryKey = ReturnType<
  ReturnType<typeof domain>[keyof ReturnType<typeof domain>]
>;
