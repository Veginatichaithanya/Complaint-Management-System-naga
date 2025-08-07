
import React from 'react';
import { SyncedMyComplaints } from './SyncedMyComplaints';
import { ComplaintStatsWidget } from '@/components/complaint/ComplaintStatsWidget';

export function MyComplaints() {
  return (
    <div className="space-y-6">
      {/* Statistics Widget */}
      <ComplaintStatsWidget />
      
      {/* Real-time synchronized complaints */}
      <SyncedMyComplaints />
    </div>
  );
}
