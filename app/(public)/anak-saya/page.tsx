'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import type { ChildProfile, ChildProfileInput } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Baby, Plus, Pencil, TrendingUp } from 'lucide-react';

const emptyForm: ChildProfileInput = {
  full_name: '',
  date_of_birth: '',
  disability_types: '',
  assistive_needs: '',
  notes: '',
};

function ageLabel(dob?: string): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return null;
  const months =
    (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (months < 12) return `${Math.floor(months)} bulan`;
  return `${Math.floor(months / 12)} tahun`;
}

export default function AnakSayaPage() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChildProfile | null>(null);
  const [formData, setFormData] = useState<ChildProfileInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth');
      return;
    }
    fetchChildren();
  }, [user, authLoading]);

  const fetchChildren = async () => {
    try {
      const response = await apiClient.children.list();
      if (response.error) throw new Error(response.error);
      setChildren(response.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengambil data anak',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (child: ChildProfile) => {
    setEditing(child);
    setFormData({
      full_name: child.full_name,
      date_of_birth: child.date_of_birth || '',
      disability_types: child.disability_types || '',
      assistive_needs: child.assistive_needs || '',
      notes: child.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.full_name) {
      toast({
        title: 'Error',
        description: 'Nama anak harus diisi',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      const payload: ChildProfileInput = {
        ...formData,
        date_of_birth: formData.date_of_birth || undefined,
        disability_types: formData.disability_types || undefined,
        assistive_needs: formData.assistive_needs || undefined,
        notes: formData.notes || undefined,
      };
      const response = editing
        ? await apiClient.children.update(editing.id, payload)
        : await apiClient.children.create(payload);
      if (response.error) throw new Error(response.error);
      toast({
        title: 'Berhasil',
        description: editing ? 'Profil anak diperbarui' : 'Profil anak ditambahkan',
      });
      setDialogOpen(false);
      fetchChildren();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan profil anak',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data anak...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Anak Saya</h1>
              <p className="text-gray-600">
                Kelola profil anak dan pantau perkembangan terapinya
              </p>
            </div>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Anak
            </Button>
          </div>

          {children.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Baby className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum Ada Profil Anak
                </h3>
                <p className="text-gray-600 mb-4">
                  Tambahkan profil anak untuk mulai memantau perkembangan terapinya
                </p>
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Anak
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {children.map((child) => (
                <Card key={child.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Baby className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{child.full_name}</CardTitle>
                        {ageLabel(child.date_of_birth) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {ageLabel(child.date_of_birth)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit profil ${child.full_name}`}
                        onClick={() => openEdit(child)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {child.disability_types && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {child.disability_types.split(',').map((t, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {t.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {child.notes && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{child.notes}</p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/anak-saya/${child.id}`)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Lihat Perkembangan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Profil Anak' : 'Tambah Profil Anak'}</DialogTitle>
            <DialogDescription>
              Informasi ini membantu terapis memahami kebutuhan anak Anda
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="child_name">Nama Lengkap *</Label>
              <Input
                id="child_name"
                placeholder="Nama anak"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child_dob">Tanggal Lahir</Label>
              <Input
                id="child_dob"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child_disability">Jenis Disabilitas (pisahkan dengan koma)</Label>
              <Input
                id="child_disability"
                placeholder="cerebral palsy, speech delay"
                value={formData.disability_types}
                onChange={(e) => setFormData({ ...formData, disability_types: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child_needs">Kebutuhan Alat Bantu</Label>
              <Input
                id="child_needs"
                placeholder="kursi roda, alat bantu dengar"
                value={formData.assistive_needs}
                onChange={(e) => setFormData({ ...formData, assistive_needs: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="child_notes">Catatan</Label>
              <Textarea
                id="child_notes"
                placeholder="Hal lain yang perlu diketahui terapis"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
