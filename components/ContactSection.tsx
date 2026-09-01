
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Mail, Clock, Send, MessageCircle, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api/client';

const ContactSection = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    category: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const contactInfo = [
    {
      icon: Phone,
      title: 'WhatsApp',
      value: '+62 899 007 6060',
      subtitle: 'Senin - Jumat, 09:00 - 17:00 WIB',
      href: 'https://wa.me/628990076060',
      gradient: 'from-emerald-400 to-teal-500',
      lightBg: 'bg-emerald-50',
    },
    {
      icon: Mail,
      title: 'Email',
      value: 'bryanwahyukp95@gmail.com',
      subtitle: 'Waktu respon: 1x24 jam',
      href: 'mailto:bryanwahyukp95@gmail.com',
      gradient: 'from-blue-400 to-indigo-500',
      lightBg: 'bg-blue-50',
    },
  ];

  const categories = [
    { value: 'general', label: 'Pertanyaan Umum' },
    { value: 'service', label: 'Layanan Terapi' },
    { value: 'technical', label: 'Bantuan Teknis' },
    { value: 'partnership', label: 'Kerjasama' },
    { value: 'feedback', label: 'Saran & Masukan' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiClient.public.contact.submit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone ? `+62${formData.phone}` : undefined,
        subject: categories.find(c => c.value === formData.category)?.label || 'Pertanyaan Umum',
        message: formData.message,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: 'Pesan Terkirim!',
        description: 'Tim kami akan segera menghubungi Anda.',
      });

      setFormData({ name: '', phone: '', email: '', category: '', message: '' });
    } catch (error: any) {
      toast({
        title: 'Gagal Mengirim Pesan',
        description: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="kontak" className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-amber-50/30" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
            Hubungi Kami
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Siap Membantu
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"> Kapan Saja</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Tim support kami tersedia untuk membantu Anda dengan pertanyaan, dukungan teknis, atau konsultasi
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Info (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {contactInfo.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-primary/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${item.lightBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-5 h-5" style={{ color: item.gradient.includes('emerald') ? '#059669' : '#4f46e5' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                    <p className="text-primary font-medium text-sm">{item.value}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.subtitle}</p>
                  </div>
                </a>
              );
            })}

            {/* Operating Hours */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="font-semibold text-gray-900 text-sm">Jam Operasional</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Senin - Jumat</span>
                  <span className="font-medium">08:00 - 20:00</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Sabtu - Minggu</span>
                  <span className="font-medium">09:00 - 17:00</span>
                </div>
                <div className="flex justify-between text-amber-700 font-medium pt-1 border-t border-amber-200/50">
                  <span>Layanan Darurat</span>
                  <span>24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form (3 cols) */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-7 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Kirim Pesan</h3>
                  <p className="text-xs text-gray-600">Kami akan merespon dalam 1x24 jam</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-600 text-sm">Nama Lengkap</Label>
                    <Input
                      id="name"
                      placeholder="Nama Anda"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-600 text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-1.5 rounded-xl border-gray-200 focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-gray-600 text-sm">Telepon</Label>
                    <div className="flex mt-1.5">
                      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-600 text-sm">
                        +62
                      </span>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="812 3456 7890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="rounded-l-none rounded-r-xl border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-gray-600 text-sm">Kategori</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger aria-label="Pilih kategori pesan" className="mt-1.5 rounded-xl border-gray-200">
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="message" className="text-gray-600 text-sm">Pesan</Label>
                  <Textarea
                    id="message"
                    placeholder="Tulis pesan Anda di sini..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                    rows={4}
                    className="mt-1.5 rounded-xl border-gray-200 focus:border-primary/50"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-purple-700 hover:from-primary/90 hover:to-purple-700/90 text-white py-6 text-base font-semibold rounded-xl shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Mengirim...
                    </span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Pesan
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
