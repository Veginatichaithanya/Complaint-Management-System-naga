
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface RealTimeNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata: any;
  user_id?: string;
  complaint_id?: string;
  ticket_id?: string;
}

export interface NotificationStats {
  unread: number;
  read: number;
  total: number;
}

export function useRealTimeNotificationSync() {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ unread: 0, read: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Fetch initial notifications and stats
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔄 Fetching real-time notifications for user:', user.id);

      // Fetch user notifications
      const { data: userNotifications, error: userError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (userError) {
        console.error('❌ Error fetching user notifications:', userError);
        return;
      }

      // Check if user is admin/agent for admin notifications
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      const isAdmin = userRoles?.some(role => ['admin', 'agent'].includes(role.role));

      let adminNotifications: any[] = [];
      if (isAdmin) {
        const { data: adminNotifs, error: adminError } = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);

        if (!adminError && adminNotifs) {
          adminNotifications = adminNotifs.map(notif => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            type: notif.notification_type,
            read: notif.read,
            created_at: notif.created_at,
            metadata: notif.metadata,
            user_id: notif.user_id
          }));
        }
      }

      // Combine and sort notifications
      const allNotifications = [
        ...(userNotifications || []),
        ...adminNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);

      // Calculate stats
      const unreadCount = allNotifications.filter(n => !n.read).length;
      const readCount = allNotifications.filter(n => n.read).length;
      
      setStats({
        unread: unreadCount,
        read: readCount,
        total: allNotifications.length
      });

      console.log('✅ Notifications loaded:', {
        total: allNotifications.length,
        unread: unreadCount,
        read: readCount
      });

    } catch (error) {
      console.error('❌ Error in fetchNotifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      // Update user notifications
      const { error: userError } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('user_id', user?.id);

      // Update admin notifications
      const { error: adminError } = await supabase
        .from('admin_notifications')
        .update({ read: true })
        .in('id', notificationIds);

      if (userError && adminError) {
        throw new Error('Failed to update notifications');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notificationIds.includes(notification.id)
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update stats
      const markedCount = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.read
      ).length;

      setStats(prev => ({
        unread: Math.max(0, prev.unread - markedCount),
        read: prev.read + markedCount,
        total: prev.total
      }));

      toast.success('Notifications marked as read');
    } catch (error) {
      console.error('❌ Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await markAsRead(unreadIds);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔗 Setting up real-time notification subscriptions for user:', user.id);

    // Subscribe to user notifications
    const userChannel = supabase
      .channel('user-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 New user notification received:', payload);
          const newNotification = payload.new as RealTimeNotification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setStats(prev => ({
            unread: prev.unread + 1,
            read: prev.read,
            total: prev.total + 1
          }));
          
          // Show toast notification
          toast.info(newNotification.title, {
            description: newNotification.message,
            duration: 5000,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📝 Notification updated:', payload);
          const updatedNotification = payload.new as RealTimeNotification;
          
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Update stats if read status changed
          const oldNotification = notifications.find(n => n.id === updatedNotification.id);
          if (oldNotification && !oldNotification.read && updatedNotification.read) {
            setStats(prev => ({
              unread: Math.max(0, prev.unread - 1),
              read: prev.read + 1,
              total: prev.total
            }));
          }
        }
      )
      .subscribe((status) => {
        console.log('User notifications channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to admin notifications (if admin/agent)
    const adminChannel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        async (payload) => {
          console.log('🔔 New admin notification received:', payload);
          
          // Check if user is admin/agent
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          const isAdmin = userRoles?.some(role => ['admin', 'agent'].includes(role.role));
          
          if (isAdmin) {
            const newNotification = {
              id: payload.new.id,
              title: payload.new.title,
              message: payload.new.message,
              type: payload.new.notification_type,
              read: payload.new.read,
              created_at: payload.new.created_at,
              metadata: payload.new.metadata,
              user_id: payload.new.user_id
            } as RealTimeNotification;
            
            setNotifications(prev => [newNotification, ...prev]);
            setStats(prev => ({
              unread: prev.unread + 1,
              read: prev.read,
              total: prev.total + 1
            }));
            
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: 5000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          console.log('📝 Admin notification updated:', payload);
          const updatedNotification = {
            id: payload.new.id,
            title: payload.new.title,
            message: payload.new.message,
            type: payload.new.notification_type,
            read: payload.new.read,
            created_at: payload.new.created_at,
            metadata: payload.new.metadata,
            user_id: payload.new.user_id
          } as RealTimeNotification;
          
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
        }
      )
      .subscribe();

    // Initial fetch
    fetchNotifications();

    return () => {
      console.log('🧹 Cleaning up notification subscriptions');
      supabase.removeChannel(userChannel);
      supabase.removeChannel(adminChannel);
      setIsConnected(false);
    };
  }, [user?.id, fetchNotifications]);

  return {
    notifications,
    stats,
    loading,
    isConnected,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
