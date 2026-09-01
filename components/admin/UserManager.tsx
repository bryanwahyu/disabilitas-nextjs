
import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, UserCog, Shield, Heart, Baby, Stethoscope, Trash2, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/lib/api/types';

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  admin: {
    label: 'Admin',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <Shield className="w-3 h-3" />,
  },
  user_disabilitas: {
    label: 'Penyandang Disabilitas',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Heart className="w-3 h-3" />,
  },
  orang_tua: {
    label: 'Orang Tua',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Baby className="w-3 h-3" />,
  },
  therapy: {
    label: 'Terapis',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Stethoscope className="w-3 h-3" />,
  },
  therapist_independent: {
    label: 'Terapis Independen',
    color: 'bg-teal-100 text-teal-800 border-teal-200',
    icon: <Stethoscope className="w-3 h-3" />,
  },
};

const getRoleConfig = (role: string) =>
  ROLE_CONFIG[role] || { label: role, color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <UserCog className="w-3 h-3" /> };

const UserManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listParams = { page: 1, page_size: 200 };
  const { data: userList, isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.users.list(listParams),
    queryFn: () => unwrap(apiClient.adminUsers.list(listParams)),
  });

  const users: User[] = Array.isArray(userList) ? userList : [];

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching users:', listError);
    toast({ title: 'Error', description: 'Gagal mengambil data pengguna', variant: 'destructive' });
  }, [listError, toast]);

  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.users.lists() });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      unwrap(apiClient.adminUsers.updateRole(userId, newRole)),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Role pengguna diperbarui' });
      invalidateUsers();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Gagal memperbarui role', variant: 'destructive' });
    },
  });

  const updatingRole = updateRoleMutation.isPending
    ? updateRoleMutation.variables?.userId ?? null
    : null;

  const { mutate: removeUser } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminUsers.delete(id)),
    onSuccess: () => {
      toast({ title: 'Berhasil', description: 'Pengguna dihapus' });
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      invalidateUsers();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Gagal menghapus pengguna', variant: 'destructive' });
    },
  });

  const handleUpdateRole = (userId: string, newRole: string) =>
    updateRoleMutation.mutate({ userId, newRole });

  const handleDelete = () => {
    if (!selectedUser) return;
    removeUser(selectedUser.id);
  };

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.full_name || u.name || u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return <div className="text-center py-8">Memuat data pengguna...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Role Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Object.entries(ROLE_CONFIG).map(([role, config]) => (
          <Card
            key={role}
            className={`cursor-pointer transition-all hover:shadow-md ${roleFilter === role ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setRoleFilter(roleFilter === role ? 'all' : role)}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${config.color}`}>{config.icon}</div>
              <div>
                <p className="text-2xl font-bold">{roleCounts[role] || 0}</p>
                <p className="text-xs text-muted-foreground">{config.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>Manajemen Pengguna</CardTitle>
              <CardDescription>Total {users.length} pengguna terdaftar</CardDescription>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Role ({users.length})</SelectItem>
                {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                  <SelectItem key={role} value={role}>
                    {config.label} ({roleCounts[role] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const rc = getRoleConfig(user.role);
                return (
                  <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-base truncate">
                            {user.full_name || user.name || 'Nama belum diisi'}
                          </h3>
                          <Badge variant="outline" className={rc.color}>
                            {rc.icon}
                            <span className="ml-1">{rc.label}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                          {user.phone && <span>Telp: {user.phone}</span>}
                          {user.city && <span>Kota: {user.city}</span>}
                          {user.created_at && (
                            <span>Bergabung: {new Date(user.created_at).toLocaleDateString('id-ID')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          value={user.role}
                          onValueChange={(val) => handleUpdateRole(user.id, val)}
                          disabled={updatingRole === user.id}
                        >
                          <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_CONFIG).map(([role, config]) => (
                              <SelectItem key={role} value={role}>
                                {config.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna <strong>{selectedUser?.full_name || selectedUser?.email}</strong>?
              Tindakan ini tidak dapat dibatalkan.
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

export default UserManager;
