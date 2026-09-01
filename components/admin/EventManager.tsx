
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Calendar, MapPin, Video, Users, RefreshCw } from 'lucide-react';
import { apiClient, Event, EventCreate, EventUpdate } from '@/lib/api/client';
import { toast } from 'sonner';

export default function EventManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState<EventCreate>({
    title: '',
    mode: 'online',
    start_at: '',
    end_at: '',
    capacity: 50,
    location: '',
  });

  const listParams = { limit: 100 };
  const { data: events = [], isPending: loading, error: listError, refetch: fetchEvents } = useQuery({
    queryKey: qk.admin.events.list(listParams),
    queryFn: () => unwrap(apiClient.adminEvents.list(listParams)),
  });

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching events:', listError);
    toast.error('Gagal memuat data acara');
  }, [listError]);

  const invalidateEvents = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.events.lists() });

  const { mutate: saveEvent } = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: EventCreate }) => {
      if (id) {
        const updateData: EventUpdate = {
          title: body.title,
          mode: body.mode,
          start_at: body.start_at,
          end_at: body.end_at,
          capacity: body.capacity,
          location: body.location,
        };
        return unwrap(apiClient.adminEvents.update(id, updateData));
      }
      return unwrap(apiClient.adminEvents.create(body));
    },
    onSuccess: (_data, { id }) => {
      toast.success(id ? 'Acara berhasil diperbarui' : 'Acara berhasil dibuat');
      setIsDialogOpen(false);
      resetForm();
      invalidateEvents();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan acara');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveEvent({ id: editingEvent?.id ?? null, body: formData });
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      mode: event.mode,
      start_at: event.start_at ? new Date(event.start_at).toISOString().slice(0, 16) : '',
      end_at: event.end_at ? new Date(event.end_at).toISOString().slice(0, 16) : '',
      capacity: event.capacity || 50,
      location: event.location || '',
    });
    setIsDialogOpen(true);
  };

  const { mutate: removeEvent } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminEvents.delete(id)),
    onSuccess: () => {
      toast.success('Acara berhasil dihapus');
      invalidateEvents();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus acara');
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus acara ini?')) return;
    removeEvent(id);
  };

  const resetForm = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      mode: 'online',
      start_at: '',
      end_at: '',
      capacity: 50,
      location: '',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getStatusBadge = (event: Event) => {
    const now = new Date();
    const start = new Date(event.start_at);
    const end = new Date(event.end_at);

    if (now < start) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700">Akan Datang</Badge>;
    } else if (now >= start && now <= end) {
      return <Badge variant="outline" className="bg-green-50 text-green-700">Berlangsung</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-50 text-gray-700">Selesai</Badge>;
    }
  };

  const getModeBadge = (mode: string) => {
    if (mode === 'online') {
      return <Badge variant="outline" className="bg-purple-50 text-purple-700"><Video className="w-3 h-3 mr-1" />Online</Badge>;
    } else if (mode === 'offline') {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700"><MapPin className="w-3 h-3 mr-1" />Offline</Badge>;
    } else {
      return <Badge variant="outline" className="bg-teal-50 text-teal-700">Hybrid</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kelola Acara
            </CardTitle>
            <CardDescription>Kelola acara dan kegiatan platform</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchEvents()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Acara
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingEvent ? 'Edit Acara' : 'Tambah Acara Baru'}</DialogTitle>
                  <DialogDescription>
                    {editingEvent ? 'Perbarui informasi acara' : 'Buat acara baru untuk komunitas'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Judul Acara</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Nama acara"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mode">Mode</Label>
                      <Select
                        value={formData.mode}
                        onValueChange={(value: 'online' | 'offline' | 'hybrid') => setFormData({ ...formData, mode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacity">Kapasitas</Label>
                      <Input
                        id="capacity"
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                        min={1}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_at">Mulai</Label>
                      <Input
                        id="start_at"
                        type="datetime-local"
                        value={formData.start_at}
                        onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end_at">Selesai</Label>
                      <Input
                        id="end_at"
                        type="datetime-local"
                        value={formData.end_at}
                        onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {formData.mode !== 'online' && (
                    <div className="space-y-2">
                      <Label htmlFor="location">Lokasi</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Alamat lokasi acara"
                      />
                    </div>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {editingEvent ? 'Simpan Perubahan' : 'Buat Acara'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Belum ada acara</p>
            <p className="text-sm">Klik tombol "Tambah Acara" untuk membuat acara baru</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Waktu Mulai</TableHead>
                <TableHead>Waktu Selesai</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{getModeBadge(event.mode)}</TableCell>
                  <TableCell>{formatDateTime(event.start_at)}</TableCell>
                  <TableCell>{formatDateTime(event.end_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {event.capacity || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(event)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(event)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)} className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
