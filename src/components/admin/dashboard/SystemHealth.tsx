
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Server, Database, Wifi, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface HealthMetric {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  description: string;
  lastChecked: Date;
}

export function SystemHealth() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemHealth();
    
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkSystemHealth = async () => {
    try {
      const now = new Date();
      const metrics: HealthMetric[] = [];

      // Check database connectivity
      const { error: dbError } = await supabase.from('profiles').select('count').limit(1);
      metrics.push({
        name: 'Database Connection',
        status: dbError ? 'error' : 'healthy',
        value: dbError ? 'Disconnected' : 'Connected',
        description: dbError ? 'Unable to connect to database' : 'Database is responding normally',
        lastChecked: now
      });

      // Check active user sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('count')
        .eq('is_active', true);
      
      const sessionCount = sessions?.length || 0;
      metrics.push({
        name: 'Active Sessions',
        status: sessionsError ? 'error' : sessionCount > 0 ? 'healthy' : 'warning',
        value: sessionsError ? 'Error' : `${sessionCount}`,
        description: sessionsError ? 'Unable to fetch session data' : `${sessionCount} active user sessions`,
        lastChecked: now
      });

      // Check recent complaints
      const { data: recentComplaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('count')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const complaintCount = recentComplaints?.length || 0;
      metrics.push({
        name: 'Recent Activity',
        status: complaintsError ? 'error' : 'healthy',
        value: complaintsError ? 'Error' : `${complaintCount} complaints`,
        description: complaintsError ? 'Unable to fetch complaint data' : `${complaintCount} complaints in last 24 hours`,
        lastChecked: now
      });

      // Check notification system
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('count')
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
      
      const notificationCount = notifications?.length || 0;
      metrics.push({
        name: 'Notification System',
        status: notificationsError ? 'error' : 'healthy',
        value: notificationsError ? 'Error' : `${notificationCount} sent`,
        description: notificationsError ? 'Unable to check notifications' : `${notificationCount} notifications in last hour`,
        lastChecked: now
      });

      setHealthMetrics(metrics);
    } catch (error) {
      console.error('Error checking system health:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Healthy</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500/20 text-yellow-700 border-yellow-500/30">Warning</Badge>;
      case 'error':
        return <Badge className="bg-red-500/20 text-red-700 border-red-500/30">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallStatus = healthMetrics.some(m => m.status === 'error') ? 'error' :
                      healthMetrics.some(m => m.status === 'warning') ? 'warning' : 'healthy';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <Server className="w-5 h-5 mr-2" />
              System Health
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(overallStatus)}
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(metric.status)}
                  <div>
                    <p className="text-foreground font-medium">{metric.name}</p>
                    <p className="text-muted-foreground text-sm">{metric.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-foreground font-medium">{metric.value}</p>
                  <p className="text-muted-foreground text-xs">
                    {metric.lastChecked.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
