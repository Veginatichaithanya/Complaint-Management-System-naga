import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'complaint_created' | 'status_updated' | 'assignment_made' | 'response_received' | 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
  metadata: {
    complaint_id?: string;
    ticket_id?: string;
    priority?: string;
    category?: string;
    employee_id?: string;
    [key: string]: any;
  };
}

export interface NotificationStats {
  unread_count: number;
  total_count: number;
  critical_count: number;
}

export function useRealTimeNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({ 
    unread_count: 0, 
    total_count: 0, 
    critical_count: 0 
  });
  const [loading, setLoading] = useState(true);

  // Fetch notifications for admin users
  const fetchNotifications = async () => {
    try {
      console.log('🔔 Fetching admin notifications...');

      // Get notifications from both admin_notifications and notifications tables
      const [adminNotifs, userNotifs] = await Promise.all([
        supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25),
        supabase
          .from('notifications')
          .select('*')
          .in('type', ['complaint_created', 'status_updated', 'assignment_made'])
          .order('created_at', { ascending: false })
          .limit(25)
      ]);

      // Combine and format notifications
      const combinedNotifications: AdminNotification[] = [
        ...(adminNotifs.data || []).map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.notification_type as AdminNotification['type'],
          read: notif.read,
          created_at: notif.created_at,
          metadata: (notif.metadata as any) || {}
        })),
        ...(userNotifs.data || []).map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type as AdminNotification['type'],
          read: notif.read,
          created_at: notif.created_at,
          metadata: (notif.metadata as any) || {}
        }))
      ];

      // Sort by creation date
      combinedNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(combinedNotifications.slice(0, 50));

      // Calculate stats
      const unreadCount = combinedNotifications.filter(n => !n.read).length;
      const criticalCount = combinedNotifications.filter(n => 
        !n.read && (n.type === 'complaint_created' || n.metadata.priority === 'urgent')
      ).length;

      setStats({
        unread_count: unreadCount,
        total_count: combinedNotifications.length,
        critical_count: criticalCount
      });

      console.log('✅ Admin notifications loaded:', combinedNotifications.length);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    }
  };

  // Mark notifications as read
  const markAsRead = async (notificationIds: string[]) => {
    try {
      // Update admin_notifications
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .in('id', notificationIds);

      // Update notifications
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notificationIds);

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, read: true }
            : notification
        )
      );

      // Update stats
      setStats(prev => ({
        ...prev,
        unread_count: Math.max(0, prev.unread_count - notificationIds.length),
        critical_count: Math.max(0, prev.critical_count - notificationIds.filter(id => {
          const notif = notifications.find(n => n.id === id);
          return notif && !notif.read && (notif.type === 'complaint_created' || notif.metadata.priority === 'urgent');
        }).length)
      }));

    } catch (error) {
      console.error('❌ Error marking notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      await markAsRead(unreadIds);
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    const initializeNotifications = async () => {
      await fetchNotifications();
      setLoading(false);
    };

    initializeNotifications();

    // Subscribe to admin_notifications changes
    const adminChannel = supabase
      .channel('admin-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications',
        },
        (payload) => {
          console.log('🔔 New admin notification:', payload);
          const newNotification = payload.new as any;
          
          const formattedNotification: AdminNotification = {
            id: newNotification.id,
            title: newNotification.title,
            message: newNotification.message,
            type: newNotification.notification_type,
            read: newNotification.read,
            created_at: newNotification.created_at,
            metadata: newNotification.metadata || {}
          };

          setNotifications(prev => [formattedNotification, ...prev.slice(0, 49)]);
          setStats(prev => ({
            unread_count: prev.unread_count + 1,
            total_count: prev.total_count + 1,
            critical_count: formattedNotification.type === 'complaint_created' ? 
              prev.critical_count + 1 : prev.critical_count
          }));

          // Show toast
          toast.info(newNotification.title, {
            description: newNotification.message,
            duration: 6000,
          });
        }
      )
      .subscribe();

    // Subscribe to notifications changes (for status updates etc)
    const notificationsChannel = supabase
      .channel('notifications-admin-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // Only show admin-relevant notifications
          if (['complaint_created', 'status_updated', 'assignment_made'].includes(newNotification.type)) {
            console.log('🔔 New user notification for admin:', payload);
            
            const formattedNotification: AdminNotification = {
              id: newNotification.id,
              title: newNotification.title,
              message: newNotification.message,
              type: newNotification.type,
              read: false, // New notifications are unread by default for admin
              created_at: newNotification.created_at,
              metadata: newNotification.metadata || {}
            };

            setNotifications(prev => [formattedNotification, ...prev.slice(0, 49)]);
            setStats(prev => ({
              unread_count: prev.unread_count + 1,
              total_count: prev.total_count + 1,
              critical_count: newNotification.type === 'complaint_created' ? 
                prev.critical_count + 1 : prev.critical_count
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(adminChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, []);

  return {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications
  };
}