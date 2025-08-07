
import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserComplaintStats } from '@/hooks/useUserComplaintStats';

export function ComplaintStatsWidget() {
  const { stats, loading } = useUserComplaintStats();

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsData = [
    {
      label: 'Total Complaints',
      value: stats.total_complaints,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: 'Pending',
      value: stats.pending_complaints,
      icon: Clock,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    },
    {
      label: 'Accepted',
      value: stats.accepted_complaints,
      icon: AlertCircle,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: 'Resolved',
      value: stats.resolved_complaints,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-foreground">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            My Complaint Statistics
            <Badge variant="outline" className="ml-auto">
              Live Updates
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
