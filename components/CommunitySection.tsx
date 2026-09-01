
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Calendar, ArrowRight, Flame, Clock } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { unwrap } from '@/lib/query/unwrap';
import { qk } from '@/lib/query/keys';
import type { ForumThread, Event } from '@/lib/api/client';

interface CommunitySectionProps {
  initialThreads?: ForumThread[];
  initialEvents?: Event[];
}

const CommunitySection = ({ initialThreads, initialEvents }: CommunitySectionProps = {}) => {
  // Dipisah jadi dua query: dulu satu `Promise.all` — forum gagal ikut mengosongkan
  // kolom event, padahal keduanya tak saling bergantung.
  const { data: forumTopics = [], isPending: threadsPending } = useQuery({
    queryKey: qk.forum.list({ limit: 4, scope: 'beranda' }),
    queryFn: async () => (await unwrap(apiClient.forum.listThreads())).slice(0, 4),
    initialData: initialThreads,
    staleTime: 30 * 60 * 1000,
  });

  const { data: upcomingEvents = [], isPending: eventsPending } = useQuery({
    queryKey: qk.events.list({ limit: 3, scope: 'beranda' }),
    queryFn: () => unwrap(apiClient.events.list({ limit: 3 })),
    initialData: initialEvents,
    staleTime: 30 * 60 * 1000,
  });

  const formatEventDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    });
  };

  const formatEventTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }) + ' WIB';
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return formatEventDate(dateString);
  };

  const parseTags = (tags?: string): string[] => {
    if (!tags) return [];
    return tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3);
  };

  const getEventTypeColor = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case 'online': return 'bg-emerald-100 text-emerald-700';
      case 'offline': return 'bg-amber-100 text-amber-700';
      case 'hybrid': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="animate-pulse p-5 rounded-xl bg-white border border-gray-100">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
      <div className="flex gap-2">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  );

  return (
    <section id="komunitas" className="py-20 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white to-rose-50/30" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium mb-4">
            Komunitas Aktif
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tumbuh Bersama
            <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent"> Komunitas</span>
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Diskusikan pengalaman, dapatkan dukungan, dan ikuti event bersama ribuan anggota komunitas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Forum Discussion */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-violet-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Diskusi Terbaru</h3>
              </div>
              <Link to="/forum" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {threadsPending ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : forumTopics.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-white border border-gray-100">
                  <MessageCircle className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm">Belum ada diskusi. Jadilah yang pertama!</p>
                </div>
              ) : (
                forumTopics.map((topic) => (
                  <Link key={topic.id} to="/forum/$id" params={{ id: topic.id }} className="block">
                    <div className="p-4 rounded-xl bg-white border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all duration-250 group">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 mb-2">
                        {topic.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          {/* Avatar circle */}
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-[9px] text-white font-bold">
                            {(topic.user?.full_name || topic.user?.email || 'P').charAt(0).toUpperCase()}
                          </div>
                          <span>{topic.user?.full_name || topic.user?.email || 'Pengguna'}</span>
                          <span className="text-gray-300">·</span>
                          <Clock className="w-3 h-3" />
                          <span suppressHydrationWarning>{getRelativeTime(topic.created_at)}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {parseTags(topic.tags).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-gray-100 text-[10px] text-gray-800 font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <Link to="/forum" className="block mt-4">
              <Button className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-md shadow-violet-500/20">
                <Flame className="w-4 h-4 mr-2" />
                Mulai Diskusi Baru
              </Button>
            </Link>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Event Mendatang</h3>
              </div>
              <Link to="/acara" className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                Semua <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {eventsPending ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-white border border-gray-100">
                  <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-gray-600 text-sm">Belum ada event mendatang.</p>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <Link key={event.id} to="/acara/$id" params={{ id: event.id }} className="block">
                    <div className="p-4 rounded-xl bg-white border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-250 group">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors line-clamp-1 flex-1">
                          {event.title}
                        </h4>
                        <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getEventTypeColor(event.mode)}`}>
                          {event.mode || 'Online'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {formatEventDate(event.start_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {formatEventTime(event.start_at)}
                        </span>
                        {event.capacity && (
                          <span className="flex items-center gap-1.5 ml-auto">
                            <Users className="w-3 h-3" />
                            {event.capacity} peserta
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Event CTA */}
            <div className="mt-4 p-5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">Ingin Mengadakan Event?</h4>
                  <p className="text-gray-500 text-xs mb-3">Bagikan keahlian Anda melalui workshop atau webinar untuk komunitas.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-amber-300 text-amber-700 hover:bg-amber-100 text-xs h-8"
                  >
                    Ajukan Event
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunitySection;
