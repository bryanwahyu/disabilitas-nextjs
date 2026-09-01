

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { TherapyLocation, TherapyLocationInsert, Country, State, City, LocationHour } from '@/lib/api/types';
import { LOCATION_TYPES } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Globe, CheckCircle, XCircle, User, ChevronsUpDown, Check, X, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const LocationManager = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<TherapyLocation | null>(null);

  // Location dropdowns
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>('');

  // Combobox open states
  const [countryOpen, setCountryOpen] = useState(false);
  const [stateOpen, setStateOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const [formData, setFormData] = useState<TherapyLocationInsert>({
    name: '',
    type: '',
    address: '',
    city_code: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    latitude: undefined,
    longitude: undefined,
    services: [],
    open_hours: [],
  });

  // Services input
  const [serviceInput, setServiceInput] = useState('');

  // Opening hours
  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listParams = { limit: 100 };
  const { data: locations = [], isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.therapyLocations.list(listParams),
    queryFn: () => unwrap(apiClient.adminTherapyLocations.list(listParams)),
  });

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching locations:', listError);
    toast({
      title: "Error",
      description: "Gagal mengambil data lokasi terapi",
      variant: "destructive",
    });
  }, [listError, toast]);

  // Master data wilayah nyaris tak berubah — cukup sekali per sesi.
  const MASTER_STALE = 30 * 60 * 1000;

  const { data: countries = [] } = useQuery<Country[]>({
    queryKey: qk.locations.list({ level: 'countries' }),
    queryFn: () => unwrap(apiClient.locations.countries()),
    staleTime: MASTER_STALE,
  });

  const { data: states = [] } = useQuery<State[]>({
    queryKey: qk.locations.list({ level: 'states', country: selectedCountry }),
    queryFn: () => unwrap(apiClient.locations.states(selectedCountry)),
    enabled: !!selectedCountry,
    staleTime: MASTER_STALE,
  });

  const { data: cities = [] } = useQuery<City[]>({
    queryKey: qk.locations.list({ level: 'cities', state: selectedState }),
    queryFn: () => unwrap(apiClient.locations.cities(selectedState)),
    enabled: !!selectedState,
    staleTime: MASTER_STALE,
  });

  // Default ke Indonesia begitu daftar negara tersedia.
  useEffect(() => {
    if (selectedCountry) return;
    if (countries.some((c) => c.code === 'ID')) setSelectedCountry('ID');
  }, [countries, selectedCountry]);

  const invalidateLocations = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.therapyLocations.lists() });

  const { mutate: saveLocation } = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: TherapyLocationInsert }) =>
      id
        ? unwrap(apiClient.adminTherapyLocations.update(id, body))
        : unwrap(apiClient.adminTherapyLocations.create(body)),
    onSuccess: (_data, { id }) => {
      toast({
        title: "Berhasil",
        description: id ? "Lokasi terapi berhasil diperbarui" : "Lokasi terapi berhasil ditambahkan",
      });
      setDialogOpen(false);
      resetForm();
      invalidateLocations();
    },
    onError: (error) => {
      console.error('Error saving location:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan lokasi terapi",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Buang string kosong supaya tidak kena validasi backend.
    const cleanData: TherapyLocationInsert = {
      name: formData.name,
      address: formData.address,
      ...(formData.type && { type: formData.type }),
      ...(formData.city_code && { city_code: formData.city_code }),
      ...(formData.description && { description: formData.description }),
      ...(formData.phone && { phone: formData.phone }),
      ...(formData.email && { email: formData.email }),
      ...(formData.website && { website: formData.website }),
      ...(formData.latitude !== undefined && { latitude: formData.latitude }),
      ...(formData.longitude !== undefined && { longitude: formData.longitude }),
      ...(formData.services && formData.services.length > 0 && { services: formData.services }),
      ...(formData.open_hours && formData.open_hours.length > 0 && { open_hours: formData.open_hours }),
    };

    saveLocation({ id: editingLocation?.id ?? null, body: cleanData });
  };

  const handleEdit = (location: TherapyLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      type: location.type || '',
      address: location.address,
      city_code: location.city_code || '',
      description: location.description || '',
      phone: location.phone || '',
      email: location.email || '',
      website: location.website || '',
      latitude: location.latitude,
      longitude: location.longitude,
      services: location.services || [],
      open_hours: location.open_hours || [],
    });

    // Turunkan negara & provinsi dari kode kota (mis. ID-JK-JS → ID, ID-JK).
    if (location.city_code) {
      const parts = location.city_code.split('-');
      if (parts.length >= 2) {
        setSelectedCountry(parts[0]);
        setSelectedState(`${parts[0]}-${parts[1]}`);
      }
    }

    setDialogOpen(true);
  };

  const { mutate: removeLocation } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminTherapyLocations.delete(id)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Lokasi terapi berhasil dihapus",
      });
      invalidateLocations();
    },
    onError: (error) => {
      console.error('Error deleting location:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus lokasi terapi",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus lokasi terapi ini?')) return;
    removeLocation(id);
  };

  const { mutate: setVerification } = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      unwrap(apiClient.adminTherapyLocations.update(id, { is_verified: isVerified })),
    onSuccess: (_data, { isVerified }) => {
      toast({
        title: "Berhasil",
        description: isVerified ? "Lokasi terapi berhasil diverifikasi" : "Verifikasi lokasi terapi dicabut",
      });
      invalidateLocations();
    },
    onError: (error) => {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status verifikasi",
        variant: "destructive",
      });
    },
  });

  const handleVerify = (id: string, isVerified: boolean) => setVerification({ id, isVerified });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      address: '',
      city_code: '',
      description: '',
      phone: '',
      email: '',
      website: '',
      latitude: undefined,
      longitude: undefined,
      services: [],
      open_hours: [],
    });
    setEditingLocation(null);
    setSelectedState('');
    setServiceInput('');
  };

  // Service management
  const addService = () => {
    if (serviceInput.trim() && !formData.services?.includes(serviceInput.trim())) {
      setFormData({
        ...formData,
        services: [...(formData.services || []), serviceInput.trim()]
      });
      setServiceInput('');
    }
  };

  const removeService = (service: string) => {
    setFormData({
      ...formData,
      services: formData.services?.filter(s => s !== service) || []
    });
  };

  // Opening hours management
  const addOpeningHour = () => {
    setFormData({
      ...formData,
      open_hours: [
        ...(formData.open_hours || []),
        { day_of_week: 1, open_time: '08:00', close_time: '17:00' }
      ]
    });
  };

  const updateOpeningHour = (index: number, field: keyof LocationHour, value: string | number) => {
    const newHours = [...(formData.open_hours || [])];
    newHours[index] = { ...newHours[index], [field]: value };
    setFormData({ ...formData, open_hours: newHours });
  };

  const removeOpeningHour = (index: number) => {
    const newHours = [...(formData.open_hours || [])];
    newHours.splice(index, 1);
    setFormData({ ...formData, open_hours: newHours });
  };

  const getCityName = (cityCode?: string) => {
    if (!cityCode) return '-';
    const city = cities.find(c => c.code === cityCode);
    return city?.name || cityCode;
  };

  if (loading) {
    return <div className="text-center py-8">Memuat lokasi terapi...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manajemen Lokasi Terapi</CardTitle>
            <CardDescription>
              Kelola lokasi tempat layanan terapi tersedia
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Lokasi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingLocation ? 'Edit Lokasi Terapi' : 'Tambah Lokasi Terapi Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingLocation
                    ? 'Perbarui informasi lokasi terapi'
                    : 'Tambahkan lokasi terapi baru ke sistem'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Lokasi *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Klinik Terapi ABC"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Jenis Lokasi</Label>
                    <select
                      id="type"
                      value={formData.type || ''}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full border rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Pilih jenis lokasi...</option>
                      {LOCATION_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Deskripsi layanan terapi yang tersedia..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Negara</Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={countryOpen}
                          className="w-full justify-between font-normal"
                        >
                          {selectedCountry
                            ? countries.find((c) => c.code === selectedCountry)?.name
                            : "Pilih negara..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari negara..." />
                          <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.code}
                                  value={country.name}
                                  onSelect={() => {
                                    setSelectedCountry(country.code);
                                    setSelectedState('');
                                    setFormData((prev) => ({ ...prev, city_code: '' }));
                                    setCountryOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCountry === country.code ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {country.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Provinsi</Label>
                    <Popover open={stateOpen} onOpenChange={setStateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={stateOpen}
                          className="w-full justify-between font-normal"
                          disabled={!selectedCountry}
                        >
                          {selectedState
                            ? states.find((s) => s.code === selectedState)?.name
                            : "Pilih provinsi..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari provinsi..." />
                          <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {states.map((state) => (
                                <CommandItem
                                  key={state.code}
                                  value={state.name}
                                  onSelect={() => {
                                    setSelectedState(state.code);
                                    setFormData((prev) => ({ ...prev, city_code: '' }));
                                    setStateOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedState === state.code ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {state.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>Kota/Kabupaten</Label>
                    <Popover open={cityOpen} onOpenChange={setCityOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={cityOpen}
                          className="w-full justify-between font-normal"
                          disabled={!selectedState}
                        >
                          {formData.city_code
                            ? cities.find((c) => c.code === formData.city_code)?.name
                            : "Pilih kota..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari kota..." />
                          <CommandList>
                            <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                            <CommandGroup>
                              {cities.map((city) => (
                                <CommandItem
                                  key={city.code}
                                  value={city.name}
                                  onSelect={() => {
                                    setFormData({...formData, city_code: city.code});
                                    setCityOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.city_code === city.code ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {city.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Alamat Lengkap *</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Jl. Contoh No. 123, RT 01/RW 02"
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+62 21 1234567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="info@klinik.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    placeholder="https://www.klinik.com"
                  />
                </div>

                {/* Koordinat */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        latitude: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      placeholder="-6.200000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude ?? ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        longitude: e.target.value ? parseFloat(e.target.value) : undefined
                      })}
                      placeholder="106.816666"
                    />
                  </div>
                </div>

                {/* Layanan/Fasilitas */}
                <div>
                  <Label>Layanan/Fasilitas</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={serviceInput}
                      onChange={(e) => setServiceInput(e.target.value)}
                      placeholder="Tambahkan layanan (misal: Terapi Wicara)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                    />
                    <Button type="button" onClick={addService} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.services?.map((service, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {service}
                        <button
                          type="button"
                          onClick={() => removeService(service)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Jam Operasional */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Jam Operasional
                    </Label>
                    <Button type="button" onClick={addOpeningHour} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Tambah Jam
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.open_hours?.map((hour, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <select
                          value={hour.day_of_week}
                          onChange={(e) => updateOpeningHour(index, 'day_of_week', parseInt(e.target.value))}
                          className="border rounded px-2 py-1 text-sm"
                        >
                          {DAY_NAMES.map((day, dayIndex) => (
                            <option key={dayIndex} value={dayIndex}>{day}</option>
                          ))}
                        </select>
                        <Input
                          type="time"
                          value={hour.open_time}
                          onChange={(e) => updateOpeningHour(index, 'open_time', e.target.value)}
                          className="w-28"
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          type="time"
                          value={hour.close_time}
                          onChange={(e) => updateOpeningHour(index, 'close_time', e.target.value)}
                          className="w-28"
                        />
                        <Button
                          type="button"
                          onClick={() => removeOpeningHour(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    {(!formData.open_hours || formData.open_hours.length === 0) && (
                      <p className="text-sm text-gray-500 italic">Belum ada jam operasional ditambahkan</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingLocation ? 'Perbarui' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {locations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada lokasi terapi</p>
            <p className="text-sm">Tambahkan lokasi terapi pertama Anda</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className={`border rounded-lg p-4 ${!location.is_verified ? 'bg-yellow-50 border-yellow-200' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-lg">{location.name}</h3>
                      {location.type && (
                        <Badge variant="outline" className="text-xs">
                          {LOCATION_TYPES.find(t => t.value === location.type)?.label || location.type}
                        </Badge>
                      )}
                      {location.is_verified ? (
                        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Terverifikasi
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-500 text-white hover:bg-yellow-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          Belum Diverifikasi
                        </Badge>
                      )}
                    </div>
                    {location.description && (
                      <p className="text-gray-600 text-sm mb-2">{location.description}</p>
                    )}
                    <div className="flex items-center text-gray-600 mb-1">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{location.address}</span>
                    </div>
                    {location.city_name && (
                      <p className="text-sm text-gray-500 ml-6 mb-1">{location.city_name}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      {location.phone && (
                        <span className="flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {location.phone}
                        </span>
                      )}
                      {location.email && (
                        <span className="flex items-center">
                          <Mail className="w-3 h-3 mr-1" />
                          {location.email}
                        </span>
                      )}
                      {location.website && (
                        <span className="flex items-center">
                          <Globe className="w-3 h-3 mr-1" />
                          <a href={location.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Website
                          </a>
                        </span>
                      )}
                      {location.latitude && location.longitude && (
                        <span className="flex items-center text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </span>
                      )}
                    </div>

                    {/* Services */}
                    {location.services && location.services.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1">Layanan:</p>
                        <div className="flex flex-wrap gap-1">
                          {location.services.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opening Hours */}
                    {location.open_hours && location.open_hours.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Jam Operasional:
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                          {location.open_hours.map((hour, idx) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded">
                              {DAY_NAMES[hour.day_of_week]}: {hour.open_time} - {hour.close_time}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Registrant Info for unverified locations */}
                    {!location.is_verified && location.registrant_name && (
                      <div className="mt-3 p-3 bg-white border border-yellow-100 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Informasi Pendaftar:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                          <span>Nama: {location.registrant_name}</span>
                          <span>Email: {location.registrant_email}</span>
                          <span>Telepon: {location.registrant_phone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    {location.is_verified ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerify(location.id, false)}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cabut
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleVerify(location.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verifikasi
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(location)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(location.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationManager;
