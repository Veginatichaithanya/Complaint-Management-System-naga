
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Download, CheckCircle, Clock, AlertCircle, Trash2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

type IBMComplaint = {
  complaint_id: number;
  full_name: string;
  employee_id: string;
  email: string;
  department: string;
  issue_title: string;
  category: string;
  priority: string;
  description: string;
  attachment_url: string | null;
  user_id: string;
  status: string;
  submitted_at: string;
};

export function IBMComplaintsTable() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<IBMComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<IBMComplaint | null>(null);

  useEffect(() => {
    fetchComplaints();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('ibm-complaints-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'ibm_complaints'
      }, () => {
        fetchComplaints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('ibm_complaints')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (complaintId: number, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ibm_complaints')
        .update({ status: newStatus })
        .eq('complaint_id', complaintId);

      if (error) throw error;
      
      toast.success(`Complaint status updated to ${newStatus}`);
      fetchComplaints();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update complaint status');
    }
  };

  const deleteComplaint = async (complaintId: number) => {
    if (!confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('ibm_complaints')
        .delete()
        .eq('complaint_id', complaintId);

      if (error) throw error;
      
      toast.success('Complaint deleted successfully');
      fetchComplaints();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in progress':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
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
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>IBM Employee Complaints Dashboard</span>
            <Badge variant="secondary">
              Total: {complaints.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">Employee</th>
                  <th className="text-left p-4">Department</th>
                  <th className="text-left p-4">Issue</th>
                  <th className="text-left p-4">Priority</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Submitted</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((complaint) => (
                  <tr key={complaint.complaint_id} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-mono text-sm">
                      #{complaint.complaint_id}
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{complaint.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {complaint.employee_id}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline">{complaint.department}</Badge>
                    </td>
                    <td className="p-4">
                      <div className="max-w-xs">
                        <div className="font-medium truncate">{complaint.issue_title}</div>
                        <div className="text-sm text-muted-foreground">{complaint.category}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={getPriorityColor(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(complaint.status)}
                        <Select
                          value={complaint.status}
                          onValueChange={(value) => updateComplaintStatus(complaint.complaint_id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(complaint.submitted_at), { addSuffix: true })}
                    </td>
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedComplaint(complaint)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Complaint Details - #{complaint.complaint_id}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">Employee Information</h4>
                                  <p>Name: {complaint.full_name}</p>
                                  <p>ID: {complaint.employee_id}</p>
                                  <p>Email: {complaint.email}</p>
                                  <p>Department: {complaint.department}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Issue Details</h4>
                                  <p>Category: {complaint.category}</p>
                                  <p>Priority: {complaint.priority}</p>
                                  <p>Status: {complaint.status}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">Issue Title</h4>
                                <p>{complaint.issue_title}</p>
                              </div>
                              <div>
                                <h4 className="font-medium">Description</h4>
                                <p className="whitespace-pre-wrap">{complaint.description}</p>
                              </div>
                              {complaint.attachment_url && (
                                <div>
                                  <h4 className="font-medium">Attachment</h4>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(complaint.attachment_url!, '_blank')}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    View Attachment
                                  </Button>
                                </div>
                              )}
                              <div className="text-sm text-muted-foreground">
                                Submitted: {new Date(complaint.submitted_at).toLocaleString()}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteComplaint(complaint.complaint_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {complaints.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No complaints found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
