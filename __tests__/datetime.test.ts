import { describe, it, expect } from 'vitest';
import { toIsoWithOffset } from '@/lib/datetime';

describe('toIsoWithOffset', () => {
  it('menghasilkan ISO 8601 dengan offset eksplisit', () => {
    const iso = toIsoWithOffset('2026-08-25', '09:00');
    // Bentuknya harus lengkap dengan offset — bukan "2026-08-25T09:00" polos,
    // yang artinya diserahkan ke zona perangkat penerima.
    expect(iso).toMatch(/^2026-08-25T09:00:00[+-]\d{2}:\d{2}$/);
  });

  it('menunjuk jam dinding yang sama dengan slot yang diklik', () => {
    const iso = toIsoWithOffset('2026-08-25', '09:00');
    const parsed = new Date(iso);

    // Inti gunanya: waktu absolut hasilnya, saat dibaca kembali di zona lokal,
    // tetap pukul 09:00 pada tanggal yang sama. Kalau offsetnya salah, slot
    // pukul 09:00 dikirim sebagai jam lain ke backend.
    expect(parsed.getHours()).toBe(9);
    expect(parsed.getMinutes()).toBe(0);
    expect(parsed.getDate()).toBe(25);
  });

  it('menangani tengah malam tanpa menggeser tanggal', () => {
    const iso = toIsoWithOffset('2026-08-25', '00:00');
    const parsed = new Date(iso);
    expect(parsed.getHours()).toBe(0);
    expect(parsed.getDate()).toBe(25);
  });
});
