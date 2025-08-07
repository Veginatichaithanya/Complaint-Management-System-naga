import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Activity, Clock, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  email: string | null;
  full_name: string | null;
  role_type: string | null;
}

interface UserSession {
  id: string;
  user_id: string;
  login_time: string;
  last_activity: string;
  session_duration: number;
  is_active: boolean;
  profiles: UserProfile | null;
}

interface UserActivity {
  activity_type: string;
  activity_description: string | null;
  created_at: string;
}

export function RealTimeUserActivity() {
  const [activeSessions, setActiveSessions] = useState<UserSession[]>([]);
  const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveSessions();
    fetchRecentActivities();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchActiveSessions();
      fetchRecentActivities();
    }, 10000);

    // Set up real-time subscriptions
    const sessionChannel = supabase
      .channel('user-sessions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => {
        fetchActiveSessions();
      })
      .subscribe();

    const activityChannel = supabase
      .channel('activity-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_activity_log' }, () => {
        fetchRecentActivities();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(activityChannel);
    };
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select(`
          id,
          user_id,
          login_time,
          last_activity,
          session_duration,
          is_active,
          profiles (
            email,
            full_name,
            role_type
          )
        `)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;
      
      // Properly handle the profiles relationship - it should be a single object, not an array
      const sessionsData = (data || []).map(session => ({
        ...session,
        profiles: Array.isArray(session.profiles) 
          ? (session.profiles.length > 0 ? session.profiles[0] : null)
          : session.profiles
      })) as UserSession[];
      
      setActiveSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activity_log')
        .select('activity_type, activity_description, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActivities((data || []) as UserActivity[]);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const getStatusBadge = (lastActivity: string) => {
    const lastActivityTime = new Date(lastActivity).getTime();
    const now = Date.now();
    const diffMinutes = (now - lastActivityTime) / (1000 * 60);

    if (diffMinutes < 2) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">🟢 Active</Badge>;
    } else if (diffMinutes < 10) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">🟡 Idle</Badge>;
    } else {
      return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">⚫ Offline</Badge>;
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'support': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="bg-white/5 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-white/10 rounded w-1/3"></div>
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-16 bg-white/10 rounded"></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Active Users */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Active Users ({activeSessions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {activeSessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {session.profiles?.full_name?.charAt(0) || session.profiles?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {session.profiles?.full_name || session.profiles?.email || 'Anonymous User'}
                        </p>
                        <p className="text-white/60 text-sm">
                          Session: {formatDuration(session.session_duration)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getStatusBadge(session.last_activity)}
                    <Badge className={`${getRoleBadgeColor(session.profiles?.role_type)} text-xs`}>
                      {session.profiles?.role_type || 'employee'}
                    </Badge>
                  </div>
                </motion.div>
              ))}
              {activeSessions.length === 0 && (
                <div className="text-center py-8">
                  <Eye className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No active users at the moment</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-white/5 backdrop-blur-xl border-white/10 h-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivities.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg"
                >
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">
                      {activity.activity_description || activity.activity_type}
                    </p>
                    <p className="text-white/60 text-xs">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
              {recentActivities.length === 0 && (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
