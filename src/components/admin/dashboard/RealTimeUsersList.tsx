
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, Clock, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRealTimeUsers } from '@/hooks/useRealTimeUsers';
import { RealTimeUserStats } from './RealTimeUserStats';
import { formatDistanceToNow } from 'date-fns';

export function RealTimeUsersList() {
  const { activeUsers, allUsers, loading } = useRealTimeUsers();

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-time User Stats */}
      <RealTimeUserStats />

      {/* Active Users List */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center text-foreground">
            <Users className="w-5 h-5 mr-2" />
            Live Active Users ({activeUsers.length})
            <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {activeUsers.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {session.user_name?.charAt(0) || session.user_email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-foreground font-medium">
                        {session.user_name || session.user_email || 'Anonymous User'}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        Online for {formatDistanceToNow(new Date(session.login_time))}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {session.user_role || 'employee'}
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30">
                      <Wifi className="w-3 h-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {activeUsers.length === 0 && (
              <div className="text-center py-8">
                <WifiOff className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No active users at the moment</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Users with Status */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">All Users Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allUsers.slice(0, 10).map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                      <span className="text-white text-xs">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    {user.is_online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-background rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {user.is_online 
                        ? 'Online now' 
                        : `Last seen ${formatDistanceToNow(new Date(user.last_seen || user.created_at))} ago`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {user.is_online ? (
                    <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                      Online
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Offline
                    </Badge>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
