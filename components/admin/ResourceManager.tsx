

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { Resource, ResourceInsert } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, BookOpen, FileText, Video, Users, Accessibility } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const categories = [
  { id: 'panduan', label: 'Panduan', icon: FileText },
  { id: 'tutorial', label: 'Tutorial & Info', icon: Video },
  { id: 'aksesibilitas', label: 'Aksesibilitas', icon: Accessibility },
  { id: 'komunitas', label: 'Komunitas', icon: Users },
];

const resourceTypes = ['Artikel', 'Video', 'Tutorial', 'Panduan', 'Info'];

const ResourceManager = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState<ResourceInsert>({
    title: '',
    description: '',
    category: 'panduan',
    type: 'Artikel',
    content_url: '',
    read_time: '',
    image_url: '',
    is_published: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listParams = { limit: 100 };
  const { data: resourceList, isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.resources.list(listParams),
    queryFn: () => unwrap(apiClient.adminResources.list(listParams)),
  });

  const resources: Resource[] = Array.isArray(resourceList) ? resourceList : [];

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching resources:', listError);
    toast({
      title: "Error",
      description: "Gagal mengambil data sumber belajar",
      variant: "destructive",
    });
  }, [listError, toast]);

  const invalidateResources = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.resources.lists() });

  const { mutate: saveResource } = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: ResourceInsert }) =>
      id
        ? unwrap(apiClient.adminResources.update(id, body))
        : unwrap(apiClient.adminResources.create(body)),
    onSuccess: (_data, { id }) => {
      toast({
        title: "Berhasil",
        description: id ? "Sumber belajar berhasil diperbarui" : "Sumber belajar berhasil ditambahkan",
      });
      setDialogOpen(false);
      resetForm();
      invalidateResources();
    },
    onError: (error) => {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan sumber belajar",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveResource({ id: editingResource?.id ?? null, body: formData });
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      type: resource.type,
      content_url: resource.content_url || '',
      read_time: resource.read_time,
      image_url: resource.image_url || '',
      is_published: resource.is_published,
    });
    setDialogOpen(true);
  };

  const { mutate: removeResource } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminResources.delete(id)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Sumber belajar berhasil dihapus",
      });
      invalidateResources();
    },
    onError: (error) => {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus sumber belajar",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sumber belajar ini?')) return;
    removeResource(id);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'panduan',
      type: 'Artikel',
      content_url: '',
      read_time: '',
      image_url: '',
      is_published: true,
    });
    setEditingResource(null);
  };

  const getCategoryLabel = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.label || categoryId;
  };

  if (loading) {
    return <div className="text-center py-8">Memuat data sumber belajar...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Manajemen Sumber Belajar</CardTitle>
            <CardDescription>
              Kelola panduan, tutorial, dan materi edukasi
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Sumber Belajar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingResource ? 'Edit Sumber Belajar' : 'Tambah Sumber Belajar Baru'}
                </DialogTitle>
                <DialogDescription>
                  {editingResource
                    ? 'Perbarui informasi sumber belajar'
                    : 'Tambahkan sumber belajar baru ke sistem'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="type">Tipe</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="read_time">Waktu Baca</Label>
                    <Input
                      id="read_time"
                      value={formData.read_time}
                      onChange={(e) => setFormData({ ...formData, read_time: e.target.value })}
                      placeholder="5 mnt"
                    />
                  </div>

                  <div>
                    <Label htmlFor="content_url">URL Konten</Label>
                    <Input
                      id="content_url"
                      value={formData.content_url}
                      onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="image_url">URL Gambar</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publikasikan</Label>
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
                    {editingResource ? 'Perbarui' : 'Tambah'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada sumber belajar</p>
            <p className="text-sm">Tambahkan sumber belajar pertama Anda</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <div key={resource.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{resource.title}</h3>
                      <Badge variant={resource.is_published ? 'default' : 'secondary'}>
                        {resource.is_published ? 'Publik' : 'Draft'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2">{resource.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <Badge variant="outline">{getCategoryLabel(resource.category)}</Badge>
                      <Badge variant="outline">{resource.type}</Badge>
                      {resource.read_time && (
                        <span className="text-gray-500">| {resource.read_time}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(resource)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(resource.id)}
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

export default ResourceManager;
