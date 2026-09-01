
import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { MapPin, Building2, Phone, Mail, Globe, User, Send, FileCheck } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  address: '',
  city_code: '',
  description: '',
  phone: '',
  website: '',
  contact_person: '',
  provider_name: '',
  provider_email: '',
  provider_phone: '',
};

const TherapyLocationRegistrationForm = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [verificationFile, setVerificationFile] = useState<File | null>(null);

  const { toast } = useToast();

  const { data: countries = [] } = useQuery({
    queryKey: qk.locations.of('countries'),
    queryFn: () => unwrap(apiClient.locations.countries()),
    staleTime: 30 * 60 * 1000,
  });

  const { data: states = [] } = useQuery({
    queryKey: qk.locations.of('states', { country: selectedCountry }),
    queryFn: () => unwrap(apiClient.locations.states(selectedCountry)),
    enabled: !!selectedCountry,
    staleTime: 30 * 60 * 1000,
  });

  const { data: cities = [] } = useQuery({
    queryKey: qk.locations.of('cities', { state: selectedState }),
    queryFn: () => unwrap(apiClient.locations.cities(selectedState)),
    enabled: !!selectedState,
    staleTime: 30 * 60 * 1000,
  });

  // Indonesia dipilih otomatis begitu daftar negara tersedia, selama pengguna
  // belum memilih sendiri.
  useEffect(() => {
    if (selectedCountry) return;
    if (countries.some((c) => c.code === 'ID')) setSelectedCountry('ID');
  }, [countries, selectedCountry]);

  useEffect(() => {
    if (!selectedCountry) return;
    setSelectedState('');
    setFormData(prev => ({ ...prev, city_code: '' }));
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedState) return;
    setFormData(prev => ({ ...prev, city_code: '' }));
  }, [selectedState]);

  const { mutate: submitRegistration, isPending: loading } = useMutation({
    mutationFn: () =>
      unwrap(
        apiClient.public.therapyLocationRegister.submit({
          name: formData.name,
          address: formData.address,
          city_code: formData.city_code || undefined,
          description: formData.description || undefined,
          phone: formData.phone,
          email: formData.provider_email,
          website: formData.website || undefined,
          contact_person: formData.contact_person,
          provider_name: formData.provider_name,
          provider_email: formData.provider_email,
          provider_phone: formData.provider_phone,
        })
      ),
    onSuccess: () => {
      toast({
        title: "Pendaftaran Berhasil!",
        description: "Lokasi terapi Anda telah didaftarkan dan menunggu verifikasi dari admin.",
      });
      setFormData(EMPTY_FORM);
      setVerificationFile(null);
      setSelectedState('');
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal Mendaftar",
        description: error.message || "Terjadi kesalahan saat mendaftar. Silakan coba lagi.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitRegistration();
  };

  return (
    <section className="py-16 px-4 bg-gray-50" id="daftar-lokasi">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Daftarkan <span className="text-primary">Lokasi Terapi</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Apakah Anda memiliki fasilitas terapi? Daftarkan lokasi Anda untuk membantu penyandang disabilitas menemukan layanan terapi terdekat.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Formulir Pendaftaran Lokasi Terapi
            </CardTitle>
            <CardDescription>
              Isi formulir di bawah ini untuk mendaftarkan lokasi terapi Anda. Setelah diverifikasi oleh admin, lokasi Anda akan tampil di daftar pencarian.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informasi Lokasi</h3>

                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Nama Lokasi/Klinik *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Klinik Terapi ABC"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Negara</Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger aria-label="Pilih negara">
                        <SelectValue placeholder="Pilih negara" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Provinsi</Label>
                    <Select
                      value={selectedState}
                      onValueChange={setSelectedState}
                      disabled={!selectedCountry}
                    >
                      <SelectTrigger aria-label="Pilih provinsi">
                        <SelectValue placeholder="Pilih provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kota/Kabupaten</Label>
                    <Select
                      value={formData.city_code}
                      onValueChange={(value) => setFormData({ ...formData, city_code: value })}
                      disabled={!selectedState}
                    >
                      <SelectTrigger aria-label="Pilih kota atau kabupaten">
                        <SelectValue placeholder="Pilih kota" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.code} value={city.code}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Alamat Lengkap *
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Masukkan alamat lengkap lokasi terapi"
                    rows={2}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loc_phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telepon Lokasi *
                  </Label>
                  <Input
                    id="loc_phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+62 21 1234 5678"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="verification_file" className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    Bukti Verifikasi *
                  </Label>
                  <Input
                    id="verification_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setVerificationFile(e.target.files?.[0] || null)}
                    required
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-gray-500">
                    Upload surat izin praktik, sertifikat, atau dokumen legalitas lainnya (PDF, JPG, PNG - Maks 5MB)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Website (Opsional)
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.klinik.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi Layanan</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Jelaskan layanan terapi yang tersedia di lokasi ini..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Provider Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Informasi Pendaftar</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_person" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nama Kontak Person *
                    </Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Nama yang bisa dihubungi"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider_name">Nama Penyedia/Institusi *</Label>
                    <Input
                      id="provider_name"
                      value={formData.provider_name}
                      onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                      placeholder="Nama institusi atau penyedia layanan"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="provider_email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Pendaftar *
                    </Label>
                    <Input
                      id="provider_email"
                      type="email"
                      value={formData.provider_email}
                      onChange={(e) => setFormData({ ...formData, provider_email: e.target.value })}
                      placeholder="email@pendaftar.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider_phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telepon Pendaftar *
                    </Label>
                    <Input
                      id="provider_phone"
                      type="tel"
                      value={formData.provider_phone}
                      onChange={(e) => setFormData({ ...formData, provider_phone: e.target.value })}
                      placeholder="+62 812 3456 7890"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">Proses Verifikasi</p>
                <p>Setelah Anda mengirim formulir ini, tim admin kami akan meninjau dan memverifikasi lokasi terapi Anda. Proses ini biasanya memakan waktu 1-3 hari kerja.</p>
              </div>

              <Button type="submit" className="w-full md:w-auto" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">...</span>
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Daftarkan Lokasi
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default TherapyLocationRegistrationForm;
