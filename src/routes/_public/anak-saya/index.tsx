
import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
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
import { DisabilityTypePicker } from '@/components/DisabilityTypePicker';
import { disabilityBadgeClass, disabilityLabel, parseDisabilityCSV } from '@/lib/disability';

export const Route = createFileRoute('/_public/anak-saya/')({
  /*
   * Halaman akun: `noindex, nofollow`.
   *
   * Isinya milik satu pengguna dan tidak pernah berguna di hasil pencarian.
   * Sebelumnya tak ada `head` sama sekali, jadi tab browser menampilkan judul
   * default root — sulit dibedakan saat pengguna membuka banyak tab.
   */
  head: () => ({
    meta: [
      { title: 'Anak Saya | DisabilitasKu' },
      { name: 'description', content: 'Pantau tumbuh kembang dan riwayat terapi anak Anda.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: AnakSayaPage,
});


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

function AnakSayaPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ChildProfile | null>(null);
  const [formData, setFormData] = useState<ChildProfileInput>(emptyForm);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate({ to: '/auth' });
  }, [user, authLoading, navigate]);

  const { data: children = [], isPending, error: listError } = useQuery({
    queryKey: qk.children.list(),
    queryFn: () => unwrap(apiClient.children.list()),
    enabled: !!user,
  });

  useEffect(() => {
    if (!listError) return;
    toast({
      title: 'Error',
      description: listError.message || 'Gagal mengambil data anak',
      variant: 'destructive',
    });
  }, [listError, toast]);

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

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: ChildProfileInput }) =>
      id
        ? unwrap(apiClient.children.update(id, payload))
        : unwrap(apiClient.children.create(payload)),
    onSuccess: (_data, { id }) => {
      toast({
        title: 'Berhasil',
        description: id ? 'Profil anak diperbarui' : 'Profil anak ditambahkan',
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: qk.children.all() });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Gagal menyimpan profil anak',
        variant: 'destructive',
      });
    },
  });

  const saving = saveMutation.isPending;

  const handleSave = () => {
    if (!formData.full_name) {
      toast({
        title: 'Error',
        description: 'Nama anak harus diisi',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate({
      id: editing?.id,
      payload: {
        ...formData,
        date_of_birth: formData.date_of_birth || undefined,
        disability_types: formData.disability_types || undefined,
        assistive_needs: formData.assistive_needs || undefined,
        notes: formData.notes || undefined,
      },
    });
  };

  /*
   * `!user` ikut menahan render.
   *
   * Token sesi ada di localStorage, jadi server tidak bisa tahu siapa yang
   * meminta halaman ini — guard-nya wajib di klien. Tanpa `!user` di sini,
   * halaman sempat merender penuh dulu sebelum `useEffect` memantulkan tamu
   * ke /auth: kerangka dashboard berkedip untuk orang yang belum masuk.
   */
  if (!user || authLoading || isPending) {
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
                <Baby className="h-12 w-12 text-gray-600 mx-auto mb-4" />
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
                        {/* gray-600, bukan gray-500: usia anak dibaca sekilas di
                            ruang tunggu klinik, sering oleh mata yang lelah.
                            gray-500 pada putih memang lolos AA (4,8:1), tapi
                            gray-600 (7,6:1) lolos AAA tanpa biaya apa pun. */}
                        {ageLabel(child.date_of_birth) && (
                          <p className="text-sm text-gray-600 mt-1">
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
                        {parseDisabilityCSV(child.disability_types).map((t, idx) => (
                          <Badge key={idx} className={`text-xs ${disabilityBadgeClass(t)}`}>
                            {disabilityLabel(t)}
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
                      onClick={() => navigate({ to: `/anak-saya/${child.id}` })}
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
            <DisabilityTypePicker
              idPrefix="child-disability"
              label="Ragam Disabilitas"
              description="Pilih yang sesuai. Boleh lebih dari satu, boleh dikosongkan kalau belum ada diagnosis."
              value={formData.disability_types ?? ''}
              onChange={(csv) => setFormData({ ...formData, disability_types: csv })}
            />
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
