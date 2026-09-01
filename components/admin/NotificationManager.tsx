
import React, { useState, useEffect } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { NotificationCreate, NotificationType, NotificationPriority } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, Trash2, Plus, Send, Users, Calendar, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'system', label: 'Sistem' },
  { value: 'appointment', label: 'Janji Temu' },
  { value: 'community', label: 'Komunitas' },
  { value: 'event', label: 'Acara' },
  { value: 'therapy', label: 'Terapi' },
  { value: 'chat', label: 'Chat' },
];

const PRIORITY_OPTIONS: { value: NotificationPriority; label: string }[] = [
  { value: 'low', label: 'Rendah' },
  { value: 'medium', label: 'Normal' },
  { value: 'high', label: 'Tinggi' },
  { value: 'urgent', label: 'Mendesak' },
];

const NotificationManager = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for creating notification
  const [formData, setFormData] = useState<NotificationCreate>({
    type: 'system',
    title: '',
    message: '',
    priority: 'medium',
    user_id: '',
  });

  const listParams: { type?: string; limit: number } = { limit: 100 };
  if (filterType !== 'all') listParams.type = filterType;

  const { data: notifications = [], isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.notifications.list(listParams),
    queryFn: () => unwrap(apiClient.adminNotifications.list(listParams)),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching notifications:', listError);
    toast({
      title: "Error",
      description: "Gagal mengambil data notifikasi",
      variant: "destructive",
    });
  }, [listError, toast]);

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.notifications.lists() });

  const { mutate: createNotification } = useMutation({
    mutationFn: (data: NotificationCreate) => unwrap(apiClient.adminNotifications.create(data)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Notifikasi berhasil dibuat",
      });
      setDialogOpen(false);
      setFormData({
        type: 'system',
        title: '',
        message: '',
        priority: 'medium',
        user_id: '',
      });
      invalidateNotifications();
    },
    onError: (error) => {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Gagal membuat notifikasi",
        variant: "destructive",
      });
    },
  });

  const { mutate: removeNotification } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminNotifications.delete(id)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Notifikasi berhasil dihapus",
      });
      invalidateNotifications();
    },
    onError: (error) => {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus notifikasi",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Error",
        description: "Judul dan pesan harus diisi",
        variant: "destructive",
      });
      return;
    }

    const data: NotificationCreate = {
      type: formData.type,
      title: formData.title,
      message: formData.message,
      priority: formData.priority,
    };
    if (formData.user_id) {
      data.user_id = formData.user_id;
    }

    createNotification(data);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus notifikasi ini?')) return;
    removeNotification(id);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'community': return <Users className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const typeObj = NOTIFICATION_TYPES.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Memuat...</div>
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
              <Bell className="h-5 w-5" />
              Kelola Notifikasi
            </CardTitle>
            <CardDescription>
              Kelola dan kirim notifikasi ke pengguna
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Buat Notifikasi
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter */}
        <div className="flex gap-4 mb-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              {NOTIFICATION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notification List */}
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="p-2 bg-muted rounded-full">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{notification.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {getTypeBadge(notification.type)}
                    </Badge>
                    <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                      {notification.priority}
                    </Badge>
                    {notification.read && (
                      <Badge variant="secondary" className="text-xs">Dibaca</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(notification.created_at)}</span>
                    {notification.user_id && (
                      <span>User: {notification.user_id.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(notification.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Create Notification Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Notifikasi Baru</DialogTitle>
            <DialogDescription>
              Kirim notifikasi ke pengguna tertentu atau broadcast
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipe Notifikasi</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as NotificationType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value as NotificationPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>User ID (kosongkan untuk broadcast)</Label>
              <Input
                placeholder="UUID pengguna (opsional)"
                value={formData.user_id || ''}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input
                placeholder="Judul notifikasi"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Pesan *</Label>
              <Textarea
                placeholder="Isi pesan notifikasi"
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate}>
              <Send className="h-4 w-4 mr-2" />
              Kirim Notifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default NotificationManager;
