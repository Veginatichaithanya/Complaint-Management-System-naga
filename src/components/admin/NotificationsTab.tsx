
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertCircle, Info, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsTab() {
  const { notifications, stats, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'complaint_created':
        return <Badge className="bg-blue-100 text-blue-800">New Complaint</Badge>;
      case 'status_updated':
        return <Badge className="bg-green-100 text-green-800">Status Update</Badge>;
      case 'assignment_made':
        return <Badge className="bg-purple-100 text-purple-800">Assignment</Badge>;
      case 'response_received':
        return <Badge className="bg-orange-100 text-orange-800">Response</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Bell className="w-8 h-8 mr-3 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">Real-Time Notifications</h1>
              <p className="text-muted-foreground mt-1">
                {stats.unread_count} unread of {stats.total_count} total
              </p>
            </div>
          </div>
          {stats.unread_count > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{stats.unread_count}</div>
                  <div className="text-sm text-muted-foreground">Unread</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {stats.total_count - stats.unread_count}
                  </div>
                  <div className="text-sm text-muted-foreground">Read</div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.total_count}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                        notification.read 
                          ? 'bg-background border-border' 
                          : 'bg-primary/5 border-primary/20'
                      }`}
                    >
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-foreground font-medium">
                              {notification.title}
                            </h3>
                            <p className="text-muted-foreground text-sm mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            {getNotificationBadge(notification.type)}
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead([notification.id])}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
