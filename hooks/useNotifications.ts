import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/lib/api';
import { useCentrifugoContext } from '@/hooks/CentrifugoProvider';
import { useAuth } from '@/hooks/useAuth';
import type { Notification, NotificationStats, NotificationListParams } from '@/lib/api/types';

interface NotificationState {
  notifications: Notification[];
  stats: NotificationStats | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export const useNotifications = (autoFetch: boolean = true) => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    stats: null,
    unreadCount: 0,
    isLoading: false,
    error: null,
  });

  const centrifugo = useCentrifugoContext();
  const { user } = useAuth();

  const fetchNotifications = useCallback(async (params?: NotificationListParams) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await notificationService.listNotifications(params);
      const errorMessage = response.error;
      if (errorMessage) {
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return { error: errorMessage };
      }
      setState(prev => ({
        ...prev,
        isLoading: false,
        notifications: (response.data || []) as Notification[]
      }));
      return response;
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false, error: error.message }));
      return { error: error.message };
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const response = await notificationService.getStats();
      if (response.data && !response.error) {
        setState(prev => ({
          ...prev,
          stats: response.data as NotificationStats,
          unreadCount: (response.data as NotificationStats).unread_count
        }));
      }
      return response;
    } catch (error: any) {
      return { error: error.message };
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.data && !response.error) {
        setState(prev => ({
          ...prev,
          unreadCount: (response.data as { unread_count: number }).unread_count
        }));
      }
      return response;
    } catch (error: any) {
      return { error: error.message };
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const response = await notificationService.markAsRead(id);
      if (!response.error) {
        // Update local state
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n =>
            n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n
          ),
          unreadCount: Math.max(0, prev.unreadCount - 1)
        }));
      }
      return response;
    } catch (error: any) {
      return { error: error.message };
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationService.markAllAsRead();
      if (!response.error) {
        // Update local state
        const now = new Date().toISOString();
        setState(prev => ({
          ...prev,
          notifications: prev.notifications.map(n => ({ ...n, read: true, read_at: now })),
          unreadCount: 0
        }));
      }
      return response;
    } catch (error: any) {
      return { error: error.message };
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await notificationService.deleteNotification(id);
      if (!response.error) {
        setState(prev => {
          const notification = prev.notifications.find(n => n.id === id);
          const wasUnread = notification && !notification.read;
          return {
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount
          };
        });
      }
      return response;
    } catch (error: any) {
      return { error: error.message };
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [autoFetch, fetchNotifications, fetchUnreadCount]);

  // Real-time subscription via Centrifugo
  useEffect(() => {
    if (!centrifugo || !user) return;

    const channel = `personal:#${user.id}`;
    const sub = centrifugo.subscribe(channel, (ctx) => {
      const data = ctx.data as { type?: string; payload?: any };
      if (data?.type === 'notification' && data?.payload) {
        const notif = data.payload as Notification;
        setState(prev => ({
          ...prev,
          notifications: [notif, ...prev.notifications],
          unreadCount: prev.unreadCount + 1,
        }));
      }
    });

    return () => {
      if (sub) {
        sub.removeAllListeners();
        sub.unsubscribe();
      }
    };
  }, [centrifugo, user]);

  return {
    ...state,
    fetchNotifications,
    fetchStats,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
  };
};
