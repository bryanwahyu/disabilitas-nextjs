/**
 * Taksonomi ragam disabilitas — cermin dari
 * `disabilitasku-core/disabilitasku/api/internal/domain/disability/taxonomy.go`.
 *
 * Sebelumnya tiap form memakai input teks bebas, jadi satu ragam bisa tersimpan
 * sebagai "tunarungu", "Tuli", atau "gangguan pendengaran" — filter meleset dan
 * jumlah pengguna per ragam mustahil dihitung. Semua form sekarang mengirim
 * slug dari daftar ini.
 *
 * Kalau daftar di sini berubah, ubah juga taxonomy.go (ada test yang menjaga
 * sisi Go; sisi ini dijaga lewat endpoint `GET /public/disability-types`).
 */

export type DisabilityGroup =
  | 'fisik'
  | 'sensorik'
  | 'intelektual'
  | 'mental'
  | 'ganda'
  | 'umum';

export interface DisabilityType {
  slug: string;
  label: string;
  group: DisabilityGroup;
  description: string;
  /** Istilah lama yang masih ada di data — dipakai untuk menampilkan label yang benar. */
  aliases: string[];
  /** Kelas warna badge. */
  badgeClass: string;
}

export const DISABILITY_TYPES: DisabilityType[] = [
  {
    slug: 'fisik',
    label: 'Disabilitas Fisik',
    group: 'fisik',
    description: 'Gangguan gerak/mobilitas — cerebral palsy, amputasi, pengguna kursi roda.',
    aliases: ['tunadaksa', 'tuna daksa', 'daksa', 'cerebral palsy', 'cp', 'kursi roda', 'lumpuh', 'polio'],
    badgeClass: 'bg-orange-100 text-orange-800',
  },
  {
    slug: 'netra',
    label: 'Disabilitas Netra',
    group: 'sensorik',
    description: 'Buta total maupun low vision.',
    aliases: ['tunanetra', 'tuna netra', 'buta', 'low vision', 'gangguan penglihatan'],
    badgeClass: 'bg-cyan-100 text-cyan-800',
  },
  {
    slug: 'rungu',
    label: 'Disabilitas Rungu / Tuli',
    group: 'sensorik',
    description: 'Tuli maupun kurang dengar, termasuk pengguna bahasa isyarat.',
    aliases: ['tunarungu', 'tuna rungu', 'tuli', 'kurang dengar', 'gangguan pendengaran'],
    badgeClass: 'bg-pink-100 text-pink-800',
  },
  {
    slug: 'wicara',
    label: 'Disabilitas Wicara',
    group: 'sensorik',
    description: 'Gangguan bicara/bahasa, termasuk keterlambatan bicara.',
    aliases: ['tunawicara', 'tuna wicara', 'bisu', 'gangguan bicara', 'terlambat bicara', 'speech delay'],
    badgeClass: 'bg-sky-100 text-sky-800',
  },
  {
    slug: 'intelektual',
    label: 'Disabilitas Intelektual',
    group: 'intelektual',
    description: 'Hambatan fungsi intelektual — termasuk Down syndrome.',
    aliases: ['tunagrahita', 'tuna grahita', 'grahita', 'down syndrome', 'sindrom down', 'retardasi mental'],
    badgeClass: 'bg-yellow-100 text-yellow-800',
  },
  {
    slug: 'mental',
    label: 'Disabilitas Mental / Psikososial',
    group: 'mental',
    description: 'Kondisi psikososial jangka panjang — skizofrenia, bipolar, kecemasan berat.',
    aliases: ['tunalaras', 'tuna laras', 'psikososial', 'skizofrenia', 'bipolar', 'gangguan jiwa'],
    badgeClass: 'bg-indigo-100 text-indigo-800',
  },
  {
    slug: 'autisme',
    label: 'Spektrum Autisme',
    group: 'mental',
    description: 'Autism spectrum disorder, termasuk Asperger.',
    aliases: ['autis', 'autism', 'asd', 'spektrum autisme', 'asperger'],
    badgeClass: 'bg-violet-100 text-violet-800',
  },
  {
    slug: 'belajar',
    label: 'Kesulitan Belajar & Atensi',
    group: 'intelektual',
    description: 'Disleksia, diskalkulia, disgrafia, ADHD.',
    aliases: ['kesulitan belajar', 'disleksia', 'diskalkulia', 'disgrafia', 'adhd', 'hiperaktif'],
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  {
    slug: 'ganda',
    label: 'Disabilitas Ganda',
    group: 'ganda',
    description: 'Dua ragam atau lebih sekaligus, termasuk tuli-netra.',
    aliases: ['tunaganda', 'tuna ganda', 'majemuk', 'deafblind'],
    badgeClass: 'bg-red-100 text-red-800',
  },
  {
    slug: 'semua',
    label: 'Semua Ragam',
    group: 'umum',
    description: 'Terbuka untuk semua ragam disabilitas.',
    aliases: ['semua disabilitas', 'all', 'umum', 'inklusif'],
    badgeClass: 'bg-emerald-100 text-emerald-800',
  },
];

export const DISABILITY_GROUP_LABELS: Record<DisabilityGroup, string> = {
  fisik: 'Fisik',
  sensorik: 'Sensorik',
  intelektual: 'Intelektual',
  mental: 'Mental & Perilaku',
  ganda: 'Ganda',
  umum: 'Umum',
};

const bySlug = new Map(DISABILITY_TYPES.map((t) => [t.slug, t]));

const byAlias = new Map<string, DisabilityType>();
for (const t of DISABILITY_TYPES) {
  byAlias.set(t.slug, t);
  for (const a of t.aliases) byAlias.set(a, t);
}

function normalizeToken(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[_\-.()]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Cari ragam dari slug atau istilah lama. */
export function findDisabilityType(raw: string): DisabilityType | undefined {
  const token = normalizeToken(raw);
  const exact = byAlias.get(token);
  if (exact) return exact;
  // Data lama bisa berupa frasa ("anak dengan autisme") — cocokkan istilah
  // terpanjang yang muncul di dalamnya.
  let best: DisabilityType | undefined;
  let bestLen = 0;
  for (const [alias, type] of byAlias) {
    if (alias.length > bestLen && alias.length >= 4 && token.includes(alias)) {
      best = type;
      bestLen = alias.length;
    }
  }
  return best;
}

/** Label tampilan untuk satu nilai; istilah tak dikenal ditampilkan apa adanya. */
export function disabilityLabel(raw: string): string {
  return findDisabilityType(raw)?.label ?? raw.trim();
}

/** Kelas warna badge untuk satu nilai. */
export function disabilityBadgeClass(raw: string): string {
  return findDisabilityType(raw)?.badgeClass ?? 'bg-gray-100 text-gray-700';
}

/** Pecah CSV dari API jadi daftar slug/nilai, buang yang kosong. */
export function parseDisabilityCSV(csv?: string | null): string[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Gabungkan pilihan jadi CSV untuk dikirim ke API. */
export function toDisabilityCSV(slugs: string[]): string {
  const seen = new Set<string>();
  return DISABILITY_TYPES.filter((t) => slugs.includes(t.slug))
    .filter((t) => (seen.has(t.slug) ? false : (seen.add(t.slug), true)))
    .map((t) => t.slug)
    .join(',');
}

/**
 * Ubah nilai apa pun dari API (termasuk teks bebas lama) jadi daftar slug
 * kanonik — supaya form edit tetap menandai kotak yang benar untuk data lama.
 */
export function toCanonicalSlugs(csv?: string | null): string[] {
  const out: string[] = [];
  for (const raw of parseDisabilityCSV(csv)) {
    const t = findDisabilityType(raw);
    if (t && !out.includes(t.slug)) out.push(t.slug);
  }
  return out;
}

export function isCanonicalSlug(slug: string): boolean {
  return bySlug.has(slug);
}
