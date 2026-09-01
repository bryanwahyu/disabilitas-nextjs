import { metaFrom } from '@/lib/seo/head';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, Save } from 'lucide-react';
import { api, type TherapistProfile, type TherapistProfileInput } from '@/lib/terapis/api';
import { qk } from '@/lib/query/keys';

export const Route = createFileRoute('/portal-terapis/dashboard/profil/')({
  head: () => metaFrom(metadata),
  component: ProfilPage,
});

const metadata = { title: 'Profil Terapis' };

/**
 * Metode konsultasi disimpan sebagai CSV di satu kolom, dan nilainya dipakai
 * apa adanya oleh filter direktori publik (`?method=`). Slug-nya harus persis
 * seperti ini — daftar yang sama ada di halaman /terapis.
 */
const METHODS = [
  { value: 'online', label: 'Online' },
  { value: 'home_visit', label: 'Home Visit' },
  { value: 'klinik', label: 'Datang ke Klinik' },
];

type FormState = {
  full_name: string;
  phone: string;
  city: string;
  district: string;
  specialization: string;
  experience_years: string;
  bio: string;
  certifications: string;
  languages: string;
  rate_min: string;
  rate_max: string;
  bpjs_accepted: boolean;
  methods: string[];
};

const EMPTY: FormState = {
  full_name: '',
  phone: '',
  city: '',
  district: '',
  specialization: '',
  experience_years: '',
  bio: '',
  certifications: '',
  languages: '',
  rate_min: '',
  rate_max: '',
  bpjs_accepted: false,
  methods: [],
};

/** Baca field yang bisa datang PascalCase (kolom lama) atau snake_case. */
function readEither(p: TherapistProfile | undefined, pascal: keyof TherapistProfile, snake: keyof TherapistProfile): string {
  const v = (p?.[pascal] ?? p?.[snake]) as string | null | undefined;
  return v ?? '';
}

function toForm(p: TherapistProfile | undefined): FormState {
  return {
    full_name: readEither(p, 'FullName', 'full_name'),
    phone: readEither(p, 'Phone', 'phone'),
    city: readEither(p, 'City', 'city'),
    district: readEither(p, 'District', 'district'),
    specialization: p?.specialization ?? '',
    experience_years: p?.experience_years != null ? String(p.experience_years) : '',
    bio: p?.bio ?? '',
    certifications: p?.certifications ?? '',
    languages: p?.languages ?? '',
    rate_min: p?.rate_min != null ? String(p.rate_min) : '',
    rate_max: p?.rate_max != null ? String(p.rate_max) : '',
    bpjs_accepted: !!p?.bpjs_accepted,
    methods: (p?.consultation_methods ?? '')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
  };
}

/**
 * Kelengkapan profil, bukan sekadar hiasan.
 *
 * Setiap filter di direktori publik menyaring salah satu kolom ini; profil yang
 * kosong berarti terapisnya tidak pernah muncul saat orang tua menyaring
 * berdasarkan kota, metode, atau biaya. Daftar ini yang menjelaskan sebabnya.
 */
function completeness(f: FormState) {
  const checks = [
    { label: 'Nama lengkap', done: !!f.full_name.trim() },
    { label: 'Kota', done: !!f.city.trim() },
    { label: 'Spesialisasi', done: !!f.specialization.trim() },
    { label: 'Metode konsultasi', done: f.methods.length > 0 },
    { label: 'Biaya per sesi', done: !!f.rate_min.trim() || !!f.rate_max.trim() },
    { label: 'Tentang Anda', done: f.bio.trim().length >= 40 },
  ];
  const done = checks.filter((c) => c.done).length;
  return { checks, done, total: checks.length, percent: Math.round((done / checks.length) * 100) };
}

function ProfilPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: me, isPending } = useQuery({
    queryKey: qk.terapis.profile.detail('me'),
    queryFn: () => api.getMe(),
  });

  // Isi form sekali dari server; setelah disentuh, ketikan tidak boleh ditimpa
  // hasil refetch di tengah pengisian.
  useEffect(() => {
    if (me && !touched) setForm(toForm(me.Profile));
  }, [me, touched]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (body: TherapistProfileInput) => api.updateProfile(me!.ID, body),
    onSuccess: () => {
      setSaved(true);
      setError('');
      setTouched(false);
      qc.invalidateQueries({ queryKey: qk.terapis.profile.all() });
    },
    onError: (e: Error) => setError(e.message || 'Gagal menyimpan profil'),
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setTouched(true);
    setSaved(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const toggleMethod = (value: string) =>
    set(
      'methods',
      form.methods.includes(value)
        ? form.methods.filter((m) => m !== value)
        : [...form.methods, value]
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const min = form.rate_min ? Number(form.rate_min) : undefined;
    const max = form.rate_max ? Number(form.rate_max) : undefined;
    if (min != null && max != null && min > max) {
      setError('Biaya minimum tidak boleh lebih besar dari maksimum.');
      return;
    }

    save({
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      district: form.district.trim(),
      specialization: form.specialization.trim(),
      experience_years: form.experience_years ? Number(form.experience_years) : undefined,
      bio: form.bio.trim(),
      certifications: form.certifications.trim(),
      languages: form.languages.trim(),
      rate_min: min,
      rate_max: max,
      bpjs_accepted: form.bpjs_accepted,
      consultation_methods: form.methods.join(','),
    });
  };

  const progress = completeness(form);

  if (isPending) {
    return (
      <div className="p-8 flex items-center gap-3 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin" />
        Memuat profil…
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Profil Terapis</h1>
      <p className="text-slate-400 text-sm mb-8">
        Data di halaman ini yang dipakai orang tua saat mencari terapis di DisabilitasKu.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white">Kelengkapan profil</p>
          <p className="text-sm text-slate-400">
            {progress.done}/{progress.total}
          </p>
        </div>
        <div
          className="h-2 rounded-full bg-slate-800 overflow-hidden"
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Kelengkapan profil"
        >
          <div className="h-full bg-teal-500 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
        <ul className="mt-4 grid sm:grid-cols-2 gap-1.5 text-sm">
          {progress.checks.map((c) => (
            <li key={c.label} className={c.done ? 'text-slate-400' : 'text-amber-300'}>
              {c.done ? '✓' : '•'} {c.label}
            </li>
          ))}
        </ul>
        {progress.done < progress.total && (
          <p className="text-xs text-slate-500 mt-3">
            Bagian yang belum terisi membuat Anda tidak muncul saat orang tua menyaring
            berdasarkan kota, metode konsultasi, atau biaya.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Field label="Nama lengkap" id="full_name">
          <input
            id="full_name"
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Kota"
            id="city"
            hint="Pilih dari daftar — filter kota di direktori mencocokkan nama persis"
          >
            <CityPicker value={form.city} onChange={(v) => set('city', v)} />
          </Field>
          <Field label="Kecamatan" id="district">
            <input
              id="district"
              value={form.district}
              onChange={(e) => set('district', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Spesialisasi" id="specialization" hint="Mis. terapi wicara, okupasi, ABA">
            <input
              id="specialization"
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Pengalaman (tahun)" id="experience_years">
            <input
              id="experience_years"
              type="number"
              min={0}
              value={form.experience_years}
              onChange={(e) => set('experience_years', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Nomor telepon" id="phone" hint="Hanya tampil ke pengguna yang sudah masuk">
          <input id="phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
        </Field>

        <Field label="Tentang Anda" id="bio" hint="Ceritakan pendekatan terapi dan siapa yang biasa Anda dampingi">
          <textarea
            id="bio"
            rows={5}
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Sertifikasi & pendidikan" id="certifications">
          <textarea
            id="certifications"
            rows={3}
            value={form.certifications}
            onChange={(e) => set('certifications', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Bahasa" id="languages" hint="Mis. Indonesia, Jawa, isyarat (BISINDO)">
          <input
            id="languages"
            value={form.languages}
            onChange={(e) => set('languages', e.target.value)}
            className={inputClass}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-slate-300 mb-2">Metode konsultasi</legend>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((m) => {
              const active = form.methods.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleMethod(m.value)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'border-teal-500/40 bg-teal-500/10 text-teal-300'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Biaya minimum per sesi (Rp)" id="rate_min">
            <input
              id="rate_min"
              type="number"
              min={0}
              value={form.rate_min}
              onChange={(e) => set('rate_min', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Biaya maksimum per sesi (Rp)" id="rate_max">
            <input
              id="rate_max"
              type="number"
              min={0}
              value={form.rate_max}
              onChange={(e) => set('rate_max', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.bpjs_accepted}
            onChange={(e) => set('bpjs_accepted', e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800"
          />
          Menerima BPJS
        </label>

        {error && (
          <p role="alert" className="text-sm text-rose-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Simpan Profil
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Tersimpan
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';

function Field({
  label,
  id,
  hint,
  children,
}: {
  label: string;
  id: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

/**
 * Pemilih kota dengan pencarian.
 *
 * Bukan teks bebas: `therapy.Repository.Search` mencocokkan `up.city` dengan
 * NAMA kota hasil `CityByCode`, jadi "Jkt" atau "jakarta selatan " membuat
 * terapisnya tidak pernah muncul saat orang tua menyaring kota. Nilai yang
 * sudah tersimpan tetap ditampilkan apa adanya supaya profil lama tidak
 * terlihat kosong sebelum dipilih ulang.
 */
function CityPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [term, setTerm] = useState(value);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTerm(value);
  }, [value]);

  const { data: cities = [] } = useQuery({
    queryKey: qk.terapis.profile.of('cities', { term }),
    queryFn: async () => (await api.searchCities(term)).items ?? [],
    enabled: open && term.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="relative">
      <input
        id="city"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Blur ditunda supaya klik pada saran tidak keburu menutup daftarnya.
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        placeholder="Ketik nama kota…"
        className={inputClass}
      />
      {open && cities.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-lg">
          {cities.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(c.name);
                  setTerm(c.name);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {term.trim() && term !== value && (
        <p className="text-xs text-amber-300 mt-1">
          Belum dipilih dari daftar — pilih salah satu saran agar filter kota mengenali profil Anda.
        </p>
      )}
    </div>
  );
}
