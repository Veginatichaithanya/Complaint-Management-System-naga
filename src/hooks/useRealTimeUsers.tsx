
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserSession {
  id: string;
  user_id: string;
  login_time: string;
  last_activity: string;
  is_active: boolean;
  user_email?: string;
  user_name?: string;
  user_role?: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_type: string;
  account_status: string;
  created_at: string;
  last_seen?: string;
  is_online?: boolean;
  complaint_count?: number;
}

export function useRealTimeUsers() {
  const [activeUsers, setActiveUsers] = useState<UserSession[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    new_today: 0,
    online: 0,
  });

  useEffect(() => {
    fetchUsersWithStatus();
    
    // Set up real-time subscriptions
    const sessionsChannel = supabase
      .channel('user-sessions-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_sessions' 
      }, (payload) => {
        console.log('Session update:', payload);
        fetchUsersWithStatus();
      })
      .subscribe();

    const profilesChannel = supabase
      .channel('profiles-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        console.log('Profile update:', payload);
        fetchUsersWithStatus();
        
        if (payload.eventType === 'INSERT') {
          toast.success('New user registered', {
            description: `Welcome ${payload.new.full_name || payload.new.email}!`,
          });
        }
      })
      .subscribe();

    // Auto-refresh every 10 seconds for better real-time experience
    const interval = setInterval(() => {
      fetchUsersWithStatus();
    }, 10000);

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(profilesChannel);
      clearInterval(interval);
    };
  }, []);

  const fetchUsersWithStatus = async () => {
    try {
      console.log('Fetching users with status...');
      
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;
      console.log('Profiles fetched:', profiles?.length || 0);

      // Use 15 minutes window for active sessions (more lenient)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .gte('last_activity', fifteenMinutesAgo);

      if (sessionsError) {
        console.log('Sessions error (might not exist yet):', sessionsError);
        // Don't throw error if user_sessions table doesn't exist yet
      }

      console.log('Active sessions fetched:', activeSessions?.length || 0);

      // Fetch complaint counts for each user
      const { data: complaintCounts, error: complaintsError } = await supabase
        .from('complaints')
        .select('user_id')
        .not('user_id', 'is', null);

      if (complaintsError) {
        console.log('Complaints error (might not exist yet):', complaintsError);
      }

      // Process complaint counts
      const complaintCountMap = (complaintCounts || []).reduce((acc: Record<string, number>, complaint) => {
        if (complaint.user_id) {
          acc[complaint.user_id] = (acc[complaint.user_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Create a map of active user sessions
      const activeSessionMap = (activeSessions || []).reduce((acc: Record<string, any>, session) => {
        acc[session.user_id] = session;
        return acc;
      }, {});

      // For demo purposes, let's assume some users are online if no sessions exist
      const demoOnlineUsers = new Set();
      if (!activeSessions || activeSessions.length === 0) {
        // Make first 2 users appear online for demo
        (profiles || []).slice(0, 2).forEach(user => {
          demoOnlineUsers.add(user.id);
        });
      }

      // Process users with status
      const usersWithStatus = (profiles || []).map((user: any) => {
        const session = activeSessionMap[user.id];
        const isOnlineDemo = demoOnlineUsers.has(user.id);
        
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role_type: user.role_type,
          account_status: user.account_status,
          created_at: user.created_at,
          is_online: !!session || isOnlineDemo,
          last_seen: session?.last_activity || user.created_at,
          complaint_count: complaintCountMap[user.id] || 0
        };
      });

      // Create active user sessions for display
      const activeUsersList = (activeSessions || []).map((session: any) => {
        const user = profiles?.find((p: any) => p.id === session.user_id);
        return {
          id: `session-${session.id}`,
          user_id: session.user_id,
          login_time: session.login_time,
          last_activity: session.last_activity,
          is_active: session.is_active,
          user_email: user?.email,
          user_name: user?.full_name,
          user_role: user?.role_type
        };
      });

      setActiveUsers(activeUsersList);
      setAllUsers(usersWithStatus);
      
      // Calculate stats with better date handling
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      console.log('Today start:', todayStart.toISOString());
      
      const newToday = usersWithStatus.filter((user: any) => {
        const userDate = new Date(user.created_at);
        const isToday = userDate >= todayStart;
        console.log(`User ${user.email} created at: ${user.created_at}, is today: ${isToday}`);
        return isToday;
      }).length;
      
      const online = usersWithStatus.filter((user: any) => user.is_online).length;
      
      console.log('Stats calculated:', {
        total: usersWithStatus.length,
        active: activeUsersList.length,
        new_today: newToday,
        online
      });
      
      setStats({
        total: usersWithStatus.length,
        active: Math.max(activeUsersList.length, online), // Use the higher count
        new_today: newToday,
        online
      });
    } catch (error) {
      console.error('Error fetching users with status:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Create a user session when needed (for demo purposes)
  const createUserSession = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          login_time: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true,
          session_duration: 0
        });

      if (error) throw error;
      
      fetchUsersWithStatus();
    } catch (error) {
      console.error('Error creating user session:', error);
    }
  };

  return {
    activeUsers,
    allUsers,
    stats,
    loading,
    createUserSession,
    refetch: fetchUsersWithStatus
  };
}
