
import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Users, BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealTimeAdminDashboard } from '@/hooks/useRealTimeAdminDashboard';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';
import { formatDistanceToNow } from 'date-fns';

export function FixedAdminDashboard() {
  const { 
    complaints, 
    loading: dashboardLoading, 
    newComplaintsCount, 
    resetNewComplaintsCount, 
    updateComplaintStatus,
    refetch: refetchDashboard
  } = useRealTimeAdminDashboard();

  const { metrics, loading: metricsLoading } = useDashboardMetrics();

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'in progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <BarChart3 className="w-8 h-8 mr-3 text-primary" />
              Real-Time Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Live monitoring with real user data
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={refetchDashboard} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Live Updates Active</span>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-blue-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Total Complaints
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics?.total_complaints || 0}</div>
                <p className="text-sm text-muted-foreground">
                  {complaints?.length || 0} loaded
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-orange-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {complaints?.filter(c => c.status?.toLowerCase() === 'pending').length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-blue-600">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {complaints?.filter(c => c.status?.toLowerCase() === 'in progress').length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-green-600">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {complaints?.filter(c => c.status?.toLowerCase() === 'resolved').length || 0}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-purple-600">
                  <Users className="w-5 h-5 mr-2" />
                  Active Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metrics?.active_tickets || 0}</div>
                <p className="text-sm text-muted-foreground">Open tickets</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content - Full Width Complaints Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center justify-between">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Real-Time Complaints Feed
                  {newComplaintsCount > 0 && (
                    <Badge className="ml-2 bg-red-500/20 text-red-700 border-red-500/30 animate-pulse">
                      {newComplaintsCount} new
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={resetNewComplaintsCount}
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Mark as viewed
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {complaints.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No complaints found</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      New complaints will appear here in real-time
                    </p>
                  </div>
                ) : (
                  complaints.slice(0, 10).map((complaint, index) => (
                    <motion.div
                      key={complaint.complaint_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${
                        index < newComplaintsCount ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-foreground font-medium text-sm leading-tight">
                            {complaint.title}
                          </h4>
                          <p className="text-muted-foreground text-sm mt-1 leading-tight line-clamp-2">
                            {complaint.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span>{complaint.user_full_name || complaint.profile_full_name || 'Unknown User'}</span>
                            {complaint.user_employee_id && complaint.user_employee_id !== 'N/A' && (
                              <span>ID: {complaint.user_employee_id}</span>
                            )}
                            {complaint.user_department && complaint.user_department !== 'N/A' && (
                              <span>Dept: {complaint.user_department}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getPriorityColor(complaint.priority)}`}
                              >
                                {complaint.priority.toUpperCase()}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getStatusColor(complaint.status)}`}
                              >
                                {complaint.status}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {complaint.category}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {complaint.status === 'Pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateComplaintStatus(complaint.complaint_id, 'Accepted')}
                                  className="text-xs"
                                >
                                  Accept
                                </Button>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Connection</span>
                  <Badge className="bg-green-100 text-green-800">✓ Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Real-time Updates</span>
                  <Badge className="bg-green-100 text-green-800">✓ Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">System Health</span>
                  <Badge className="bg-green-100 text-green-800">✓ Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Feedback Processing</span>
                  <Badge className="bg-green-100 text-green-800">✓ Running</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
