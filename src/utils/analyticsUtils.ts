
// Utility functions for processing analytics data with proper typing

export interface ChartDataItem {
  name: string;
  value: number;
}

export const processGroupByCategory = (data: any[]): ChartDataItem[] => {
  const grouped = data.reduce((acc, item) => {
    const category = item.category || 'Other';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([category, count]) => ({
    name: category,
    value: Number(count)
  }));
};

export const processGroupByPriority = (data: any[]): ChartDataItem[] => {
  const grouped = data.reduce((acc, item) => {
    const priority = item.priority || 'Medium';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(grouped).map(([priority, count]) => ({
    name: priority,
    value: Number(count)
  }));
};

export const generateTrendData = (complaints: any[]) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  return last7Days.map(date => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: complaints.filter(c => c.created_at.startsWith(date)).length
  }));
};
