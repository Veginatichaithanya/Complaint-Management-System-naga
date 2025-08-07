import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, User, Mail, Building2, Calendar, AlertCircle, Download, RefreshCw } from 'lucide-react';
import { useComplaintsWithUsers } from '@/hooks/useComplaintsWithUsers';
import { AcceptComplaintButton } from '@/components/admin/AcceptComplaintButton';
import { DeleteComplaintButton } from '@/components/admin/DeleteComplaintButton';
import { RealTimeNotificationPanel } from '@/components/shared/RealTimeNotificationPanel';
import { format } from 'date-fns';

export function AdminComplaintsTable() {
  const { 
    complaints, 
    loading, 
    updateComplaintStatus, 
    newComplaintsCount, 
    resetNewComplaintsCount,
    refetch 
  } = useComplaintsWithUsers();

  React.useEffect(() => {
    if (newComplaintsCount > 0) {
      const timer = setTimeout(() => {
        resetNewComplaintsCount();
      }, 5000);
      return () => clearTimeout(timer);
    }
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    await updateComplaintStatus(complaintId, newStatus);
  };

  const handleComplaintAccepted = async () => {
    console.log('🔄 Complaint accepted, refreshing complaints list...');
    await refetch();
  };

  const handleComplaintDeleted = async () => {
    console.log('🔄 Complaint deleted, refreshing complaints list...');
    await refetch();
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Loading Complaints...
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-border rounded-lg p-4">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Complaints & Tickets
            {newComplaintsCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800 animate-pulse">
                {newComplaintsCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <RealTimeNotificationPanel />
            <Badge variant="outline" className="text-muted-foreground">
              {complaints.length} total
            </Badge>
            <Button onClick={refetch} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {complaints.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No complaints found</p>
            <p className="text-muted-foreground mb-4">
              User-submitted complaints will appear here with complete user details.
            </p>
            <Button onClick={refetch} className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint, index) => (
              <motion.div
                key={complaint.complaint_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`border border-border rounded-lg p-6 bg-card hover:bg-muted/50 transition-colors ${
                  index < newComplaintsCount ? 'ring-2 ring-blue-500/20 bg-blue-50' : ''
                }`}
              >
                {/* Header with title and priority */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">
                      {complaint.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {complaint.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Badge className={`${getPriorityColor(complaint.priority)} font-medium`}>
                      {complaint.priority?.toUpperCase() || 'MEDIUM'} PRIORITY
                    </Badge>
                    <Badge className={`${getStatusColor(complaint.status)} font-medium`}>
                      {complaint.status || 'Pending'}
                    </Badge>
                  </div>
                </div>

                {/* User Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="text-sm font-medium text-foreground">
                        {complaint.user_full_name || 'Unknown User'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium text-foreground">
                        {complaint.user_email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employee ID</p>
                      <p className="text-sm font-medium text-foreground">
                        {complaint.user_employee_id || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium text-foreground">
                        {complaint.user_department || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer with metadata and actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(complaint.created_at), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {complaint.category}
                    </Badge>
                    {complaint.attachment && (
                      <Button variant="outline" size="sm" className="h-6 px-2">
                        <Download className="w-3 h-3 mr-1" />
                        File
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <AcceptComplaintButton
                      complaintId={complaint.complaint_id}
                      status={complaint.status}
                      onAccepted={handleComplaintAccepted}
                    />
                    
                    <Select
                      value={complaint.status}
                      onValueChange={(value) => handleStatusChange(complaint.complaint_id, value)}
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>

                    <DeleteComplaintButton
                      complaintId={complaint.complaint_id}
                      complaintTitle={complaint.title}
                      onDeleted={handleComplaintDeleted}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
