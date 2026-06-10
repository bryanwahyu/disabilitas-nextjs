'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import type { Community, CommunityCreate, CommunityWithStats } from '@/lib/api/types';
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
import { Users, Plus, Search, MessageSquare, Clock } from 'lucide-react';

function parseTags(tagsString?: string): string[] {
  if (!tagsString) return [];
  const cleaned = tagsString.replace(/^\{|\}$/g, '');
  return cleaned ? cleaned.split(',').map((t) => t.trim()).filter(Boolean) : [];
}

function lastActivityLabel(iso?: string): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (isNaN(then)) return null;
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 60) return 'aktif baru saja';
  if (mins < 60 * 24) return `aktif ${Math.floor(mins / 60)} jam lalu`;
  const days = Math.floor(mins / (60 * 24));
  if (days < 30) return `aktif ${days} hari lalu`;
  return `aktif ${new Date(iso).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
}

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityWithStats[]>([]);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CommunityCreate>({
    name: '',
    description: '',
    tags: [],
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchCommunities();
  }, [searchQuery]);

  useEffect(() => {
    if (!user) {
      setMyCommunities([]);
      return;
    }
    apiClient.communities.mine().then((res) => {
      if (res.data) setMyCommunities(res.data);
    });
  }, [user]);

  const fetchCommunities = async () => {
    try {
      const response = await apiClient.communities.publicList({
        q: searchQuery || undefined,
        per_page: 50,
      });
      if (response.error) throw new Error(response.error);
      setCommunities(response.data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengambil data komunitas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Nama komunitas harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiClient.communities.create(formData);
      if (response.error) {
        throw new Error(response.error);
      }
      toast({
        title: "Berhasil",
        description: "Komunitas berhasil dibuat",
      });
      setDialogOpen(false);
      setFormData({ name: '', description: '', tags: [] });
      fetchCommunities();
    } catch (error: any) {
      console.error('Error creating community:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat komunitas",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat komunitas...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Komunitas</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Bergabung dengan komunitas untuk berbagi pengalaman, mendapatkan dukungan, dan terhubung dengan sesama
            </p>
          </div>

          {myCommunities.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Komunitas Saya</h2>
              <div className="flex flex-wrap gap-2">
                {myCommunities.map((c) => (
                  <Button
                    key={c.id}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => router.push(`/komunitas/${c.id}`)}
                  >
                    <Users className="h-3.5 w-3.5 mr-1.5" />
                    {c.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari komunitas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            {user && (user.role === 'admin' || user.role === 'therapy') && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Buat Komunitas
              </Button>
            )}
          </div>

          {communities.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Komunitas</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? 'Tidak ditemukan komunitas dengan kata kunci tersebut'
                    : 'Belum ada komunitas yang dibuat'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {communities.map((community) => (
                <Card
                  key={community.id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/komunitas/${community.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{community.name}</CardTitle>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {community.member_count} anggota
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {community.thread_count} diskusi
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {community.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {community.description}
                      </p>
                    )}
                    {community.tags && (
                      <div className="flex flex-wrap gap-1">
                        {parseTags(community.tags).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="flex items-center text-primary">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Lihat Diskusi
                      </span>
                      {lastActivityLabel(community.last_activity_at) && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {lastActivityLabel(community.last_activity_at)}
                        </span>
                      )}
                    </div>
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
            <DialogTitle>Buat Komunitas Baru</DialogTitle>
            <DialogDescription>
              Buat komunitas untuk mengumpulkan orang-orang dengan minat yang sama
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Komunitas *</Label>
              <Input
                placeholder="Nama komunitas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi komunitas"
                rows={3}
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (pisahkan dengan koma)</Label>
              <Input
                placeholder="aksesibilitas, dukungan, terapi"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Buat Komunitas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
