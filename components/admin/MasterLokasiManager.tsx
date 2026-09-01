
import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Globe, Map, Building2, Plus, Trash2, Pencil, Search, ChevronRight, ArrowLeft, X,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { Country, State, City } from '@/lib/api/types';

type Level = 'countries' | 'states' | 'cities';

const MasterLokasiManager = () => {
  const [level, setLevel] = useState<Level>('countries');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedState, setSelectedState] = useState<State | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<Record<string, string>>({});

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ code: string; name: string; level: Level } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Master data wilayah nyaris tak berubah — cukup sekali per sesi.
  const MASTER_STALE = 30 * 60 * 1000;

  const countriesQuery = useQuery({
    queryKey: qk.admin.locations.list({ level: 'countries' }),
    queryFn: () => unwrap(apiClient.locations.countries({ limit: 300 })),
    staleTime: MASTER_STALE,
  });

  const statesQuery = useQuery({
    queryKey: qk.admin.locations.list({ level: 'states', country: selectedCountry?.code }),
    queryFn: () => unwrap(apiClient.locations.states(selectedCountry!.code, { limit: 500 })),
    enabled: !!selectedCountry,
    staleTime: MASTER_STALE,
  });

  const citiesQuery = useQuery({
    queryKey: qk.admin.locations.list({ level: 'cities', state: selectedState?.code }),
    queryFn: () => unwrap(apiClient.locations.cities(selectedState!.code, { limit: 1000 })),
    enabled: !!selectedState,
    staleTime: MASTER_STALE,
  });

  const countries: Country[] = Array.isArray(countriesQuery.data) ? countriesQuery.data : [];
  const states: State[] = Array.isArray(statesQuery.data) ? statesQuery.data : [];
  const cities: City[] = Array.isArray(citiesQuery.data) ? citiesQuery.data : [];

  const loading =
    level === 'countries'
      ? countriesQuery.isPending
      : level === 'states'
        ? statesQuery.isPending
        : citiesQuery.isPending;

  const invalidateLocations = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.locations.lists() });

  const navigateToStates = (country: Country) => {
    setSelectedCountry(country);
    setSelectedState(null);
    setLevel('states');
    setSearchTerm('');
  };

  const navigateToCities = (state: State) => {
    setSelectedState(state);
    setLevel('cities');
    setSearchTerm('');
  };

  const goBack = () => {
    setSearchTerm('');
    if (level === 'cities') {
      setLevel('states');
      setSelectedState(null);
    } else if (level === 'states') {
      setLevel('countries');
      setSelectedCountry(null);
      setSelectedState(null);
    }
  };

  // CREATE / EDIT
  const openCreateDialog = () => {
    setDialogMode('create');
    setFormData({});
    setDialogOpen(true);
  };

  const openEditDialog = (item: any) => {
    setDialogMode('edit');
    setFormData({ ...item, aliases: item.aliases?.join(', ') || '' });
    setDialogOpen(true);
  };

  const { mutate: saveLocation, isPending: saving } = useMutation({
    mutationFn: async () => {
      if (level === 'countries') {
        return dialogMode === 'create'
          ? unwrap(apiClient.adminLocations.createCountry({ code: formData.code, name: formData.name }))
          : unwrap(apiClient.adminLocations.updateCountry(formData.code, formData.name));
      }
      if (level === 'states') {
        return dialogMode === 'create'
          ? unwrap(apiClient.adminLocations.createState({
              code: formData.code,
              country_code: selectedCountry!.code,
              name: formData.name,
            }))
          : unwrap(apiClient.adminLocations.updateState(formData.code, { name: formData.name }));
      }
      const aliases = formData.aliases
        ? formData.aliases.split(',').map((a: string) => a.trim()).filter(Boolean)
        : [];
      return dialogMode === 'create'
        ? unwrap(apiClient.adminLocations.createCity({
            code: formData.code,
            state_code: selectedState!.code,
            name: formData.name,
            type: formData.type || 'city',
            aliases,
          }))
        : unwrap(apiClient.adminLocations.updateCity(formData.code, {
            name: formData.name,
            type: formData.type,
            aliases,
          }));
    },
    onSuccess: () => {
      toast({ title: 'Berhasil', description: dialogMode === 'create' ? 'Data berhasil ditambahkan' : 'Data berhasil diperbarui' });
      setDialogOpen(false);
      invalidateLocations();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Gagal menyimpan', variant: 'destructive' });
    },
  });

  const handleSave = () => saveLocation();

  // DELETE
  const confirmDelete = (code: string, name: string) => {
    setDeleteTarget({ code, name, level });
    setDeleteDialogOpen(true);
  };

  const { mutate: removeLocation } = useMutation({
    mutationFn: (target: { code: string; name: string; level: Level }) => {
      if (target.level === 'countries') return unwrap(apiClient.adminLocations.deleteCountry(target.code));
      if (target.level === 'states') return unwrap(apiClient.adminLocations.deleteState(target.code));
      return unwrap(apiClient.adminLocations.deleteCity(target.code));
    },
    onSuccess: (_data, target) => {
      toast({ title: 'Berhasil', description: `${target.name} dihapus` });
      setDeleteDialogOpen(false);
      invalidateLocations();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Gagal menghapus', variant: 'destructive' });
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    removeLocation(deleteTarget);
  };

  // Breadcrumb
  const renderBreadcrumb = () => (
    <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
      <button
        className={`hover:text-primary ${level === 'countries' ? 'font-semibold text-primary' : ''}`}
        onClick={() => { setLevel('countries'); setSelectedCountry(null); setSelectedState(null); setSearchTerm(''); }}
      >
        Negara
      </button>
      {selectedCountry && (
        <>
          <ChevronRight className="w-3 h-3" />
          <button
            className={`hover:text-primary ${level === 'states' ? 'font-semibold text-primary' : ''}`}
            onClick={() => { setLevel('states'); setSelectedState(null); setSearchTerm(''); }}
          >
            {selectedCountry.name}
          </button>
        </>
      )}
      {selectedState && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="font-semibold text-primary">{selectedState.name}</span>
        </>
      )}
    </div>
  );

  const levelIcon = level === 'countries' ? <Globe className="w-5 h-5" /> : level === 'states' ? <Map className="w-5 h-5" /> : <Building2 className="w-5 h-5" />;
  const levelLabel = level === 'countries' ? 'Negara' : level === 'states' ? 'Provinsi' : 'Kota/Kabupaten';

  const currentItems: { code: string; name: string; extra?: string }[] =
    level === 'countries'
      ? countries.map((c) => ({ code: c.code, name: c.name }))
      : level === 'states'
        ? states.map((s) => ({ code: s.code, name: s.name }))
        : cities.map((c) => ({ code: c.code, name: c.name, extra: c.type === 'regency' ? 'Kabupaten' : 'Kota' }));

  const filtered = currentItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className={`cursor-pointer hover:shadow-md ${level === 'countries' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => { setLevel('countries'); setSelectedCountry(null); setSelectedState(null); setSearchTerm(''); }}>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{countries.length}</p>
              <p className="text-xs text-muted-foreground">Negara</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Map className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{level === 'states' ? states.length : '-'}</p>
              <p className="text-xs text-muted-foreground">Provinsi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{level === 'cities' ? cities.length : '-'}</p>
              <p className="text-xs text-muted-foreground">Kota/Kab</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                {level !== 'countries' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                {levelIcon}
                Master Data {levelLabel}
              </CardTitle>
              {renderBreadcrumb()}
            </div>
            <Button size="sm" onClick={openCreateDialog} className="gap-1 shrink-0">
              <Plus className="w-4 h-4" />
              Tambah {levelLabel}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder={`Cari ${levelLabel.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Memuat data...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {levelIcon}
              <p className="mt-2">Tidak ada data {levelLabel.toLowerCase()}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.code}
                  className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className={`flex items-center gap-3 flex-1 min-w-0 ${level !== 'cities' ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (level === 'countries') navigateToStates({ code: item.code, name: item.name });
                      else if (level === 'states') navigateToCities({ code: item.code, state_code: '', name: item.name } as any);
                    }}
                  >
                    <Badge variant="outline" className="font-mono text-xs shrink-0">{item.code}</Badge>
                    <span className="font-medium truncate">{item.name}</span>
                    {item.extra && (
                      <Badge variant="secondary" className="text-xs">{item.extra}</Badge>
                    )}
                    {level !== 'cities' && (
                      <ChevronRight className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        const full = level === 'cities'
                          ? cities.find((c) => c.code === item.code)
                          : level === 'states'
                            ? states.find((s) => s.code === item.code)
                            : countries.find((c) => c.code === item.code);
                        openEditDialog(full || item);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => { e.stopPropagation(); confirmDelete(item.code, item.name); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? `Tambah ${levelLabel}` : `Edit ${levelLabel}`}</DialogTitle>
            <DialogDescription>
              {dialogMode === 'create' ? `Masukkan data ${levelLabel.toLowerCase()} baru` : `Perbarui data ${levelLabel.toLowerCase()}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Kode</Label>
              <Input
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder={level === 'countries' ? 'ID' : level === 'states' ? 'JK' : 'JK-01'}
                disabled={dialogMode === 'edit'}
                className="font-mono"
              />
            </div>
            <div>
              <Label>Nama</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={level === 'countries' ? 'Indonesia' : level === 'states' ? 'DKI Jakarta' : 'Jakarta Selatan'}
              />
            </div>
            {level === 'cities' && (
              <>
                <div>
                  <Label>Tipe</Label>
                  <Select
                    value={formData.type || 'city'}
                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="city">Kota</SelectItem>
                      <SelectItem value="regency">Kabupaten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alias (pisahkan dengan koma)</Label>
                  <Input
                    value={formData.aliases || ''}
                    onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                    placeholder="Jaksel, South Jakarta"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus {levelLabel}</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{deleteTarget?.name}</strong> ({deleteTarget?.code})?
              {level === 'countries' && ' Semua provinsi dan kota di bawahnya juga akan terhapus.'}
              {level === 'states' && ' Semua kota di bawahnya juga akan terhapus.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterLokasiManager;
