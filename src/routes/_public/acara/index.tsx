import { createFileRoute } from '@tanstack/react-router';

import React, { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { RSVPStatus } from '@/lib/api/types';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Video, Clock, CheckCircle, XCircle, HelpCircle } from 'lucide-react';
import { jsonLdScript } from '@/lib/seo/head';
import { env } from '@/lib/env';

export const Route = createFileRoute('/_public/acara/')({
  // Canonical halaman daftar; dipindah dari layout supaya tidak ikut
  // menempel di halaman detail (lihat catatan di route.tsx).
  /*
   * Breadcrumb JSON-LD ada di halaman daftar, bukan di layout induknya.
   *
   * Saat masih di layout, halaman detail menerima DUA BreadcrumbList: milik
   * layout (Beranda › Acara) dan miliknya sendiri (Beranda › Acara › judul).
   * Dua breadcrumb yang saling bertentangan di satu halaman membuat mesin
   * pencari memilih sendiri mana yang dipakai.
   */
  head: () => ({
    links: [{ rel: 'canonical', href: 'https://disabilitasku.id/acara' }],
    scripts: [
      jsonLdScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: env.siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Acara', item: `${env.siteUrl}/acara` },
        ],
      }),
    ],
  }),

  /*
   * Isi daftar diambil di loader supaya ikut ter-render di HTML server.
   *
   * Tanpa ini `isPending` selalu true saat SSR: HTML yang dikirim cuma
   * spinner "Memuat…" — tanpa `<h1>` dan tanpa satu pun item. Cache-nya
   * disalurkan ke klien oleh `setupRouterSsrQueryIntegration` di router.tsx,
   * jadi tidak ada request ganda setelah hidrasi.
   */
  loader: ({ context }) =>
    context.queryClient.ensureQueryData({
      queryKey: qk.events.list({ limit: 50 }),
      queryFn: () => unwrap(apiClient.events.list({ limit: 50 })),
    }),

  component: EventsPage,
});


function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isPending, isError } = useQuery({
    queryKey: qk.events.list({ limit: 50 }),
    queryFn: () => unwrap(apiClient.events.list({ limit: 50 })),
  });

  // useQuery tidak punya callback error, jadi toast dipicu saat status berubah gagal
  // supaya kegagalan muat tidak lewat diam-diam seperti sebelum migrasi.
  useEffect(() => {
    if (!isError) return;
    toast({
      title: "Error",
      description: "Gagal mengambil data acara",
      variant: "destructive",
    });
  }, [isError, toast]);

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: RSVPStatus }) =>
      unwrap(apiClient.events.rsvp(eventId, status)),
    onSuccess: (_data, { status }) => {
      toast({
        title: "Berhasil",
        description: status === 'going' ? "Anda telah mendaftar untuk acara ini" :
                     status === 'maybe' ? "Status RSVP diperbarui ke 'Mungkin'" :
                     "Anda telah membatalkan kehadiran",
      });
      queryClient.invalidateQueries({ queryKey: qk.events.all() });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal melakukan RSVP",
        variant: "destructive",
      });
    },
  });

  const handleRSVP = (eventId: string, status: RSVPStatus) => {
    if (!user) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login untuk RSVP acara",
        variant: "destructive",
      });
      return;
    }
    rsvpMutation.mutate({ eventId, status });
  };

  const rsvpPendingId = rsvpMutation.isPending ? rsvpMutation.variables?.eventId : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'hybrid': return 'Hybrid';
      case 'zoom': return 'Zoom';
      case 'gmeet': return 'Google Meet';
      default: return mode;
    }
  };

  const getModeIcon = (mode: string) => {
    if (mode === 'offline') {
      return <MapPin className="h-4 w-4" />;
    }
    return <Video className="h-4 w-4" />;
  };

  const isEventPast = (endAt: string) => {
    return new Date(endAt) < new Date();
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat acara...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Acara Mendatang</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Temukan dan ikuti berbagai acara, webinar, dan kegiatan komunitas untuk penyandang disabilitas
            </p>
          </div>

          {events.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Acara</h3>
                <p className="text-gray-600">
                  Saat ini belum ada acara yang dijadwalkan. Silakan cek kembali nanti.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const isPast = isEventPast(event.end_at);
                return (
                  <Card key={event.id} className={isPast ? 'opacity-60' : ''}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                        <Badge variant={isPast ? 'secondary' : 'default'}>
                          {isPast ? 'Selesai' : getModeLabel(event.mode)}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.start_at)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatTime(event.start_at)} - {formatTime(event.end_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getModeIcon(event.mode)}
                        <span>
                          {event.location || (event.mode !== 'offline' ? 'Virtual Event' : 'Lokasi belum ditentukan')}
                        </span>
                      </div>

                      {event.capacity && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="h-4 w-4" />
                          <span>Kapasitas: {event.capacity} peserta</span>
                        </div>
                      )}

                      {event.join_url && !isPast && (
                        <a
                          href={event.join_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <Video className="h-4 w-4" />
                          Link Meeting
                        </a>
                      )}
                    </CardContent>
                    {!isPast && (
                      <CardFooter className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleRSVP(event.id, 'going')}
                          disabled={rsvpPendingId === event.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Hadir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRSVP(event.id, 'maybe')}
                          disabled={rsvpPendingId === event.id}
                        >
                          <HelpCircle className="h-4 w-4 mr-1" />
                          Mungkin
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRSVP(event.id, 'not_going')}
                          disabled={rsvpPendingId === event.id}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
