

import React, { useState, useEffect, useRef } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sanitizeEditorHtml } from '@/lib/sanitize';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ArticleInsert, Article } from '@/lib/api/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, FileText, Eye, EyeOff, Calendar, User } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const ArticleManager = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const editorRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<ArticleInsert>({
    title: '',
    content: '',
    excerpt: '',
    cover_image: '',
    category: '',
    tags: '',
    status: 'draft',
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const listParams: { status?: string; limit: number } = { limit: 100 };
  if (filterStatus !== 'all') listParams.status = filterStatus;

  const { data: articles = [], isPending: loading, error: listError } = useQuery({
    queryKey: qk.admin.articles.list(listParams),
    queryFn: () => unwrap(apiClient.adminArticles.list(listParams)),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!listError) return;
    console.error('Error fetching articles:', listError);
    toast({
      title: "Error",
      description: "Gagal mengambil data artikel",
      variant: "destructive",
    });
  }, [listError, toast]);

  const invalidateArticles = () =>
    queryClient.invalidateQueries({ queryKey: qk.admin.articles.lists() });

  const { mutate: saveArticle } = useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: ArticleInsert }) =>
      id
        ? unwrap(apiClient.adminArticles.update(id, body))
        : unwrap(apiClient.adminArticles.create(body)),
    onSuccess: (_data, { id }) => {
      toast({
        title: "Berhasil",
        description: id ? "Artikel berhasil diperbarui" : "Artikel berhasil ditambahkan",
      });
      setDialogOpen(false);
      resetForm();
      invalidateArticles();
    },
    onError: (error) => {
      console.error('Error saving article:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan artikel",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ambil isi dari contentEditable lalu sanitasi sebelum dikirim.
    const rawContent = editorRef.current?.innerHTML || formData.content || '';
    const content = sanitizeEditorHtml(rawContent);

    saveArticle({ id: editingArticle?.id ?? null, body: { ...formData, content } });
  };

  const { mutate: loadArticleForEdit } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminArticles.get(id)),
    onSuccess: (article) => {
      if (!article) return;
      setEditingArticle(article);
      setFormData({
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        cover_image: article.cover_image || '',
        category: article.category,
        tags: article.tags || '',
        status: article.status,
      });
      setDialogOpen(true);
      // Editor baru ada di DOM setelah dialog terbuka.
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = article.content || '';
        }
      }, 100);
    },
    onError: (error) => {
      console.error('Error fetching article:', error);
    },
  });

  const handleEdit = (id: string) => loadArticleForEdit(id);

  const { mutate: removeArticle } = useMutation({
    mutationFn: (id: string) => unwrap(apiClient.adminArticles.delete(id)),
    onSuccess: () => {
      toast({
        title: "Berhasil",
        description: "Artikel berhasil dihapus",
      });
      invalidateArticles();
    },
    onError: (error) => {
      console.error('Error deleting article:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus artikel",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    removeArticle(id);
  };

  const { mutate: setPublishStatus } = useMutation({
    mutationFn: ({ id, publish }: { id: string; publish: boolean }) =>
      unwrap(apiClient.adminArticles.update(id, { status: publish ? 'published' : 'draft' })),
    onSuccess: (_data, { publish }) => {
      toast({
        title: "Berhasil",
        description: publish ? "Artikel berhasil dipublikasikan" : "Artikel dikembalikan ke draft",
      });
      invalidateArticles();
    },
    onError: (error) => {
      console.error('Error updating article status:', error);
      toast({
        title: "Error",
        description: "Gagal mengubah status artikel",
        variant: "destructive",
      });
    },
  });

  const handlePublish = (id: string, publish: boolean) => setPublishStatus({ id, publish });

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      cover_image: '',
      category: '',
      tags: '',
      status: 'draft',
    });
    setEditingArticle(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="bg-green-500">Dipublikasikan</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Diarsipkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Simple formatting commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  if (loading) {
    return <div className="text-center py-8">Memuat artikel...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Manajemen Artikel
            </CardTitle>
            <CardDescription>
              Buat dan kelola artikel untuk website
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Artikel</SelectItem>
                <SelectItem value="published">Dipublikasikan</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Diarsipkan</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tulis Artikel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingArticle ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingArticle
                      ? 'Perbarui artikel yang ada'
                      : 'Buat artikel baru untuk website'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Judul Artikel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Masukkan judul artikel"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Kategori</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Contoh: Berita, Tips, Panduan"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Publikasikan</SelectItem>
                          <SelectItem value="archived">Arsipkan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Ringkasan</Label>
                    <Textarea
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      placeholder="Ringkasan singkat artikel (akan tampil di daftar)"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cover_image">URL Gambar Cover</Label>
                    <Input
                      id="cover_image"
                      value={formData.cover_image}
                      onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div>
                    <Label>Konten Artikel</Label>
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-1 p-2 border border-b-0 rounded-t-md bg-gray-50" role="toolbar" aria-label="Format teks">
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('bold')} aria-label="Tebal">
                        <strong>B</strong>
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('italic')} aria-label="Miring">
                        <em>I</em>
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('underline')} aria-label="Garis bawah">
                        <u>U</u>
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" role="separator" />
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('formatBlock', 'h2')} aria-label="Heading 2">
                        H2
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('formatBlock', 'h3')} aria-label="Heading 3">
                        H3
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('formatBlock', 'p')} aria-label="Paragraf">
                        P
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" role="separator" />
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('insertUnorderedList')} aria-label="Daftar tak berurut">
                        UL
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => execCommand('insertOrderedList')} aria-label="Daftar berurut">
                        OL
                      </Button>
                      <div className="w-px bg-gray-300 mx-1" role="separator" />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label="Tambah link"
                        onClick={() => {
                          const url = prompt('Masukkan URL link:');
                          if (url) execCommand('createLink', url);
                        }}
                      >
                        Link
                      </Button>
                    </div>
                    {/* Editor */}
                    <div
                      ref={editorRef}
                      contentEditable
                      role="textbox"
                      aria-label="Konten artikel"
                      aria-multiline="true"
                      className="min-h-[300px] p-4 border rounded-b-md focus:outline-none focus:ring-2 focus:ring-primary prose prose-sm max-w-none"
                      style={{ backgroundColor: 'white' }}
                      dangerouslySetInnerHTML={{ __html: formData.content || '' }}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (pisahkan dengan koma)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="disabilitas, terapi, kesehatan"
                    />
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
                      {editingArticle ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {articles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada artikel</p>
            <p className="text-sm">Mulai menulis artikel pertama Anda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className={`border rounded-lg p-4 ${article.status === 'draft' ? 'bg-gray-50' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{article.title}</h3>
                      {getStatusBadge(article.status)}
                      {article.category && (
                        <Badge variant="outline">{article.category}</Badge>
                      )}
                    </div>
                    {article.excerpt && (
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {article.author_name || 'Admin'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {article.view_count} views
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {article.status === 'published' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePublish(article.id, false)}
                        title="Kembalikan ke Draft"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handlePublish(article.id, true)}
                        className="bg-green-600 hover:bg-green-700"
                        title="Publikasikan"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(article.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(article.id)}
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

export default ArticleManager;
