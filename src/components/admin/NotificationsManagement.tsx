import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MoreVertical, Check, Bell, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function NotificationsManagement() {
  const { notifications, stats, markAsRead, markAllAsRead, loading } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const getNotificationIcon = (type: string) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'complaint_created':
        return <Bell className={`${iconClass} text-blue-500`} />;
      case 'status_updated':
        return <Bell className={`${iconClass} text-green-500`} />;
      case 'assignment_made':
        return <Bell className={`${iconClass} text-purple-500`} />;
      case 'response_received':
        return <Bell className={`${iconClass} text-orange-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'complaint_created':
        return 'bg-blue-100 text-blue-800';
      case 'status_updated':
        return 'bg-green-100 text-green-800';
      case 'assignment_made':
        return 'bg-purple-100 text-purple-800';
      case 'response_received':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesRead = filterRead === 'all' || 
                       (filterRead === 'read' && notification.read) ||
                       (filterRead === 'unread' && !notification.read);
    
    return matchesSearch && matchesType && matchesRead;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 bg-white/5 backdrop-blur border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Total Notifications</p>
                <p className="text-2xl font-bold text-white">{stats.total_count}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-white/5 backdrop-blur border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Bell className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Unread</p>
                <p className="text-2xl font-bold text-white">{stats.unread_count}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-white/5 backdrop-blur border-white/10">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Read</p>
                <p className="text-2xl font-bold text-white">{stats.total_count - stats.unread_count}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6 bg-white/5 backdrop-blur border-white/10">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="complaint_created">Complaint Created</SelectItem>
                  <SelectItem value="status_updated">Status Updated</SelectItem>
                  <SelectItem value="assignment_made">Assignment Made</SelectItem>
                  <SelectItem value="response_received">Response Received</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-[120px] bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter read" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {stats.unread_count > 0 && (
              <Button
                onClick={markAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Notifications List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        {filteredNotifications.length === 0 ? (
          <Card className="p-12 bg-white/5 backdrop-blur border-white/10 text-center">
            <Bell className="w-12 h-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No notifications found</h3>
            <p className="text-white/60">
              {searchQuery || filterType !== 'all' || filterRead !== 'all'
                ? 'Try adjusting your filters'
                : 'Notifications will appear here when they are created'}
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-6 bg-white/5 backdrop-blur border-white/10 transition-all hover:bg-white/10 ${
                !notification.read ? 'border-blue-500/30 bg-blue-500/5' : ''
              }`}>
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">{notification.title}</h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-white/50">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!notification.read && (
                            <DropdownMenuItem onClick={() => markAsRead([notification.id])}>
                              <Check className="w-4 h-4 mr-2" />
                              Mark as read
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}