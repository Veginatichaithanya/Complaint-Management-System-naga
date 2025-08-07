
import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LiveMetricsCounter } from './LiveMetricsCounter';
import type { DashboardMetrics } from '@/hooks/useDashboardMetrics';

interface DashboardStatsProps {
  metrics: DashboardMetrics | null;
  previousMetrics?: DashboardMetrics | null;
  loading: boolean;
}

export function DashboardStats({ metrics, previousMetrics, loading }: DashboardStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: 'Total Complaints',
      value: metrics?.total_complaints || 0,
      previousValue: previousMetrics?.total_complaints || 0,
      icon: MessageSquare,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Active Tickets',
      value: metrics?.active_tickets || 0,
      previousValue: previousMetrics?.active_tickets || 0,
      icon: Clock,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Resolved Tickets',
      value: metrics?.resolved_tickets || 0,
      previousValue: previousMetrics?.resolved_tickets || 0,
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Resolution Rate',
      value: metrics?.resolution_rate || 0,
      previousValue: previousMetrics?.resolution_rate || 0,
      icon: TrendingUp,
      iconColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      format: (value: number) => `${value.toFixed(1)}%`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        const hasChanged = stat.previousValue !== stat.value;
        const isIncrease = hasChanged && stat.value > stat.previousValue;
        const trendIcon = isIncrease ? TrendingUp : TrendingDown;
        const TrendIcon = trendIcon;

        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-foreground">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mr-3`}>
                      <Icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </div>
                    <span className="text-sm font-medium">{stat.title}</span>
                  </div>
                  {hasChanged && (
                    <TrendIcon 
                      className={`w-4 h-4 ${isIncrease ? 'text-green-500' : 'text-red-500'}`} 
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <LiveMetricsCounter
                    value={stat.value}
                    previousValue={stat.previousValue}
                    label={stat.title}
                    format={stat.format}
                  />
                  <p className="text-xs text-muted-foreground">
                    {hasChanged 
                      ? `${isIncrease ? 'Increased' : 'Decreased'} from ${stat.format ? stat.format(stat.previousValue) : stat.previousValue}`
                      : 'No change from previous'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
