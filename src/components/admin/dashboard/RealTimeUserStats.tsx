
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeUsers } from '@/hooks/useRealTimeUsers';

export function RealTimeUserStats() {
  const { stats, loading } = useRealTimeUsers();
  const [previousStats, setPreviousStats] = useState(stats);
  const [changedStats, setChangedStats] = useState<string[]>([]);

  useEffect(() => {
    const changed: string[] = [];
    
    if (stats.total !== previousStats.total) changed.push('total');
    if (stats.online !== previousStats.online) changed.push('online');
    if (stats.new_today !== previousStats.new_today) changed.push('new_today');
    
    if (changed.length > 0) {
      setChangedStats(changed);
      
      // Clear animation after 2 seconds
      setTimeout(() => setChangedStats([]), 2000);
    }
    
    setPreviousStats(stats);
  }, [stats, previousStats]);

  const statsData = [
    {
      key: 'total',
      title: 'Total Users',
      value: stats.total,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      description: 'All registered'
    },
    {
      key: 'online',
      title: 'Online Users',
      value: stats.online,
      icon: UserCheck,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
      description: 'Currently online'
    },
    {
      key: 'offline',
      title: 'Offline Users',
      value: stats.total - stats.online,
      icon: UserX,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      description: 'Currently offline'
    },
    {
      key: 'new_today',
      title: 'New Today',
      value: stats.new_today,
      icon: UserPlus,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      description: 'Joined today'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card border-border shadow-sm">
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnimatePresence mode="wait">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          const isChanged = changedStats.includes(stat.key);
          
          return (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: isChanged ? [1, 1.05, 1] : 1
              }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                scale: { duration: 0.3 }
              }}
            >
              <Card className={`bg-card border-border shadow-sm transition-all duration-300 ${
                isChanged ? 'ring-2 ring-primary/50 shadow-lg' : ''
              }`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-foreground">
                    <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center mr-3`}>
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <span className="text-sm">{stat.title}</span>
                    {isChanged && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </motion.div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <motion.div 
                      className="text-3xl font-bold text-foreground"
                      key={stat.value}
                      initial={{ scale: 1 }}
                      animate={{ scale: isChanged ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {stat.value}
                    </motion.div>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
