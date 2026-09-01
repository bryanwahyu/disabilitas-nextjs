
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, MessageSquare, Star, Send, CheckCircle, Bug, AlertTriangle, ThumbsUp } from 'lucide-react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';
import type { ContactType, ContactCategory } from '@/lib/api/types';

export const Route = createFileRoute('/_public/feedback/')({
  component: FeedbackPage,
});


const FEEDBACK_TYPES = [
  {
    value: 'feedback' as ContactType,
    label: 'Feedback',
    description: 'Berikan masukan atau saran untuk layanan kami',
    icon: MessageSquare,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    value: 'bug' as ContactType,
    label: 'Laporan Bug',
    description: 'Laporkan masalah teknis atau error yang Anda temui',
    icon: Bug,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    value: 'aduan' as ContactType,
    label: 'Aduan',
    description: 'Sampaikan keluhan atau pengaduan Anda',
    icon: AlertTriangle,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
];

const CATEGORIES = [
  { value: 'general' as ContactCategory, label: 'Umum' },
  { value: 'feature' as ContactCategory, label: 'Saran Fitur' },
  { value: 'complaint' as ContactCategory, label: 'Keluhan' },
  { value: 'praise' as ContactCategory, label: 'Apresiasi' },
];

function FeedbackPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedbackType, setFeedbackType] = useState<ContactType>('feedback');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'general' as ContactCategory,
    subject: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Error',
        description: 'Nama, email, dan pesan harus diisi',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.public.contact.submit({
        type: feedbackType,
        category: formData.category,
        rating: rating > 0 ? rating : undefined,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.subject || `${FEEDBACK_TYPES.find(t => t.value === feedbackType)?.label} dari ${formData.name}`,
        message: formData.message,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      setSubmitted(true);
      toast({
        title: 'Berhasil',
        description: 'Terima kasih! Pesan Anda telah terkirim.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengirim pesan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setFeedbackType('feedback');
    setFormData({ name: '', email: '', phone: '', category: 'general', subject: '', message: '' });
    setRating(0);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <main className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Terima Kasih!</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {feedbackType === 'bug' && 'Laporan bug Anda akan segera kami tindaklanjuti.'}
                  {feedbackType === 'aduan' && 'Aduan Anda akan segera kami proses dan tindaklanjuti.'}
                  {feedbackType === 'feedback' && 'Feedback Anda sangat berarti bagi kami untuk meningkatkan layanan DisabilitasKu.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate({ to: '/' })}>
                    Kembali ke Beranda
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Kirim Pesan Lain
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate({ to: '/' })}
            className="mb-6 text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </Button>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Feedback, Bug & <span className="text-primary">Aduan</span>
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Masukan Anda membantu kami menjadi lebih baik. Pilih jenis pesan yang ingin Anda sampaikan.
            </p>
          </div>

          {/* Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {FEEDBACK_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = feedbackType === type.value;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-12 h-12 ${type.bgColor} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className={`w-6 h-6 ${type.color}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </button>
              );
            })}
          </div>

          {/* Feedback Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {feedbackType === 'feedback' && 'Form Feedback'}
                {feedbackType === 'bug' && 'Laporan Bug'}
                {feedbackType === 'aduan' && 'Form Aduan'}
              </CardTitle>
              <CardDescription>
                Field dengan tanda (*) wajib diisi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating - only for feedback */}
                {feedbackType === 'feedback' && (
                  <div className="space-y-2">
                    <Label>Bagaimana pengalaman Anda secara keseluruhan?</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                          aria-label={`Beri rating ${star} dari 5`}
                          aria-pressed={star <= rating}
                        >
                          <Star
                            className={`w-8 h-8 transition-colors ${
                              star <= (hoverRating || rating)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-sm text-gray-500">
                          {rating === 1 && 'Sangat Buruk'}
                          {rating === 2 && 'Buruk'}
                          {rating === 3 && 'Cukup'}
                          {rating === 4 && 'Baik'}
                          {rating === 5 && 'Sangat Baik'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nama *</Label>
                  <Input
                    id="name"
                    placeholder="Nama lengkap Anda"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@contoh.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Kami akan menghubungi Anda melalui email ini
                  </p>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="08xxxxxxxxxx (opsional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Category - for feedback type */}
                {feedbackType === 'feedback' && (
                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ContactCategory })}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    {feedbackType === 'bug' ? 'Judul Bug' : feedbackType === 'aduan' ? 'Subjek Aduan' : 'Subjek'}
                  </Label>
                  <Input
                    id="subject"
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Contoh: Error saat login'
                        : feedbackType === 'aduan'
                        ? 'Contoh: Keluhan layanan'
                        : 'Subjek pesan (opsional)'
                    }
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">
                    {feedbackType === 'bug' ? 'Detail Bug *' : feedbackType === 'aduan' ? 'Detail Aduan *' : 'Pesan *'}
                  </Label>
                  <Textarea
                    id="message"
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Jelaskan langkah-langkah untuk mereproduksi bug...'
                        : feedbackType === 'aduan'
                        ? 'Jelaskan detail aduan Anda...'
                        : 'Ceritakan pengalaman atau masukan Anda...'
                    }
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    required
                  />
                  {feedbackType === 'bug' && (
                    <p className="text-xs text-gray-500">
                      Sertakan browser, perangkat, dan langkah untuk mereproduksi bug jika memungkinkan
                    </p>
                  )}
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    'Mengirim...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {feedbackType === 'bug' ? 'Laporkan Bug' : feedbackType === 'aduan' ? 'Kirim Aduan' : 'Kirim Feedback'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
