
import React from 'react';
import { EnhancedRealTimeAnalytics } from './dashboard/EnhancedRealTimeAnalytics';

export function AnalyticsTab() {
  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-6">
        <EnhancedRealTimeAnalytics />
      </div>
    </div>
  );
}
