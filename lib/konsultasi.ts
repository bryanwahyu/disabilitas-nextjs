/**
 * Tautan CTA konsultasi screening dari hasil skrining.
 * Hanya id opaque yang dibawa di URL — tak ada PII atau isi keluhan (UU PDP).
 */
export function konsultasiHref(assessmentId?: string | null, childId?: string | null) {
  const qs = new URLSearchParams();
  if (assessmentId) qs.set('assessment', assessmentId);
  if (childId) qs.set('child', childId);
  const s = qs.toString();
  return s ? `/konsultasi/mulai?${s}` : '/konsultasi/mulai';
}
