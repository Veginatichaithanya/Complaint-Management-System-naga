
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { processGroupByCategory, processGroupByPriority, generateTrendData, ChartDataItem } from '@/utils/analyticsUtils';

interface AnalyticsData {
  complaints: {
    total: number;
    today: number;
    resolved: number;
    pending: number;
    by_category: ChartDataItem[];
    by_priority: ChartDataItem[];
    trend: Array<{ date: string; count: number }>;
  };
  tickets: {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    avg_resolution_time: number;
  };
  users: {
    total: number;
    active_today: number;
    new_registrations: number;
  };
}

export function useRealTimeAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchAnalytics();
    
    // Set up real-time subscriptions
    const complaintsChannel = supabase
      .channel('complaints-analytics-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'complaints' 
      }, (payload) => {
        console.log('Complaints analytics update:', payload);
        fetchAnalytics();
        
        if (payload.eventType === 'INSERT') {
          toast.info('New complaint received', {
            description: 'Analytics updated in real-time',
          });
        }
      })
      .subscribe();

    const ticketsChannel = supabase
      .channel('tickets-analytics-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, (payload) => {
        console.log('Tickets analytics update:', payload);
        fetchAnalytics();
      })
      .subscribe();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchAnalytics();
    }, 60000);

    return () => {
      supabase.removeChannel(complaintsChannel);
      supabase.removeChannel(ticketsChannel);
      clearInterval(interval);
    };
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLastUpdate(new Date());
      
      // Fetch complaints data
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('*');

      if (complaintsError) throw complaintsError;

      // Fetch tickets data
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*');

      if (ticketsError) throw ticketsError;

      // Fetch users data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Process data
      const today = new Date().toDateString();
      
      const complaintsData = {
        total: complaints?.length || 0,
        today: complaints?.filter(c => new Date(c.created_at).toDateString() === today).length || 0,
        resolved: complaints?.filter(c => c.status === 'resolved').length || 0,
        pending: complaints?.filter(c => c.status === 'open').length || 0,
        by_category: processGroupByCategory(complaints || []),
        by_priority: processGroupByPriority(complaints || []),
        trend: generateTrendData(complaints || [])
      };

      const ticketsData = {
        total: tickets?.length || 0,
        open: tickets?.filter(t => t.status === 'open').length || 0,
        in_progress: tickets?.filter(t => t.status === 'in_progress').length || 0,
        resolved: tickets?.filter(t => t.status === 'resolved').length || 0,
        avg_resolution_time: calculateAvgResolutionTime(tickets || [])
      };

      const usersData = {
        total: profiles?.length || 0,
        active_today: 0, // Will be enhanced with session data
        new_registrations: profiles?.filter(p => new Date(p.created_at).toDateString() === today).length || 0
      };

      setAnalytics({
        complaints: complaintsData,
        tickets: ticketsData,
        users: usersData
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgResolutionTime = (tickets: any[]) => {
    const resolved = tickets.filter(t => t.status === 'resolved' && t.resolved_at);
    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((acc, ticket) => {
      const created = new Date(ticket.created_at);
      const resolved = new Date(ticket.resolved_at);
      return acc + (resolved.getTime() - created.getTime());
    }, 0);

    return Math.round(totalTime / resolved.length / (1000 * 60 * 60 * 24)); // days
  };

  return {
    analytics,
    loading,
    lastUpdate,
    refetch: fetchAnalytics
  };
}
