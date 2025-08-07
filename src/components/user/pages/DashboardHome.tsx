
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Ticket, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardHomeProps {
  onRaiseComplaint: () => void;
}

interface UserStats {
  totalComplaints: number;
  resolvedComplaints: number;
  pendingComplaints: number;
  recentComplaints: any[];
}

export function DashboardHome({ onRaiseComplaint }: DashboardHomeProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>({
    totalComplaints: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    recentComplaints: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      // Fetch user complaints
      const { data: complaints, error } = await supabase
        .from('complaints')
        .select(`
          complaint_id,
          title,
          status,
          created_at,
          category,
          priority
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalComplaints = complaints?.length || 0;
      const resolvedComplaints = complaints?.filter(c => c.status === 'Resolved').length || 0;
      const pendingComplaints = complaints?.filter(c => c.status !== 'Resolved').length || 0;
      const recentComplaints = complaints?.slice(0, 5) || [];

      setStats({
        totalComplaints,
        resolvedComplaints,
        pendingComplaints,
        recentComplaints
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'escalated': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white"
      >
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.email?.split('@')[0] || 'User'}!
        </h1>
        <p className="text-blue-100 mb-4">
          Manage your complaints and track their progress in real-time.
        </p>
        <Button
          onClick={onRaiseComplaint}
          className="bg-white text-blue-600 hover:bg-blue-50 border-0"
        >
          <Plus className="w-5 h-5 mr-2" />
          Raise New Complaint
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/90 backdrop-blur-xl border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Complaints</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalComplaints}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-white/90 backdrop-blur-xl border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.resolvedComplaints}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-white/90 backdrop-blur-xl border-border/50 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.pendingComplaints}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Complaints */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="bg-white/90 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Recent Complaints
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentComplaints.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No complaints found</p>
                <Button onClick={onRaiseComplaint} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Raise Your First Complaint
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                 {stats.recentComplaints.map((complaint, index) => (
                   <motion.div
                     key={complaint.complaint_id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: index * 0.1 }}
                     className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                   >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {complaint.title}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                      <Badge className={getStatusColor(complaint.status)}>
                        {complaint.status.replace('_', ' ')}
                      </Badge>
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
