
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, AlertCircle, Info, CheckCircle, AlertTriangle, User, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminRealTimeNotifications } from '@/hooks/useAdminRealTimeNotifications';
import { formatDistanceToNow } from 'date-fns';

export function RealTimeNotificationsTab() {
  const { 
    notifications, 
    stats, 
    loading, 
    isConnected, 
    markAsRead, 
    markAllAsRead 
  } = useAdminRealTimeNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'complaint_created':
      case 'new_complaint':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'status_updated':
        return <Info className="w-5 h-5 text-green-500" />;
      case 'assignment_made':
        return <Bell className="w-5 h-5 text-purple-500" />;
      case 'response_received':
        return <Bell className="w-5 h-5 text-orange-500" />;
      case 'meeting_scheduled':
        return <Calendar className="w-5 h-5 text-indigo-500" />;
      case 'user_registered':
        return <User className="w-5 h-5 text-green-500" />;
      case 'user_deactivated':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'system_alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'complaint_created':
      case 'new_complaint':
        return <Badge className="bg-blue-100 text-blue-800">New Complaint</Badge>;
      case 'status_updated':
        return <Badge className="bg-green-100 text-green-800">Status Update</Badge>;
      case 'assignment_made':
        return <Badge className="bg-purple-100 text-purple-800">Assignment</Badge>;
      case 'response_received':
        return <Badge className="bg-orange-100 text-orange-800">Response</Badge>;
      case 'meeting_scheduled':
        return <Badge className="bg-indigo-100 text-indigo-800">Meeting</Badge>;
      case 'user_registered':
        return <Badge className="bg-green-100 text-green-800">New User</Badge>;
      case 'user_deactivated':
        return <Badge className="bg-yellow-100 text-yellow-800">User Update</Badge>;
      case 'system_alert':
        return <Badge className="bg-red-100 text-red-800">System Alert</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg"></div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
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
            <div className="flex items-center mt-1">
              <p className="text-muted-foreground mr-3">
                {stats.unread_count} unread of {stats.total_count} total
              </p>
              <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                {isConnected ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </>
                ) : (
                  'Disconnected'
                )}
              </Badge>
            </div>
          </div>
        </div>
        {stats.unread_count > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="w-4 h-4 mr-2" />
            Mark All Read ({stats.unread_count})
          </Button>
        )}
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <div className="text-3xl font-bold text-orange-600">{stats.critical_count}</div>
                <div className="text-sm text-muted-foreground">Critical</div>
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
              {isConnected && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2 animate-pulse"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No notifications found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-start space-x-4 p-4 rounded-lg border transition-all hover:bg-accent/50 ${
                        notification.read 
                          ? 'bg-background border-border' 
                          : 'bg-primary/5 border-primary/20 shadow-sm'
                      }`}
                    >
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-foreground font-medium">
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                              )}
                            </div>
                            <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              {getNotificationBadge(notification.type)}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead([notification.id])}
                              className="ml-2"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
