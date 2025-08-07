
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DashboardMetrics {
  total_complaints: number;
  active_tickets: number;
  resolved_tickets: number;
  pending_tickets: number;
  ai_resolved_complaints: number;
  resolution_rate: number;
}

interface RealTimeUpdate {
  type: 'complaint_created' | 'ticket_updated' | 'ticket_resolved';
  data: any;
  timestamp: string;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [recentUpdates, setRecentUpdates] = useState<RealTimeUpdate[]>([]);

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase.rpc('get_dashboard_metrics');
      
      if (error) throw error;
      
      const metricsData = data as unknown as DashboardMetrics;
      setMetrics(metricsData);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeUpdate = (type: RealTimeUpdate['type'], data: any) => {
    const update: RealTimeUpdate = {
      type,
      data,
      timestamp: new Date().toISOString()
    };

    setRecentUpdates(prev => [update, ...prev.slice(0, 4)]); // Keep last 5 updates
    setLastUpdate(new Date());

    // Show toast notification for important updates
    if (type === 'complaint_created') {
      const title = data.new && typeof data.new === 'object' && 'title' in data.new ? data.new.title : 'New complaint';
      toast.info('New complaint received', {
        description: `Complaint: ${title}`,
      });
    } else if (type === 'ticket_resolved') {
      const ticketNumber = data.new && typeof data.new === 'object' && 'ticket_number' in data.new ? data.new.ticket_number : 'Unknown';
      toast.success('Ticket resolved', {
        description: `Ticket #${ticketNumber} has been resolved`,
      });
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Set up real-time subscription for metrics updates
    const complaintsChannel = supabase
      .channel('complaints-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'complaints' 
      }, (payload) => {
        console.log('Complaints updated:', payload);
        handleRealTimeUpdate('complaint_created', payload);
        fetchMetrics();
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel('tickets-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, (payload) => {
        console.log('Tickets updated:', payload);
        const isResolved = payload.new && typeof payload.new === 'object' && 'status' in payload.new && payload.new.status === 'resolved';
        handleRealTimeUpdate(
          isResolved ? 'ticket_resolved' : 'ticket_updated',
          payload
        );
        fetchMetrics();
      })
      .subscribe();

    // Auto-refresh every 30 seconds as fallback
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000);

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(ticketsChannel);
      clearInterval(interval);
    };
  }, []);

  return { 
    metrics, 
    loading, 
    lastUpdate, 
    recentUpdates, 
    refetch: fetchMetrics 
  };
}
