'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  GraduationCap, Search, Trash2, Eye, MapPin, Clock, Users,
  ChevronDown, ChevronUp, Plus, Pencil, Upload, Download, FileText, X, Check,
  Link as LinkIcon, CheckCircle, XCircle, Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TrainingSummary, TrainingRegistration, TrainingMaterial } from '@/lib/api/types';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  pending: { label: 'Menunggu Review', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-300' },
  published: { label: 'Aktif', color: 'bg-green-100 text-green-700 border-green-300' },
  closed: { label: 'Ditutup', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  completed: { label: 'Selesai', color: 'bg-blue-100 text-blue-700 border-blue-300' },
};

const REG_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  approved: { label: 'Diterima', color: 'bg-green-100 text-green-700 border-green-300' },
  rejected: { label: 'Ditolak', color: 'bg-red-100 text-red-700 border-red-300' },
  completed: { label: 'Selesai', color: 'bg-blue-100 text-blue-700 border-blue-300' },
};

const CATEGORY_OPTIONS = [
  { value: 'soft_skill', label: 'Soft Skill' },
  { value: 'hard_skill', label: 'Hard Skill' },
  { value: 'sertifikasi', label: 'Sertifikasi' },
  { value: 'bahasa', label: 'Bahasa' },
  { value: 'teknologi', label: 'Teknologi' },
  { value: 'lainnya', label: 'Lainnya' },
];

const TRAINING_TYPE_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'offline', label: 'Offline' },
  { value: 'hybrid', label: 'Hybrid' },
];

const SKILL_LEVEL_OPTIONS = [
  { value: 'pemula', label: 'Pemula' },
  { value: 'menengah', label: 'Menengah' },
  { value: 'mahir', label: 'Mahir' },
  { value: 'semua', label: 'Semua Level' },
];

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORY_OPTIONS.map(o => [o.value, o.label]));
const TYPE_LABEL: Record<string, string> = Object.fromEntries(TRAINING_TYPE_OPTIONS.map(o => [o.value, o.label]));

const formatPrice = (price: number, currency?: string) => {
  if (price === 0) return 'Gratis';
  return `${currency || 'IDR'} ${new Intl.NumberFormat('id-ID').format(price)}`;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const EMPTY_FORM = {
  title: '',
  description: '',
  organizer_name: '',
  organizer_logo: '',
  organizer_website: '',
  category: 'hard_skill',
  training_type: 'online',
  location: '',
  training_url: '',
  start_date: '',
  end_date: '',
  schedule_info: '',
  max_participants: '',
  price: '',
  price_currency: 'IDR',
  disability_types: '',
  skill_level: 'semua',
  certificate: false,
  status: 'published',
};

const TrainingManager = () => {
  const [trainings, setTrainings] = useState<TrainingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [totalTrainings, setTotalTrainings] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingSummary | null>(null);

  // Registrations panel
  const [regsOpen, setRegsOpen] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<TrainingRegistration[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);

  // Materials panel
  const [materialsOpen, setMaterialsOpen] = useState<string | null>(null);
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create / Edit form
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 200 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const response = await apiClient.adminTrainings.list(params);
      if (response.error) throw new Error(response.error);
      const data = Array.isArray(response.data) ? response.data : [];
      setTrainings(data);
      setTotalTrainings((response as any).meta?.total || data.length);
    } catch {
      toast({ title: 'Error', description: 'Gagal mengambil data pelatihan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => { fetchTrainings(); }, [fetchTrainings]);

  // CREATE / EDIT
  const openCreate = () => {
    setFormMode('create');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = async (training: TrainingSummary) => {
    setFormMode('edit');
    setEditingId(training.id);
    try {
      const res = await apiClient.adminTrainings.get(training.id);
      if (res.error) throw new Error(res.error);
      const d = res.data as any;
      setForm({
        title: d.title || '',
        description: d.description || '',
        organizer_name: d.organizer_name || '',
        organizer_logo: d.organizer_logo || '',
        organizer_website: d.organizer_website || '',
        category: d.category || 'hard_skill',
        training_type: d.training_type || 'online',
        location: d.location || '',
        training_url: d.training_url || '',
        start_date: d.start_date ? d.start_date.slice(0, 10) : '',
        end_date: d.end_date ? d.end_date.slice(0, 10) : '',
        schedule_info: d.schedule_info || '',
        max_participants: d.max_participants ? String(d.max_participants) : '',
        price: d.price ? String(d.price) : '',
        price_currency: d.price_currency || 'IDR',
        disability_types: d.disability_types || '',
        skill_level: d.skill_level || 'semua',
        certificate: d.certificate || false,
        status: d.status || 'published',
      });
      setFormOpen(true);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal memuat data pelatihan', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.organizer_name || !form.start_date) {
      toast({ title: 'Validasi', description: 'Judul, deskripsi, penyelenggara, dan tanggal mulai wajib diisi', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        organizer_name: form.organizer_name,
        category: form.category,
        training_type: form.training_type,
        skill_level: form.skill_level,
        start_date: form.start_date,
        status: form.status,
        certificate: form.certificate,
        price_currency: form.price_currency || 'IDR',
      };
      if (form.organizer_logo) payload.organizer_logo = form.organizer_logo;
      if (form.organizer_website) payload.organizer_website = form.organizer_website;
      if (form.location) payload.location = form.location;
      if (form.training_url) payload.training_url = form.training_url;
      if (form.end_date) payload.end_date = form.end_date;
      if (form.schedule_info) payload.schedule_info = form.schedule_info;
      if (form.max_participants) payload.max_participants = parseInt(form.max_participants);
      if (form.price) payload.price = parseInt(form.price);
      if (form.disability_types) payload.disability_types = form.disability_types;

      let res;
      if (formMode === 'create') {
        res = await apiClient.adminTrainings.create(payload);
      } else {
        res = await apiClient.adminTrainings.update(editingId!, payload);
      }
      if (res.error) throw new Error(res.error);

      toast({ title: 'Berhasil', description: formMode === 'create' ? 'Pelatihan berhasil ditambahkan' : 'Pelatihan berhasil diperbarui' });
      setFormOpen(false);
      fetchTrainings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menyimpan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // DELETE
  const confirmDelete = (training: TrainingSummary) => {
    setSelectedTraining(training);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTraining) return;
    try {
      const res = await apiClient.adminTrainings.delete(selectedTraining.id);
      if (res.error) throw new Error(res.error);
      toast({ title: 'Berhasil', description: 'Pelatihan berhasil dihapus' });
      setDeleteDialogOpen(false);
      setSelectedTraining(null);
      fetchTrainings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menghapus', variant: 'destructive' });
    }
  };

  const handleApprove = async (t: TrainingSummary) => {
    try {
      const res = await apiClient.adminTrainings.approve(t.id);
      if (res.error) throw new Error(res.error);
      toast({ title: 'Disetujui', description: `"${t.title}" sekarang tayang` });
      fetchTrainings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menyetujui', variant: 'destructive' });
    }
  };

  const handleReject = async (t: TrainingSummary) => {
    const reason = window.prompt(`Alasan menolak "${t.title}":`);
    if (reason === null) return;
    if (!reason.trim()) {
      toast({ title: 'Error', description: 'Alasan penolakan wajib diisi', variant: 'destructive' });
      return;
    }
    try {
      const res = await apiClient.adminTrainings.reject(t.id, reason.trim());
      if (res.error) throw new Error(res.error);
      toast({ title: 'Ditolak', description: `"${t.title}" dikembalikan ke yayasan` });
      fetchTrainings();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menolak', variant: 'destructive' });
    }
  };

  // REGISTRATIONS
  const toggleRegistrations = async (trainingId: string) => {
    if (regsOpen === trainingId) {
      setRegsOpen(null);
      return;
    }
    setRegsOpen(trainingId);
    setLoadingRegs(true);
    try {
      const res = await apiClient.adminTrainings.registrations(trainingId);
      if (res.error) throw new Error(res.error);
      setRegistrations(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat pendaftar', variant: 'destructive' });
    } finally {
      setLoadingRegs(false);
    }
  };

  const updateRegStatus = async (trainingId: string, regId: string, status: string) => {
    try {
      const res = await apiClient.adminTrainings.updateRegistrationStatus(trainingId, regId, status);
      if (res.error) throw new Error(res.error);
      toast({ title: 'Berhasil', description: `Status pendaftar diperbarui ke ${REG_STATUS_CONFIG[status]?.label || status}` });
      toggleRegistrations(trainingId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal memperbarui status', variant: 'destructive' });
    }
  };

  // MATERIALS
  const toggleMaterials = async (trainingId: string) => {
    if (materialsOpen === trainingId) {
      setMaterialsOpen(null);
      return;
    }
    setMaterialsOpen(trainingId);
    setLoadingMaterials(true);
    try {
      const res = await apiClient.adminTrainings.listMaterials(trainingId);
      if (res.error) throw new Error(res.error);
      setMaterials(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat materi', variant: 'destructive' });
    } finally {
      setLoadingMaterials(false);
    }
  };

  const handleFileUpload = async (trainingId: string, file: File) => {
    setUploading(true);
    try {
      // Step 1: Get presigned upload URL
      const presignRes = await apiClient.adminTrainings.presignUpload(trainingId, {
        file_name: file.name,
        content_type: file.type || 'application/octet-stream',
        file_size: file.size,
      });
      if (presignRes.error) throw new Error(presignRes.error);
      const presignData = presignRes.data!;

      // Step 2: Upload file directly to S3 via presigned URL
      const uploadRes = await fetch(presignData.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': presignData.content_type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload ke S3 gagal');

      // Step 3: Confirm upload to backend
      const confirmRes = await apiClient.adminTrainings.confirmMaterial(trainingId, {
        material_id: presignData.material_id,
        name: file.name,
        s3_key: presignData.s3_key,
        content_type: presignData.content_type,
        file_size: file.size,
      });
      if (confirmRes.error) throw new Error(confirmRes.error);

      toast({ title: 'Berhasil', description: `Materi "${file.name}" berhasil diupload` });
      toggleMaterials(trainingId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal mengupload materi', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDownloadMaterial = async (trainingId: string, materialId: string, fileName: string) => {
    try {
      const res = await apiClient.adminTrainings.downloadMaterial(trainingId, materialId);
      if (res.error) throw new Error(res.error);
      window.open(res.data!.download_url, '_blank');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal mengunduh materi', variant: 'destructive' });
    }
  };

  const handleDeleteMaterial = async (trainingId: string, materialId: string) => {
    try {
      const res = await apiClient.adminTrainings.deleteMaterial(trainingId, materialId);
      if (res.error) throw new Error(res.error);
      toast({ title: 'Berhasil', description: 'Materi berhasil dihapus' });
      toggleMaterials(trainingId);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menghapus materi', variant: 'destructive' });
    }
  };

  // FILTER
  const filtered = trainings.filter(t => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.organizer_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    all: trainings.length,
    draft: trainings.filter(t => t.status === 'draft').length,
    published: trainings.filter(t => t.status === 'published').length,
    closed: trainings.filter(t => t.status === 'closed').length,
    completed: trainings.filter(t => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter('all')}>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold">{counts.all}</div>
            <div className="text-xs text-muted-foreground">Total Pelatihan</div>
          </CardContent>
        </Card>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Card key={key} className="cursor-pointer hover:shadow-md" onClick={() => setStatusFilter(key)}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="text-2xl font-bold">{counts[key as keyof typeof counts] || 0}</div>
              <div className="text-xs text-muted-foreground">{cfg.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari pelatihan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Tambah Pelatihan
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Belum ada pelatihan</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t) => {
            const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.draft;
            return (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate">{t.title}</h3>
                        <Badge variant="outline" className={statusCfg.color}>{statusCfg.label}</Badge>
                        <Badge variant="outline">{CATEGORY_LABEL[t.category] || t.category}</Badge>
                        <Badge variant="outline">{TYPE_LABEL[t.training_type] || t.training_type}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-3.5 w-3.5" /> {t.organizer_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {new Date(t.start_date).toLocaleDateString('id-ID')}
                          {t.end_date && ` - ${new Date(t.end_date).toLocaleDateString('id-ID')}`}
                        </span>
                        {t.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {t.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" /> {t.max_participants ? `${t.max_participants} kuota` : 'Tak terbatas'}
                        </span>
                        <span className="font-medium text-foreground">{formatPrice(t.price, t.price_currency)}</span>
                        {t.certificate && <Badge variant="secondary" className="text-xs">Bersertifikat</Badge>}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" /> {t.view_count} views
                      </div>
                    </div>
                    <div className="flex items-start gap-2 shrink-0">
                      {t.status === 'pending' && (
                        <>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(t)}>
                            <Check className="h-3.5 w-3.5 mr-1" /> Setujui
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReject(t)}>
                            <X className="h-3.5 w-3.5 mr-1" /> Tolak
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleRegistrations(t.id)}>
                        <Users className="h-3.5 w-3.5 mr-1" />
                        {regsOpen === t.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toggleMaterials(t.id)}>
                        <FileText className="h-3.5 w-3.5 mr-1" />
                        {materialsOpen === t.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => confirmDelete(t)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Registrations Expandable */}
                  {regsOpen === t.id && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Pendaftar
                      </h4>
                      {loadingRegs ? (
                        <p className="text-sm text-muted-foreground">Memuat...</p>
                      ) : registrations.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada pendaftar</p>
                      ) : (
                        <div className="space-y-2">
                          {registrations.map((reg) => {
                            const regCfg = REG_STATUS_CONFIG[reg.status] || REG_STATUS_CONFIG.pending;
                            return (
                              <div key={reg.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                                <div>
                                  <span className="font-medium">{reg.user_id}</span>
                                  {reg.motivation && <span className="ml-2 text-muted-foreground">— {reg.motivation}</span>}
                                  <span className="ml-2 text-xs text-muted-foreground">{new Date(reg.registered_at).toLocaleDateString('id-ID')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={regCfg.color}>{regCfg.label}</Badge>
                                  {reg.status === 'pending' && (
                                    <>
                                      <Button size="sm" variant="outline" className="h-7 text-green-600" onClick={() => updateRegStatus(t.id, reg.id, 'approved')}>
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-red-600" onClick={() => updateRegStatus(t.id, reg.id, 'rejected')}>
                                        <XCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  )}
                                  {reg.status === 'approved' && (
                                    <Button size="sm" variant="outline" className="h-7" onClick={() => updateRegStatus(t.id, reg.id, 'completed')}>
                                      Selesai
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Materials Expandable */}
                  {materialsOpen === t.id && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" /> Materi Pelatihan
                        </h4>
                        <div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(t.id, file);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            {uploading ? (
                              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5 mr-1" />
                            )}
                            Upload Materi
                          </Button>
                        </div>
                      </div>
                      {loadingMaterials ? (
                        <p className="text-sm text-muted-foreground">Memuat...</p>
                      ) : materials.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada materi</p>
                      ) : (
                        <div className="space-y-2">
                          {materials.map((mat) => (
                            <div key={mat.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="truncate">
                                  <span className="font-medium">{mat.name}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">{formatFileSize(mat.file_size)}</span>
                                  <span className="ml-2 text-xs text-muted-foreground">{mat.content_type}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button size="sm" variant="ghost" className="h-7" onClick={() => handleDownloadMaterial(t.id, mat.id, mat.name)}>
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-7 text-red-600" onClick={() => handleDeleteMaterial(t.id, mat.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{formMode === 'create' ? 'Tambah Pelatihan' : 'Edit Pelatihan'}</DialogTitle>
            <DialogDescription>
              {formMode === 'create' ? 'Buat pelatihan baru' : 'Perbarui informasi pelatihan'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Judul Pelatihan *</Label>
              <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Judul pelatihan" />
            </div>

            <div>
              <Label>Deskripsi *</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Deskripsi lengkap pelatihan" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Penyelenggara *</Label>
                <Input value={form.organizer_name} onChange={(e) => setForm(f => ({ ...f, organizer_name: e.target.value }))} placeholder="Nama penyelenggara" />
              </div>
              <div>
                <Label>Website Penyelenggara</Label>
                <Input value={form.organizer_website} onChange={(e) => setForm(f => ({ ...f, organizer_website: e.target.value }))} placeholder="https://..." />
              </div>
            </div>

            <div>
              <Label>Logo Penyelenggara (URL)</Label>
              <Input value={form.organizer_logo} onChange={(e) => setForm(f => ({ ...f, organizer_logo: e.target.value }))} placeholder="https://example.com/logo.png" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tipe</Label>
                <Select value={form.training_type} onValueChange={(v) => setForm(f => ({ ...f, training_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRAINING_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.skill_level} onValueChange={(v) => setForm(f => ({ ...f, skill_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location & Zoom Link */}
            {(form.training_type === 'offline' || form.training_type === 'hybrid') && (
              <div>
                <Label>Lokasi</Label>
                <Input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Alamat lokasi pelatihan" />
              </div>
            )}

            {(form.training_type === 'online' || form.training_type === 'hybrid') && (
              <div>
                <Label className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" /> Link Zoom / Meeting URL</Label>
                <Input value={form.training_url} onChange={(e) => setForm(f => ({ ...f, training_url: e.target.value }))} placeholder="https://zoom.us/j/..." />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tanggal Mulai *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div>
                <Label>Tanggal Selesai</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label>Jadwal</Label>
              <Input value={form.schedule_info} onChange={(e) => setForm(f => ({ ...f, schedule_info: e.target.value }))} placeholder="Contoh: Senin-Jumat 09:00-12:00 WIB" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Harga (kosong = gratis)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Kuota Peserta</Label>
                <Input type="number" value={form.max_participants} onChange={(e) => setForm(f => ({ ...f, max_participants: e.target.value }))} placeholder="Kosong = tak terbatas" />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Jenis Disabilitas (koma-separated)</Label>
              <Input value={form.disability_types} onChange={(e) => setForm(f => ({ ...f, disability_types: e.target.value }))} placeholder="fisik, netra, tuli, dll" />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="certificate"
                checked={form.certificate}
                onChange={(e) => setForm(f => ({ ...f, certificate: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="certificate">Bersertifikat</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : formMode === 'create' ? 'Tambah' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pelatihan</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus &quot;{selectedTraining?.title}&quot;? Tindakan ini tidak dapat dibatalkan.
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

export default TrainingManager;
