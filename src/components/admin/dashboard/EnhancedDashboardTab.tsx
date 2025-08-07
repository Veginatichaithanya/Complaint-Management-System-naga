
import React from 'react';
import { motion } from 'framer-motion';
import { DashboardHeader } from './DashboardHeader';
import { DashboardStats } from './DashboardStats';
import { SyncedComplaintsTable } from './SyncedComplaintsTable';
import { RealTimeActivityFeed } from './RealTimeActivityFeed';
import { LiveMetricsCounter } from './LiveMetricsCounter';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { useRealTimeComplaintSync } from '@/hooks/useRealTimeComplaintSync';

export function EnhancedDashboardTab() {
  const { metrics, loading, lastUpdate, recentUpdates } = useDashboardMetrics();
  const { pendingCount } = useRealTimeComplaintSync();

  return (
    <div className="w-full space-y-8 p-6">
      <DashboardHeader />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DashboardStats metrics={metrics} loading={loading} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <LiveMetricsCounter 
          value={pendingCount}
          label="Pending Complaints"
          format={(value) => `${value} pending`}
        />
      </motion.div>

      {/* Main complaints section - full width */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full"
      >
        <SyncedComplaintsTable />
      </motion.div>

      {/* Activity feed - separate section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full"
      >
        <RealTimeActivityFeed 
          updates={recentUpdates} 
          lastUpdate={lastUpdate}
        />
      </motion.div>
    </div>
  );
}
