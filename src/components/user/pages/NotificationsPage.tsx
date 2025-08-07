
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Clock, Video, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export function NotificationsPage() {
  const { notifications, stats, loading, markAsRead, markAllAsRead } = useNotifications();

  const handleMarkAsRead = (id: string) => {
    markAsRead([id]);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting_scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting_scheduled': return <Video className="w-4 h-4" />;
      case 'success': return <Check className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const handleMeetingAction = (notification: any) => {
    const metadata = notification.metadata || {};
    if (metadata.meet_link) {
      window.open(metadata.meet_link, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/90 backdrop-blur-xl border-border/50">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-white/90 backdrop-blur-xl border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                Notifications
                {stats.unread_count > 0 && (
                  <Badge className="bg-red-500 text-white">
                    {stats.unread_count}
                  </Badge>
                )}
              </CardTitle>
              {stats.unread_count > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-2" />
                  Mark All Read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No notifications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(notification.type)}
                            <h3 className={`font-medium ${
                              notification.read ? 'text-gray-700' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h3>
                          </div>
                          <Badge className={getTypeColor(notification.type)}>
                            {notification.type === 'meeting_scheduled' ? 'Meeting' : notification.type}
                          </Badge>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-sm mb-2 ${
                          notification.read ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        
                        {/* Meeting-specific actions */}
                        {notification.type === 'meeting_scheduled' && notification.metadata?.meet_link && (
                          <div className="flex items-center gap-2 mt-3">
                            <Button 
                              size="sm" 
                              onClick={() => handleMeetingAction(notification)}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Video className="w-3 h-3 mr-1" />
                              Join Meeting
                            </Button>
                            {notification.metadata?.schedule_time && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(notification.metadata.schedule_time).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-2">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
