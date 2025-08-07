import { formatDistanceToNow } from 'date-fns';
import { Check, CheckCheck, Trash2, MessageSquare, Ticket, AlertCircle, Info, CheckCircle, AlertTriangle, X, Bell } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { ScrollArea } from './scroll-area';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { Notification } from '@/hooks/useNotifications';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkAsRead: (ids: string[]) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'complaint_created':
      return <AlertCircle className="h-4 w-4 text-blue-500" />;
    case 'status_updated':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'assignment_made':
      return <Ticket className="h-4 w-4 text-purple-500" />;
    case 'response_received':
      return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
};

const getNotificationBadgeVariant = (type: string) => {
  switch (type) {
    case 'complaint_created':
      return 'default';
    case 'status_updated':
      return 'secondary';
    case 'assignment_made':
      return 'outline';
    case 'response_received':
      return 'default';
    case 'success':
      return 'default';
    case 'warning':
      return 'secondary';
    case 'error':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export function NotificationPanel({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onClose,
  className 
}: NotificationPanelProps) {
  const unreadNotifications = notifications.filter(n => !n.read);
  const hasUnread = unreadNotifications.length > 0;

  return (
    <Card className={cn("w-96 max-w-full shadow-lg border", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="max-h-96">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors cursor-pointer hover:bg-accent/50",
                  !notification.read && "bg-accent/20 border-accent"
                )}
                onClick={() => !notification.read && onMarkAsRead([notification.id])}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm leading-tight">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 leading-tight">
                          {notification.message}
                        </p>
                      </div>
                      
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                        {notification.type.replace('_', ' ')}
                      </Badge>
                      
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {hasUnread && (
        <div className="p-3 border-t bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </Card>
  );
}