
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'complaint_created' | 'status_updated' | 'assignment_made' | 'response_received' | 'info' | 'success' | 'warning' | 'error' | 'new_complaint' | 'user_registered' | 'user_deactivated' | 'system_alert';
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
  user_id?: string;
}

export interface AdminNotificationStats {
  unread_count: number;
  total_count: number;
  critical_count: number;
}

export function useAdminRealTimeNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [stats, setStats] = useState<AdminNotificationStats>({ 
    unread_count: 0, 
    total_count: 0, 
    critical_count: 0 
  });
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Check if user is admin
  const checkAdminStatus = useCallback(async () => {
    if (!user?.id) return false;
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      return data?.some(role => ['admin', 'agent'].includes(role.role)) || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }, [user?.id]);

  // Fetch notifications for admin users
  const fetchNotifications = useCallback(async () => {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) {
      setLoading(false);
      return;
    }

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
          .in('type', ['complaint_created', 'status_updated', 'assignment_made', 'meeting_scheduled'])
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
          metadata: (notif.metadata as any) || {},
          user_id: notif.user_id
        })),
        ...(userNotifs.data || []).map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          type: notif.type as AdminNotification['type'],
          read: notif.read,
          created_at: notif.created_at,
          metadata: (notif.metadata as any) || {},
          user_id: notif.user_id
        }))
      ];

      // Sort by creation date and limit to 50
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
    } finally {
      setLoading(false);
    }
  }, [checkAdminStatus]);

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
    let adminChannel: any;
    let notificationsChannel: any;

    const setupRealTime = async () => {
      const isAdmin = await checkAdminStatus();
      if (!isAdmin) return;

      // Initial fetch
      await fetchNotifications();

      // Subscribe to admin_notifications changes
      adminChannel = supabase
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
              metadata: newNotification.metadata || {},
              user_id: newNotification.user_id
            };

            setNotifications(prev => [formattedNotification, ...prev.slice(0, 49)]);
            setStats(prev => ({
              unread_count: prev.unread_count + 1,
              total_count: prev.total_count + 1,
              critical_count: formattedNotification.type === 'complaint_created' ? 
                prev.critical_count + 1 : prev.critical_count
            }));

            // Show toast notification
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: 6000,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'admin_notifications',
          },
          (payload) => {
            console.log('📝 Admin notification updated:', payload);
            const updatedNotification = payload.new as any;
            
            setNotifications(prev =>
              prev.map(n => n.id === updatedNotification.id ? {
                ...n,
                read: updatedNotification.read
              } : n)
            );
          }
        )
        .subscribe((status) => {
          console.log('Admin notifications channel status:', status);
          setIsConnected(status === 'SUBSCRIBED');
        });

      // Subscribe to notifications changes (for status updates etc)
      notificationsChannel = supabase
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
            if (['complaint_created', 'status_updated', 'assignment_made', 'meeting_scheduled'].includes(newNotification.type)) {
              console.log('🔔 New user notification for admin:', payload);
              
              const formattedNotification: AdminNotification = {
                id: newNotification.id,
                title: newNotification.title,
                message: newNotification.message,
                type: newNotification.type,
                read: false, // New notifications are unread by default for admin
                created_at: newNotification.created_at,
                metadata: newNotification.metadata || {},
                user_id: newNotification.user_id
              };

              setNotifications(prev => [formattedNotification, ...prev.slice(0, 49)]);
              setStats(prev => ({
                unread_count: prev.unread_count + 1,
                total_count: prev.total_count + 1,
                critical_count: newNotification.type === 'complaint_created' ? 
                  prev.critical_count + 1 : prev.critical_count
              }));

              // Show toast for critical notifications
              if (newNotification.type === 'complaint_created') {
                toast.info(newNotification.title, {
                  description: newNotification.message,
                  duration: 6000,
                });
              }
            }
          }
        )
        .subscribe();
    };

    if (user?.id) {
      setupRealTime();
    }

    return () => {
      if (adminChannel) supabase.removeChannel(adminChannel);
      if (notificationsChannel) supabase.removeChannel(notificationsChannel);
      setIsConnected(false);
    };
  }, [user?.id, checkAdminStatus, fetchNotifications]);

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
