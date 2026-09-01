// Shared helpers for article pages (listing + detail)

export const categoryBadgeClass = (category: string) => {
  const map: Record<string, string> = {
    'Kesehatan': 'badge-kesehatan',
    'Terapi': 'badge-terapi',
    'Hukum & Hak': 'badge-hukum',
    'Teknologi': 'badge-teknologi',
    'Pendidikan': 'badge-pendidikan',
    'Karir': 'badge-karir',
    'Sosial': 'badge-sosial',
    'Aksesibilitas': 'badge-aksesibilitas',
    'Olahraga': 'badge-olahraga',
    'Keluarga': 'badge-keluarga',
  };
  return map[category] || 'bg-primary/10 text-primary';
};

// ~200 kata per menit, dihitung dari teks polos (tag HTML dibuang)
export const estimateReadingMinutes = (html: string): number => {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/**
 * Nama penulis yang aman ditampilkan.
 *
 * `author_name` di API berisi apa pun yang tersimpan di akun penulis, dan
 * untuk artikel yang ditulis lewat akun admin isinya adalah alamat email —
 * "superadmin@disabilitasku.com" sempat tampil sebagai nama penulis di halaman
 * artikel publik dan ikut ke JSON-LD. Alamat email tidak boleh bocor lewat
 * byline, jadi apa pun yang berbentuk email diganti nama redaksi.
 */
export const displayAuthorName = (name?: string | null): string => {
  const trimmed = (name ?? '').trim();
  if (!trimmed || /\S+@\S+\.\S+/.test(trimmed)) return 'Tim DisabilitasKu';
  return trimmed;
};
