
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'ticket_created',
      message: 'New ticket created',
      details: 'TKT-20250106-0001 • 2 minutes ago',
      color: 'sky',
    },
    {
      id: 2,
      type: 'ai_resolved',
      message: 'Ticket resolved by AI',
      details: 'TKT-20250106-0002 • 5 minutes ago',
      color: 'emerald',
    },
    {
      id: 3,
      type: 'escalated',
      message: 'Ticket escalated',
      details: 'TKT-20250105-0156 • 1 hour ago',
      color: 'amber',
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'sky':
        return 'bg-sky-500/10 border-sky-500/20 text-sky-400';
      case 'emerald':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'amber':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      default:
        return 'bg-slate-500/10 border-slate-500/20 text-slate-400';
    }
  };

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
        <CardDescription className="text-white/60">Latest system events and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-center space-x-4 p-3 rounded-lg ${getColorClasses(activity.color)} border`}
            >
              <div className={`w-2 h-2 rounded-full ${activity.color === 'sky' ? 'bg-sky-400' : activity.color === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{activity.message}</p>
                <p className="text-xs text-white/60">{activity.details}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
