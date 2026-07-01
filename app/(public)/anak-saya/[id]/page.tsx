'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import type {
  ChildProfile,
  ChildMilestone,
  ChildMilestoneInput,
  SessionNote,
  ProgressMonthlySummary,
} from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Baby, Flag, Plus, ClipboardList, Star, TrendingUp, Stethoscope, MessageCircle } from 'lucide-react';

function formatDate(d: string): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Waktu relatif gaya X: "baru saja", "3j", "2h", lalu tanggal.
function relTime(s: string): string {
  const date = new Date(s);
  if (isNaN(date.getTime())) return '';
  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}h`;
  return formatDate(s);
}

function formatMonth(m: string): string {
  const date = new Date(`${m}-01`);
  if (isNaN(date.getTime())) return m;
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

function RatingStars({ value }: { value: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={`Penilaian kemajuan ${value} dari 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= value ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

export default function PerkembanganAnakPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [child, setChild] = useState<ChildProfile | null>(null);
  const [milestones, setMilestones] = useState<ChildMilestone[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [summary, setSummary] = useState<ProgressMonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState<ChildMilestoneInput>({
    milestone_name: '',
    achieved_at: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const childId = params.id as string;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchAll();
  }, [user, authLoading, childId]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const childRes = await apiClient.children.get(childId);
      if (childRes.error || !childRes.data) {
        setError('Profil anak tidak ditemukan');
        return;
      }
      setChild(childRes.data);

      const [milestonesRes, notesRes, summaryRes] = await Promise.all([
        apiClient.children.milestones(childId),
        apiClient.children.sessionNotes(childId),
        apiClient.children.progressSummary(childId),
      ]);
      setMilestones(milestonesRes.data || []);
      setNotes(notesRes.data || []);
      setSummary(summaryRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!milestoneForm.milestone_name) {
      toast({
        title: 'Error',
        description: 'Nama milestone harus diisi',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.children.createMilestone(childId, {
        milestone_name: milestoneForm.milestone_name,
        achieved_at: milestoneForm.achieved_at || undefined,
        notes: milestoneForm.notes || undefined,
      });
      if (response.error) throw new Error(response.error);
      toast({ title: 'Berhasil', description: 'Milestone dicatat' });
      setMilestoneDialogOpen(false);
      setMilestoneForm({ milestone_name: '', achieved_at: '', notes: '' });
      fetchAll();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mencatat milestone',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-40 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !child) {
    return (
      <div className="min-h-screen bg-gray-50">
        <main className="py-8 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profil Anak Tidak Ditemukan</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => router.push('/anak-saya')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Anak Saya
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => router.push('/anak-saya')}
            className="mb-6 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Anak Saya
          </Button>

          {/* Child header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Baby className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{child.full_name}</h1>
                  {child.date_of_birth && (
                    <p className="text-sm text-gray-500 mb-2">
                      Lahir {formatDate(child.date_of_birth)}
                    </p>
                  )}
                  {child.disability_types && (
                    <div className="flex flex-wrap gap-1">
                      {child.disability_types.split(',').map((t, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {t.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Ringkasan Perkembangan per Bulan
              </CardTitle>
              <CardDescription>
                Jumlah sesi terapi, rata-rata penilaian kemajuan, dan milestone tiap bulan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Belum ada data — ringkasan akan muncul setelah ada catatan sesi atau milestone
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {summary.map((row) => (
                    <div key={row.month} className="border rounded-lg p-4">
                      <p className="font-medium text-gray-900 mb-2">{formatMonth(row.month)}</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>{row.session_count} sesi terapi</p>
                        {row.session_count > 0 && (
                          <p className="flex items-center gap-2">
                            Rata-rata <RatingStars value={Math.round(row.avg_rating)} />
                          </p>
                        )}
                        <p>{row.milestone_count} milestone</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Milestones timeline */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Flag className="h-5 w-5 text-primary" />
                    Milestone Perkembangan
                  </CardTitle>
                  <CardDescription>
                    Pencapaian anak — sekecil apa pun, layak dirayakan
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => setMilestoneDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Catat Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Belum ada milestone yang dicatat
                </p>
              ) : (
                <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                  {milestones.map((m) => (
                    <li key={m.id} className="ml-6">
                      <span className="absolute -left-2 mt-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary" />
                      <p className="text-sm text-gray-500">{formatDate(m.achieved_at)}</p>
                      <h3 className="font-medium text-gray-900">{m.milestone_name}</h3>
                      {m.notes && <p className="text-sm text-gray-600 mt-1">{m.notes}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>

          {/* Session notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-primary" />
                Catatan Sesi Terapi
              </CardTitle>
              <CardDescription>
                Diisi oleh terapis setelah setiap sesi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Belum ada catatan sesi dari terapis
                </p>
              ) : (
                <div>
                  {notes.map((n, idx) => (
                    <div key={n.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {idx < notes.length - 1 && (
                        <span className="absolute left-[18px] top-10 -bottom-0 w-px bg-gray-200" aria-hidden="true" />
                      )}
                      <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0 ring-4 ring-white z-10">
                        <Stethoscope className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-sm flex-wrap">
                          <span className="font-semibold text-gray-900">Terapis</span>
                          <span className="text-gray-400">· sesi {formatDate(n.session_date)}</span>
                          <span className="text-gray-400">· {relTime(n.created_at)}</span>
                          <span className="ml-auto"><RatingStars value={n.progress_rating} /></span>
                        </div>
                        <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap break-words">{n.activity}</p>
                        {n.observation && (
                          <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-wrap break-words">{n.observation}</p>
                        )}
                        {n.notes && (
                          <div className="mt-2 flex items-start gap-2 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
                            <MessageCircle className="h-3.5 w-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{n.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Catat Milestone</DialogTitle>
            <DialogDescription>
              Catat pencapaian baru {child.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="milestone_name">Pencapaian *</Label>
              <Input
                id="milestone_name"
                placeholder="Contoh: bisa makan sendiri dengan sendok"
                value={milestoneForm.milestone_name}
                onChange={(e) =>
                  setMilestoneForm({ ...milestoneForm, milestone_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone_date">Tanggal Tercapai</Label>
              <Input
                id="milestone_date"
                type="date"
                value={milestoneForm.achieved_at}
                onChange={(e) =>
                  setMilestoneForm({ ...milestoneForm, achieved_at: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="milestone_notes">Catatan</Label>
              <Textarea
                id="milestone_notes"
                placeholder="Cerita di balik pencapaian ini"
                rows={3}
                value={milestoneForm.notes}
                onChange={(e) => setMilestoneForm({ ...milestoneForm, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMilestoneDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleAddMilestone} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
