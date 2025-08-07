import { useState } from 'react';
import { NotificationBell } from './notification-bell';
import { NotificationPanel } from './notification-panel';
import { useNotifications } from '@/hooks/useNotifications';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, stats, markAsRead, markAllAsRead } = useNotifications();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={className}>
          <NotificationBell
            unreadCount={stats.unread_count}
            onClick={() => setIsOpen(!isOpen)}
          />
        </div>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 bg-background border shadow-lg" 
        align="end"
        sideOffset={8}
      >
        <NotificationPanel
          notifications={notifications}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onClose={() => setIsOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}