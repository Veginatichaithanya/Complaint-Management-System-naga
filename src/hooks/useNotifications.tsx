import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'complaint_created' | 'status_updated' | 'assignment_made' | 'response_received' | 'info' | 'success' | 'warning' | 'error' | 'meeting_scheduled';
  read: boolean;
  complaint_id?: string;
  ticket_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  unread_count: number;
  total_count: number;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ unread_count: 0, total_count: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data as Notification[]) || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  // Fetch notification stats
  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_user_notification_stats', { target_user_id: user.id });

      if (error) throw error;
      setStats(data ? (data as unknown as NotificationStats) : { unread_count: 0, total_count: 0 });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .rpc('mark_notifications_read', { notification_ids: notificationIds });

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update stats
      await fetchStats();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (error) throw error;

      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );

      // Update stats
      setStats(prev => ({ ...prev, unread_count: 0 }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Handle real-time notifications
  useEffect(() => {
    if (!user) return;

    let channel: any;

    const setupRealtimeSubscription = async () => {
      try {
        // Initial load
        await fetchNotifications();
        await fetchStats();
        setLoading(false);

        // Set up real-time subscription
        channel = supabase
          .channel('notifications-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const newNotification = payload.new as Notification;
              
              // Add to notifications list
              setNotifications(prev => [newNotification, ...prev]);
              
              // Update stats
              setStats(prev => ({
                unread_count: prev.unread_count + 1,
                total_count: prev.total_count + 1
              }));

              // Show toast notification
              const toastType = newNotification.type === 'success' ? 'success' : 
                               newNotification.type === 'error' ? 'error' : 
                               newNotification.type === 'warning' ? 'warning' : 'info';
              
              toast[toastType](newNotification.title, {
                description: newNotification.message,
              });
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              const updatedNotification = payload.new as Notification;
              
              setNotifications(prev => 
                prev.map(notification => 
                  notification.id === updatedNotification.id 
                    ? updatedNotification 
                    : notification
                )
              );
            }
          )
          .subscribe();
      } catch (error) {
        console.error('Error setting up notifications:', error);
        setLoading(false);
      }
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user]);

  return {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: () => {
      fetchNotifications();
      fetchStats();
    }
  };
}
