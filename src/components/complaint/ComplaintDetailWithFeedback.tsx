
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Tag, AlertCircle } from 'lucide-react';
import { FeedbackStatusChecker } from '@/components/feedback/FeedbackStatusChecker';
import { formatDistanceToNow } from 'date-fns';

interface ComplaintDetailWithFeedbackProps {
  complaint: {
    complaint_id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    user_id: string;
    attachment?: string;
  };
  userInfo?: {
    full_name: string;
    employee_id: string;
    department?: string;
  };
  ticketNumber?: string;
}

export function ComplaintDetailWithFeedback({ 
  complaint, 
  userInfo,
  ticketNumber 
}: ComplaintDetailWithFeedbackProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'accepted': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in progress': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Complaint Details Card */}
      <Card className="shadow-lg border-border">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center">
              <AlertCircle className="w-6 h-6 mr-3 text-blue-600" />
              Complaint Details
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(complaint.status)} border font-medium px-3 py-1`}>
                {complaint.status}
              </Badge>
              <Badge className={`${getPriorityColor(complaint.priority)} border font-medium px-3 py-1`}>
                {complaint.priority} Priority
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-2">{complaint.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{complaint.description}</p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
              </span>
            </div>
            
            <div className="flex items-center">
              <Tag className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground capitalize">
                {complaint.category.replace('_', ' ')}
              </span>
            </div>

            {userInfo && (
              <div className="flex items-center">
                <User className="w-4 h-4 text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">
                  {userInfo.full_name} ({userInfo.employee_id})
                </span>
              </div>
            )}

            {ticketNumber && (
              <div className="flex items-center">
                <span className="text-sm font-mono text-muted-foreground">
                  Ticket: {ticketNumber}
                </span>
              </div>
            )}
          </div>

          {/* Attachment */}
          {complaint.attachment && (
            <div className="p-4 bg-muted/20 rounded-lg">
              <p className="text-sm font-medium text-foreground mb-1">Attachment:</p>
              <a 
                href={complaint.attachment} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View Attachment
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Section */}
      <FeedbackStatusChecker
        complaintId={complaint.complaint_id}
        complaintTitle={complaint.title}
        complaintStatus={complaint.status}
        ticketNumber={ticketNumber}
      />
    </div>
  );
}
