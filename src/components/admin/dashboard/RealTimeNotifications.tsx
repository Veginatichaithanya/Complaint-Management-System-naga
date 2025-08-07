
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, User, MessageSquare, Calendar, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminRealTimeNotifications } from '@/hooks/useAdminRealTimeNotifications';

export function RealTimeNotifications() {
  const { notifications, stats, loading, isConnected, markAsRead, markAllAsRead } = useAdminRealTimeNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_complaint':
      case 'complaint_created':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'user_registered':
        return <User className="w-5 h-5 text-green-500" />;
      case 'user_deactivated':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'system_alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'meeting_scheduled':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'new_complaint':
      case 'complaint_created':
        return 'bg-blue-50 border-blue-200';
      case 'user_registered':
        return 'bg-green-50 border-green-200';
      case 'user_deactivated':
        return 'bg-yellow-50 border-yellow-200';
      case 'system_alert':
        return 'bg-red-50 border-red-200';
      case 'meeting_scheduled':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Real-Time Notifications
              {stats.unread_count > 0 && (
                <Badge className="ml-2 bg-red-500/20 text-red-700 border-red-500/30">
                  {stats.unread_count}
                </Badge>
              )}
              {isConnected && (
                <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            {stats.unread_count > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Mark all as read
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {notifications.slice(0, 10).map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200
                  }}
                  className={`p-4 rounded-lg border ${getNotificationBgColor(notification.type)} ${
                    !notification.read ? 'ring-2 ring-blue-500/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-foreground font-medium text-sm">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-2">
                          {notification.message}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <Button
                        onClick={() => markAsRead([notification.id])}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground p-1 h-auto"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {notifications.length === 0 && (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
