

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, UserCog } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  location: string;
  rating: number;
  experience_years: number;
  languages: string[];
  expertise: string[];
  available: boolean;
  bio?: string;
  price_per_session?: number;
  image_url?: string;
}

const TherapistManager = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    location: '',
    rating: 0,
    experience_years: 0,
    languages: '',
    expertise: '',
    available: true,
    bio: '',
    price_per_session: 0,
    image_url: '',
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: therapists = [], isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.therapyLocations.of('therapists'),
    queryFn: async () => {
      const data = await unwrap(apiClient.from('therapists').select().execute());
      // Backend belum mengurutkan, jadi tetap diurutkan di klien.
      return Array.isArray(data)
        ? (data as Therapist[]).slice().sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
        : [];
    },
  });

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching therapists:', listError);
    toast({
      title: "Error",
      description: "Gagal mengambil data terapis",
      variant: "destructive",
    });
  }, [listError, toast]);

  const invalidateTherapists = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.therapyLocations.of('therapists') });

  const { mutate: saveTherapist } = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: Record<string, unknown> }) =>
      id
        ? unwrap(apiClient.from('therapists').update(body).eq('id', id))
        : unwrap(apiClient.from('therapists').insert(body)),
    onSuccess: (_data, { id }) => {
      toast({
        title: "Berhasil",
        description: id ? "Data terapis berhasil diperbarui" : "Terapis berhasil ditambahkan",
      });
      setDialogOpen(false);
      resetForm();
      invalidateTherapists();
    },
    onError: (error) => {
      console.error('Error saving therapist:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data terapis",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      languages: formData.languages.split(',').map(lang => lang.trim()),
      expertise: formData.expertise.split(',').map(exp => exp.trim()),
      price_per_session: formData.price_per_session || null,
    };

    saveTherapist({ id: editingTherapist?.id ?? null, body: submitData });
  };

  const handleEdit = (therapist: Therapist) => {
    setEditingTherapist(therapist);
    setFormData({
      name: therapist.name,
      specialization: therapist.specialization,
      location: therapist.location,
      rating: therapist.rating,
      experience_years: therapist.experience_years,
      languages: therapist.languages.join(', '),
      expertise: therapist.expertise.join(', '),
      available: therapist.available,
      bio: therapist.bio || '',
      price_per_session: therapist.price_per_session || 0,
      image_url: therapist.image_url || '',
    });
    setDialogOpen(true);
  };

  const { mutate: removeTherapist } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.from('therapists').delete().eq('id', id)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Terapis berhasil dihapus",
      });
      invalidateTherapists();
    },
    onError: (error) => {
      console.error('Error deleting therapist:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus terapis",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus terapis ini?')) return;
    removeTherapist(id);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: '',
      location: '',
      rating: 0,
      experience_years: 0,
      languages: '',
      expertise: '',
      available: true,
      bio: '',
      price_per_session: 0,
      image_url: '',
    });
    setEditingTherapist(null);
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data terapis...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manajemen Terapis</CardTitle>
            <CardDescription>
              Kelola profil dan ketersediaan terapis
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Terapis
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTherapist ? 'Edit Terapis' : 'Tambah Terapis Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingTherapist 
                    ? 'Perbarui informasi terapis' 
                    : 'Tambahkan terapis baru ke sistem'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nama Terapis</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialization">Spesialisasi</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Lokasi</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience_years">Pengalaman (tahun)</Label>
                    <Input
                      id="experience_years"
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({...formData, experience_years: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rating">Rating (0-5)</Label>
                    <Input
                      id="rating"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_per_session">Harga per Sesi (Rp)</Label>
                    <Input
                      id="price_per_session"
                      type="number"
                      value={formData.price_per_session}
                      onChange={(e) => setFormData({...formData, price_per_session: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="languages">Bahasa (pisahkan dengan koma)</Label>
                  <Input
                    id="languages"
                    value={formData.languages}
                    onChange={(e) => setFormData({...formData, languages: e.target.value})}
                    placeholder="Bahasa Indonesia, English"
                  />
                </div>

                <div>
                  <Label htmlFor="expertise">Keahlian (pisahkan dengan koma)</Label>
                  <Input
                    id="expertise"
                    value={formData.expertise}
                    onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                    placeholder="Terapi Kognitif, Disabilitas Fisik"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="image_url">URL Foto</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={formData.available}
                    onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                  />
                  <Label htmlFor="available">Tersedia</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">
                    {editingTherapist ? 'Perbarui' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {therapists.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserCog className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada terapis</p>
            <p className="text-sm">Tambahkan terapis pertama Anda</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {therapists.map((therapist) => (
              <div key={therapist.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{therapist.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        therapist.available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {therapist.available ? 'Tersedia' : 'Tidak Tersedia'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-1">{therapist.specialization}</p>
                    <p className="text-sm text-gray-500 mb-1">{therapist.location}</p>
                    <p className="text-sm text-gray-500 mb-1">
                      Rating: {therapist.rating}/5 | Pengalaman: {therapist.experience_years} tahun
                    </p>
                    <p className="text-sm text-gray-600">
                      Bahasa: {therapist.languages.join(', ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      Keahlian: {therapist.expertise.join(', ')}
                    </p>
                    {therapist.price_per_session && (
                      <p className="text-sm font-medium text-green-600 mt-1">
                        Rp {therapist.price_per_session.toLocaleString()}/sesi
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(therapist)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(therapist.id)}
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

export default TherapistManager;
