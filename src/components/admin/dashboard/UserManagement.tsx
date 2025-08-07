
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, Mail, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_type: string;
  account_status: string;
  created_at: string;
  complaint_count?: number;
  is_online?: boolean;
  last_activity?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUsersWithRealTimeStatus();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('profiles-management-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchUsersWithRealTimeStatus();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => {
        fetchUsersWithRealTimeStatus();
      })
      .subscribe();

    // Auto-refresh every 15 seconds for real-time updates
    const interval = setInterval(() => {
      fetchUsersWithRealTimeStatus();
    }, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchUsersWithRealTimeStatus = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch active sessions (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('is_active', true)
        .gte('last_activity', fiveMinutesAgo);

      if (sessionsError) throw sessionsError;

      // Fetch complaint counts
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('user_id')
        .not('user_id', 'is', null);

      if (complaintsError) throw complaintsError;

      // Process complaint counts
      const complaintCountMap = (complaints || []).reduce((acc: Record<string, number>, complaint) => {
        if (complaint.user_id) {
          acc[complaint.user_id] = (acc[complaint.user_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Create active sessions map
      const activeSessionMap = (activeSessions || []).reduce((acc: Record<string, any>, session) => {
        acc[session.user_id] = session;
        return acc;
      }, {});

      // Process users with status
      const processedUsers = (profiles || []).map((user: any) => {
        const session = activeSessionMap[user.id];
        return {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role_type: user.role_type,
          account_status: user.account_status,
          created_at: user.created_at,
          complaint_count: complaintCountMap[user.id] || 0,
          is_online: !!session,
          last_activity: session?.last_activity
        };
      });

      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchUsersWithRealTimeStatus();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.account_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'deactivated': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'support': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              User Management ({filteredUsers.length})
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardTitle>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-md text-foreground"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Role</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Complaints</TableHead>
                  <TableHead className="text-muted-foreground">Last Activity</TableHead>
                  <TableHead className="text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-border hover:bg-accent/50"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                            </span>
                          </div>
                          {user.is_online && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border border-background rounded-full animate-pulse"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">
                            {user.full_name || 'No name provided'}
                          </p>
                          <p className="text-muted-foreground text-sm">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getRoleBadgeColor(user.role_type)} border capitalize`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getStatusBadgeColor(user.account_status)} border capitalize`}>
                          {user.account_status}
                        </Badge>
                        {user.is_online && (
                          <Badge className="bg-green-500/20 text-green-700 border-green-500/30 text-xs">
                            Online
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">{user.complaint_count || 0}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">
                        {user.is_online ? 'Online now' : 
                         user.last_activity ? 
                           `${Math.floor((new Date().getTime() - new Date(user.last_activity).getTime()) / (1000 * 60))}m ago` :
                           'Never'
                        }
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={user.account_status === 'active'}
                          onCheckedChange={() => toggleUserStatus(user.id, user.account_status)}
                          className="data-[state=checked]:bg-green-500"
                        />
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                          <Mail className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
