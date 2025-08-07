
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Clock, CheckCircle, Bell, Eye, Calendar, User, Tag, Mail, IdCard, Building2, FileText, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useRealTimeAdminDashboard } from '@/hooks/useRealTimeAdminDashboard';
import { AcceptComplaintButton } from '@/components/admin/AcceptComplaintButton';
import { formatDistanceToNow, format } from 'date-fns';

export function RealTimeComplaintsTable() {
  const { complaints, loading, newComplaintsCount, resetNewComplaintsCount, updateComplaintStatus, refetch } = useRealTimeAdminDashboard();

  // Auto-reset new complaints counter after viewing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (newComplaintsCount > 0) {
        resetNewComplaintsCount();
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [newComplaintsCount, resetNewComplaintsCount]);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in meeting':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'accepted':
      case 'in progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    const categoryMap: Record<string, string> = {
      'software_bug': '🐛',
      'login_issue': '🔐',
      'performance': '⚡',
      'network': '🌐',
      'technical_support': '🎧',
      'hardware': '🖥️',
      'software': '💻',
      'other': '❓'
    };
    return categoryMap[category?.toLowerCase()] || '📋';
  };

  const handleComplaintAccepted = async () => {
    console.log('🔄 Complaint accepted in real-time table, refreshing...');
    await refetch();
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Real-Time Complaints Feed
              {newComplaintsCount > 0 && (
                <Badge className="ml-2 bg-red-500/20 text-red-700 border-red-500/30 animate-pulse">
                  <Bell className="w-3 h-3 mr-1" />
                  {newComplaintsCount} new
                </Badge>
              )}
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <Button
              onClick={resetNewComplaintsCount}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Eye className="w-4 h-4 mr-1" />
              Mark as viewed
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {complaints.slice(0, 20).map((complaint, index) => (
                <motion.div
                  key={complaint.complaint_id}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200
                  }}
                  className={`p-6 rounded-lg border transition-all duration-300 hover:shadow-lg ${
                    index < newComplaintsCount ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/20' : 'bg-background border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="mt-1">
                        {getStatusIcon(complaint.status)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Header with Title and Priority */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h3 className="text-foreground font-bold text-lg leading-tight mb-1">
                              {complaint.title || 'No Title'}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-medium ${getPriorityColor(complaint.priority)}`}
                              >
                                {complaint.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-medium ${getStatusColor(complaint.status)}`}
                              >
                                {complaint.status?.toUpperCase() || 'PENDING'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <FileText className="w-4 h-4 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground mb-1">Description:</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {complaint.description || 'No description provided'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* User Information - Updated to use the new view fields */}
                        <div className="bg-accent/10 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Submitted by:
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="font-medium text-foreground">
                                {complaint.user_full_name || complaint.profile_full_name || 'Unknown User'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {complaint.user_email || 'No email'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <IdCard className="w-3 h-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                ID: {complaint.user_employee_id || 'N/A'}
                              </span>
                            </div>
                            {complaint.user_department && complaint.user_department !== 'N/A' && (
                              <div className="flex items-center gap-2 md:col-span-2">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">
                                  Dept: {complaint.user_department}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Category and Metadata */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              <span className="mr-1">{getCategoryIcon(complaint.category)}</span>
                              {complaint.category?.replace('_', ' ').toUpperCase() || 'OTHER'}
                            </Badge>

                            {complaint.attachment && (
                              <Badge variant="outline" className="text-xs">
                                <Paperclip className="w-3 h-3 mr-1" />
                                Attachment
                              </Badge>
                            )}

                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1" />
                              <span className="font-medium">
                                {complaint.created_at 
                                  ? format(new Date(complaint.created_at), 'MMM dd, yyyy HH:mm')
                                  : 'No date'
                                }
                              </span>
                              {complaint.created_at && (
                                <span className="ml-2 text-xs opacity-75">
                                  ({formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })})
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <AcceptComplaintButton
                              complaintId={complaint.complaint_id}
                              status={complaint.status}
                              onAccepted={handleComplaintAccepted}
                            />
                            
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateComplaintStatus(complaint.complaint_id, 'In Progress')}
                              disabled={complaint.status === 'Resolved' || complaint.status === 'Closed'}
                              className="text-xs"
                            >
                              In Progress
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateComplaintStatus(complaint.complaint_id, 'Resolved')}
                              disabled={complaint.status === 'Resolved' || complaint.status === 'Closed'}
                              className="text-xs"
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {index < newComplaintsCount && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0 mt-2" />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {complaints.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No complaints yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  New complaints will appear here in real-time
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
