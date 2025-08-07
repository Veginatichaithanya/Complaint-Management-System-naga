
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface NotificationFlow {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  metadata: any;
  user_id?: string;
  complaint_id?: string;
}

export function useRealTimeNotificationFlow() {
  const [notifications, setNotifications] = useState<NotificationFlow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      console.log('🔔 Fetching notifications for user:', user.id);

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

      // Check if user is admin to fetch admin notifications
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

      // Combine notifications
      const allNotifications = [
        ...(userNotifications || []),
        ...adminNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);

      console.log('✅ Loaded notifications:', allNotifications.length);
    } catch (error) {
      console.error('❌ Error in fetchNotifications:', error);
    }
  }, [user?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 Setting up real-time notification subscriptions for user:', user.id);

    // Subscribe to user notifications
    const userChannel = supabase
      .channel('user-notifications-flow')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🚨 New user notification:', payload);
          const newNotification = payload.new as NotificationFlow;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
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
          const updatedNotification = payload.new as NotificationFlow;
          
          setNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          if (updatedNotification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe((status) => {
        console.log('User notifications channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to admin notifications (if admin)
    const adminChannel = supabase
      .channel('admin-notifications-flow')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        async (payload) => {
          console.log('🚨 New admin notification:', payload);
          
          // Check if user is admin
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
            } as NotificationFlow;
            
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: 5000,
            });
          }
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

  // Mark single notification as read (fix parameter type)
  const markAsRead = async (notificationId: string) => {
    try {
      // Update user notifications
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      // Update admin notifications
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotificationIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);

      if (unreadNotificationIds.length === 0) return;

      // Update user notifications
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadNotificationIds)
        .eq('user_id', user?.id);

      // Update admin notifications
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .in('id', unreadNotificationIds);

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}
