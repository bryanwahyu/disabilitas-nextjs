
import React, { useState, useEffect } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { User, ProfileUpdate } from '@/lib/api/types';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User as UserIcon, Mail, Phone, MapPin, Calendar, Save, Shield, Bell, History, Briefcase, Clock, DollarSign, Award, MessageCircle } from 'lucide-react';

export const Route = createFileRoute('/_public/profil/')({
  /*
   * Halaman akun: `noindex, nofollow`.
   *
   * Isinya milik satu pengguna dan tidak pernah berguna di hasil pencarian.
   * Sebelumnya tak ada `head` sama sekali, jadi tab browser menampilkan judul
   * default root — sulit dibedakan saat pengguna membuka banyak tab.
   */
  head: () => ({
    meta: [
      { title: 'Profil Saya | DisabilitasKu' },
      { name: 'description', content: 'Kelola data profil dan preferensi akun Anda.' },
      { name: 'robots', content: 'noindex, nofollow' },
    ],
  }),
  component: ProfilePage,
});


// Backend mengirim field profil dalam beberapa bentuk (nested `Profile`, PascalCase,
// atau flat snake_case) — normalkan sekali di sini.
function toFormData(source: User | null | undefined): ProfileUpdate {
  if (!source) return {};
  const d = source as any;
  return {
    full_name: d?.full_name || d?.name,
    phone: d?.phone,
    address: d?.address,
    city: d?.city,
    date_of_birth: d?.date_of_birth,
    gender: d?.gender,
    bio: d?.Profile?.Bio || d?.Profile?.bio || d?.bio,
    specialization: d?.Profile?.Specialization || d?.Profile?.specialization || d?.specialization,
    experience_years: d?.Profile?.ExperienceYears || d?.Profile?.experience_years || d?.experience_years,
    certifications: d?.Profile?.Certifications || d?.Profile?.certifications || d?.certifications,
    languages: d?.Profile?.Languages || d?.Profile?.languages || d?.languages,
    rate_per_session: d?.Profile?.RatePerSession || d?.Profile?.rate_per_session || d?.rate_per_session,
    consultation_methods: d?.Profile?.ConsultationMethods || d?.Profile?.consultation_methods || d?.consultation_methods,
    company_name: d?.Profile?.CompanyName || d?.Profile?.company_name || d?.company_name,
    industry: d?.Profile?.Industry || d?.Profile?.industry || d?.industry,
    company_description: d?.Profile?.CompanyDescription || d?.Profile?.company_description || d?.company_description,
    company_website: d?.Profile?.CompanyWebsite || d?.Profile?.company_website || d?.company_website,
    employee_count: d?.Profile?.EmployeeCount || d?.Profile?.employee_count || d?.employee_count,
  } as ProfileUpdate;
}

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  // Null selama belum ada perubahan: nilai form dibaca langsung dari profil.
  const [draft, setDraft] = useState<ProfileUpdate | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/auth' });
    }
  }, [user, authLoading, navigate]);

  const { data: fetchedProfile, isPending: loading, isError } = useQuery({
    queryKey: qk.me(),
    queryFn: () => unwrap(apiClient.users.getCurrent()),
    enabled: !!user,
  });

  // Bila endpoint profil gagal, data dari sesi login tetap dipakai supaya
  // halaman tidak kosong.
  const profile = fetchedProfile ?? (isError ? user : null);
  const formData = draft ?? toFormData(profile);
  const setFormData = (next: ProfileUpdate) => setDraft(next);

  const { mutate: saveProfile, isPending: saving } = useMutation({
    mutationFn: (body: ProfileUpdate) => unwrap(apiClient.users.update(user!.id, body)),
    onSuccess: (updated) => {
      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      });
      qc.setQueryData(qk.me(), updated);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui profil",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!user) return;
    saveProfile(formData);
  };

  const isTherapistRole = profile?.role === 'therapist_independent' || profile?.role === 'therapy';
  const isEmployerRole = profile?.role === 'employer';
  const isInstructorRole = profile?.role === 'instructor';

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'therapy': return 'Pemilik Yayasan/Klinik';
      case 'therapist_independent': return 'Terapis Independen';
      case 'instructor': return 'Pengajar Profesional';
      case 'employer': return 'Mitra Perusahaan';
      case 'orang_tua': return 'Orang Tua';
      case 'user_disabilitas': return 'Penyandang Disabilitas';
      default: return role || 'Pengguna';
    }
  };

  const getRoleBadgeVariant = (role?: string): "destructive" | "default" | "secondary" => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'therapy': return 'default';
      default: return 'secondary';
    }
  };

  /*
   * `!user` ikut menahan render.
   *
   * Token sesi ada di localStorage, jadi server tidak bisa tahu siapa yang
   * meminta halaman ini — guard-nya wajib di klien. Tanpa `!user` di sini,
   * halaman sempat merender penuh dulu sebelum `useEffect` memantulkan tamu
   * ke /auth: kerangka dashboard berkedip untuk orang yang belum masuk.
   */
  if (!user || authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat profil...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <UserIcon className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || profile?.name || 'Pengguna'}
                </h1>
                <p className="text-gray-600">{profile?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={getRoleBadgeVariant(profile?.role)}>
                    {getRoleLabel(profile?.role)}
                  </Badge>
                  {profile?.created_at && (
                    <span className="text-sm text-gray-500">
                      Bergabung sejak {new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="security">Keamanan</TabsTrigger>
              <TabsTrigger value="notifications">Notifikasi</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Profil</CardTitle>
                  <CardDescription>
                    Perbarui informasi pribadi Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nama Lengkap</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="full_name"
                          placeholder="Nama lengkap"
                          value={formData.full_name || ''}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="email"
                          type="email"
                          value={profile?.email || ''}
                          disabled
                          className="pl-10 bg-gray-50"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Nomor Telepon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="phone"
                          placeholder="08xxxxxxxxxx"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Kota</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="city"
                          placeholder="Kota"
                          value={formData.city || ''}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Jenis Kelamin</Label>
                      <select
                        id="gender"
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background"
                      >
                        <option value="">Pilih jenis kelamin</option>
                        <option value="male">Laki-laki</option>
                        <option value="female">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      placeholder="Alamat lengkap"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                    />
                  </div>

                  {/* Therapist / Instructor fields */}
                  {(isTherapistRole || isInstructorRole) && (
                    <>
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          {isTherapistRole ? 'Profil Terapis' : 'Profil Pengajar'}
                        </h3>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="specialization">Spesialisasi</Label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="specialization"
                              placeholder={isTherapistRole ? 'Misal: Fisioterapi, Terapi Wicara' : 'Misal: Bahasa Isyarat, Teknologi Asistif'}
                              value={(formData as any).specialization || ''}
                              onChange={(e) => setFormData({ ...formData, specialization: e.target.value } as any)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="experience_years">Pengalaman (tahun)</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="experience_years"
                              type="number"
                              min="0"
                              placeholder="0"
                              value={(formData as any).experience_years || ''}
                              onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 } as any)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="rate_per_session">Tarif per Sesi (Rp)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="rate_per_session"
                              type="number"
                              min="0"
                              placeholder="0"
                              value={(formData as any).rate_per_session || ''}
                              onChange={(e) => setFormData({ ...formData, rate_per_session: parseInt(e.target.value) || 0 } as any)}
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="languages">Bahasa yang Dikuasai</Label>
                          <Input
                            id="languages"
                            placeholder="Misal: Indonesia, Inggris"
                            value={(formData as any).languages || ''}
                            onChange={(e) => setFormData({ ...formData, languages: e.target.value } as any)}
                          />
                        </div>
                      </div>

                      {isTherapistRole && (
                        <div className="space-y-2">
                          <Label htmlFor="consultation_methods">Metode Konsultasi</Label>
                          <div className="relative">
                            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                            <Input
                              id="consultation_methods"
                              placeholder="Misal: Tatap Muka, Online, Chat, Home Visit"
                              value={(formData as any).consultation_methods || ''}
                              onChange={(e) => setFormData({ ...formData, consultation_methods: e.target.value } as any)}
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-gray-500">Pisahkan dengan koma</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="certifications">Sertifikasi & Pendidikan</Label>
                        <div className="relative">
                          <Award className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                          <Textarea
                            id="certifications"
                            placeholder="Misal: S1 Fisioterapi Universitas Indonesia, STR Fisioterapi No. xxx"
                            value={(formData as any).certifications || ''}
                            onChange={(e) => setFormData({ ...formData, certifications: e.target.value } as any)}
                            rows={3}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio / Tentang Diri</Label>
                        <Textarea
                          id="bio"
                          placeholder="Ceritakan tentang diri Anda, pengalaman, dan pendekatan terapi yang Anda gunakan..."
                          value={(formData as any).bio || ''}
                          onChange={(e) => setFormData({ ...formData, bio: e.target.value } as any)}
                          rows={4}
                        />
                      </div>
                    </>
                  )}

                  {/* Employer fields */}
                  {isEmployerRole && (
                    <>
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          Profil Perusahaan
                        </h3>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Nama Perusahaan</Label>
                          <Input
                            id="company_name"
                            placeholder="Nama perusahaan"
                            value={(formData as any).company_name || ''}
                            onChange={(e) => setFormData({ ...formData, company_name: e.target.value } as any)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="industry">Industri</Label>
                          <Input
                            id="industry"
                            placeholder="Misal: Teknologi, Manufaktur"
                            value={(formData as any).industry || ''}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value } as any)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company_website">Website</Label>
                          <Input
                            id="company_website"
                            placeholder="https://..."
                            value={(formData as any).company_website || ''}
                            onChange={(e) => setFormData({ ...formData, company_website: e.target.value } as any)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="employee_count">Jumlah Karyawan</Label>
                          <Input
                            id="employee_count"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={(formData as any).employee_count || ''}
                            onChange={(e) => setFormData({ ...formData, employee_count: parseInt(e.target.value) || 0 } as any)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company_description">Deskripsi Perusahaan</Label>
                        <Textarea
                          id="company_description"
                          placeholder="Tentang perusahaan Anda dan komitmen inklusif..."
                          value={(formData as any).company_description || ''}
                          onChange={(e) => setFormData({ ...formData, company_description: e.target.value } as any)}
                          rows={4}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
                <CardFooter>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Keamanan Akun
                  </CardTitle>
                  <CardDescription>
                    Kelola keamanan akun Anda
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Ganti Password</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Gunakan halaman reset password untuk mengubah password akun Anda
                    </p>
                    <Button variant="outline" onClick={() => navigate({ to: '/reset-password' })}>
                      Ganti Password
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Riwayat Login</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Lihat aktivitas login terakhir di akun Anda
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <History className="h-4 w-4" />
                      Login terakhir: {profile?.updated_at ?
                        new Date(profile.updated_at).toLocaleString('id-ID') :
                        'Tidak tersedia'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Pengaturan Notifikasi
                  </CardTitle>
                  <CardDescription>
                    Kelola preferensi notifikasi Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Notifikasi Email</h4>
                        <p className="text-sm text-gray-600">
                          Terima notifikasi penting via email
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Notifikasi Janji Temu</h4>
                        <p className="text-sm text-gray-600">
                          Pengingat untuk janji temu yang akan datang
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Notifikasi Komunitas</h4>
                        <p className="text-sm text-gray-600">
                          Update dari komunitas yang Anda ikuti
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Notifikasi Acara</h4>
                        <p className="text-sm text-gray-600">
                          Pengingat untuk acara yang Anda ikuti
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
