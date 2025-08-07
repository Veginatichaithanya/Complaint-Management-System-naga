
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing } from 'lucide-react';
import { useRealTimeNotificationFlow } from '@/hooks/useRealTimeNotificationFlow';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function RealTimeNotificationPanel() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead 
  } = useRealTimeNotificationFlow();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="w-4 h-4" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-red-500 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center space-x-2">
              <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
                {isConnected ? 'Live' : 'Offline'}
              </Badge>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No notifications yet
            </div>
          ) : (
            <div className="space-y-1">
              {recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 5 && (
          <div className="p-3 border-t text-center">
            <Button variant="ghost" size="sm" className="text-xs">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
