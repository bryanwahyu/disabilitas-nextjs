/**
 * Susun ISO 8601 lengkap dengan offset dari tanggal + jam dinding slot.
 *
 * Slot dari API berupa jam dinding lokal ("2026-08-25", "09:00") tanpa zona.
 * `new Date("2026-08-25T09:00")` akan memakai zona perangkat pengunjung —
 * pengunjung di zona lain mengirim waktu absolut yang berbeda untuk slot yang
 * sama. Offset ditulis eksplisit supaya jam yang diklik sama dengan jam yang
 * sampai ke backend.
 */
export function toIsoWithOffset(date: string, clock: string): string {
  const offsetMinutes = -new Date(`${date}T${clock}:00`).getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date}T${clock}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

