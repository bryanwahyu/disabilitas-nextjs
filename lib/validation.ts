/**
 * Aturan password: minimal 8 karakter, mengandung huruf besar, angka, dan
 * karakter spesial.
 *
 * Sebelumnya fungsi ini hanya memeriksa panjang ≥ 6 — sementara test yang ada
 * di repo sejak awal menuntut aturan lengkap ini. Testnya tidak pernah jalan
 * (runner-nya rusak), jadi selisihnya tidak pernah terlihat. Backend juga
 * dinaikkan (`validate:"required,min=8"` + pemeriksaan komposisi di
 * `internal/http/handlers/auth.go`), karena validasi klien saja bisa dilewati
 * dengan memanggil API langsung.
 *
 * Pesan galat sengaja dikembalikan sebagai daftar, bukan satu kalimat: form
 * menampilkan semua syarat yang belum terpenuhi sekaligus, jadi pengguna tidak
 * perlu menebak satu per satu.
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Minimal 8 karakter');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Minimal 1 huruf besar');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Minimal 1 angka');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Minimal 1 karakter spesial');
  }

  return { valid: errors.length === 0, errors };
}
