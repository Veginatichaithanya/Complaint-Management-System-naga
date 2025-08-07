
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Ticket, AlertCircle, Clock, CheckCircle, Search, Filter, User, Calendar, Tag, Bell, RefreshCw, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TicketWithComplaint {
  id: string;
  ticket_number: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'assigned';
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
  complaint_id: string;
  complaint: {
    complaint_id: string;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    user_id: string;
    created_at: string;
    attachment: string | null;
  } | null;
  user_profile: {
    full_name: string;
    email: string;
    employee_id?: string;
    department?: string;
  };
}

const categoryLabels = {
  software_bug: 'Software Bug',
  login_issue: 'Login Issue',
  performance: 'Performance',
  network: 'Network',
  technical_support: 'Technical Support',
  other: 'Other',
};

export function TicketsTab() {
  const [tickets, setTickets] = useState<TicketWithComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Generate a unique ticket number
  const generateTicketNumber = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9999) + 1;
    return `TKT-${date}-${String(random).padStart(4, '0')}`;
  };

  // Create tickets for complaints that don't have them
  const createMissingTickets = async (complaints: any[]) => {
    console.log('🎫 Creating missing tickets for complaints...');
    const createdTickets = [];
    
    for (const complaint of complaints) {
      try {
        const ticketNumber = generateTicketNumber();
        const { data: newTicket, error } = await supabase
          .from('tickets')
          .insert({
            complaint_id: complaint.complaint_id,
            ticket_number: ticketNumber,
            status: 'open'
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Error creating ticket for complaint:', complaint.complaint_id, error);
        } else {
          console.log('✅ Created ticket:', newTicket.ticket_number, 'for complaint:', complaint.complaint_id);
          createdTickets.push(newTicket);
        }
      } catch (error) {
        console.error('❌ Exception creating ticket for complaint:', complaint.complaint_id, error);
      }
    }
    
    return createdTickets;
  };

  const fetchTicketsWithComplaintDetails = async () => {
    try {
      console.log('🎫 Fetching tickets with detailed complaint information...');
      setLoading(true);

      // Step 1: Get all complaints first
      const { data: allComplaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (complaintsError) {
        console.error('❌ Error fetching complaints:', complaintsError);
        throw complaintsError;
      }

      if (!allComplaints || allComplaints.length === 0) {
        console.log('📋 No complaints found in database');
        setTickets([]);
        return;
      }

      // Step 2: Get all existing tickets
      const { data: existingTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) {
        console.error('❌ Error fetching tickets:', ticketsError);
      }

      // Step 3: Find complaints without tickets and create them
      const existingTicketComplaintIds = new Set(
        (existingTickets || []).map(ticket => ticket.complaint_id)
      );
      
      const complaintsWithoutTickets = allComplaints.filter(
        complaint => !existingTicketComplaintIds.has(complaint.complaint_id)
      );

      let newTickets: any[] = [];
      if (complaintsWithoutTickets.length > 0) {
        newTickets = await createMissingTickets(complaintsWithoutTickets);
        if (newTickets.length > 0) {
          toast.success(`✅ Created ${newTickets.length} tickets for existing complaints`);
        }
      }

      // Step 4: Get the complete list of tickets after creation
      const allTickets = [...(existingTickets || []), ...newTickets];

      // Step 5: Build comprehensive ticket data with complaint and user information
      const ticketsWithCompleteData = await Promise.all(
        allTickets.map(async (ticket) => {
          let complaintData = null;
          let userProfile = { 
            full_name: 'Unknown User', 
            email: 'unknown@example.com',
            employee_id: 'N/A',
            department: 'N/A'
          };

          // Find the complaint data
          const complaint = allComplaints.find(c => c.complaint_id === ticket.complaint_id);
          
          if (complaint) {
            complaintData = {
              complaint_id: complaint.complaint_id,
              title: complaint.title,
              description: complaint.description,
              category: complaint.category,
              priority: complaint.priority as 'low' | 'medium' | 'high' | 'urgent',
              user_id: complaint.user_id,
              created_at: complaint.created_at,
              attachment: complaint.attachment
            };

            // Fetch comprehensive user profile data
            if (complaint.user_id) {
              try {
                const [profileResult, userResult] = await Promise.all([
                  supabase.from('profiles').select('full_name, email').eq('id', complaint.user_id).maybeSingle(),
                  supabase.from('users').select('full_name, employee_id, department').eq('user_id', complaint.user_id).maybeSingle()
                ]);

                const profileData = profileResult.data;
                const userData = userResult.data;

                if (profileData || userData) {
                  userProfile = {
                    full_name: profileData?.full_name || userData?.full_name || 'Unknown User',
                    email: profileData?.email || 'unknown@example.com',
                    employee_id: userData?.employee_id || 'N/A',
                    department: userData?.department || 'N/A'
                  };
                }
              } catch (error) {
                console.error('❌ Error fetching user data for:', complaint.user_id, error);
              }
            }
          }

          return {
            id: ticket.id,
            ticket_number: ticket.ticket_number,
            status: ticket.status as 'open' | 'in_progress' | 'resolved' | 'closed' | 'assigned',
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            assigned_to: ticket.assigned_to,
            complaint_id: ticket.complaint_id,
            complaint: complaintData,
            user_profile: userProfile
          };
        })
      );

      setTickets(ticketsWithCompleteData);
      console.log('✅ Tickets with complete complaint details loaded:', ticketsWithCompleteData.length);
      
    } catch (error) {
      console.error('❌ Error in fetchTicketsWithComplaintDetails:', error);
      toast.error('Failed to load tickets with complaint details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsWithComplaintDetails();
    
    // Set up real-time subscription for tickets and complaints
    const channel = supabase
      .channel('tickets-complaints-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'tickets' 
      }, (payload) => {
        console.log('🔔 Real-time ticket update:', payload);
        fetchTicketsWithComplaintDetails();
        
        if (payload.eventType === 'INSERT') {
          toast.success('🎫 New ticket created!', {
            description: `Ticket ${payload.new.ticket_number} has been created`,
          });
        }
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'complaints' 
      }, (payload) => {
        console.log('🔔 Real-time complaint update:', payload);
        fetchTicketsWithComplaintDetails();
        
        if (payload.eventType === 'INSERT') {
          toast.info('📋 New complaint received - creating ticket...', {
            description: `Complaint "${payload.new.title}" will get a ticket`,
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus as any,
          updated_at: new Date().toISOString(),
          ...(newStatus === 'resolved' ? { resolved_at: new Date().toISOString() } : {})
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success(`✅ Ticket status updated to ${newStatus}`);
      fetchTicketsWithComplaintDetails(); // Refresh data
    } catch (error) {
      console.error('❌ Error updating ticket:', error);
      toast.error('Failed to update ticket status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-600 bg-red-50 border-red-200';
      case 'in_progress': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'closed': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'assigned': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'software_bug': return '🐛';
      case 'login_issue': return '🔐';
      case 'performance': return '⚡';
      case 'network': return '🌐';
      case 'technical_support': return '🎧';
      case 'other': return '❓';
      default: return '📋';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.complaint?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user_profile.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.complaint?.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || ticket.complaint?.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tickets with complaint details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center">
                <Ticket className="w-8 h-8 mr-3 text-primary" />
                Tickets with Complaint Details
              </h1>
              <p className="text-muted-foreground mt-1">Complete ticket management with detailed complaint information</p>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={fetchTicketsWithComplaintDetails} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Live Updates Active</span>
                <Bell className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-blue-600">
                  <Ticket className="w-5 h-5 mr-2" />
                  Total Tickets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                <p className="text-sm text-muted-foreground">All tickets with complaints</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Open
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.open}</div>
                <p className="text-sm text-muted-foreground">Pending resolution</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-yellow-600">
                  <Clock className="w-5 h-5 mr-2" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.inProgress}</div>
                <p className="text-sm text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.resolved}</div>
                <p className="text-sm text-muted-foreground">Completed tickets</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ticket ID, complaint title, user name, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="md:w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="software_bug">Software Bug</SelectItem>
                    <SelectItem value="login_issue">Login Issue</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="network">Network</SelectItem>
                    <SelectItem value="technical_support">Technical Support</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Tickets List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Detailed Tickets with Complaint Information ({filteredTickets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {tickets.length === 0 ? 'No tickets found' : 'No tickets match your search criteria'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tickets.length === 0 
                      ? 'Tickets will be automatically created when complaints are submitted' 
                      : 'Try adjusting your search or filter settings'
                    }
                  </p>
                  <Button
                    onClick={fetchTicketsWithComplaintDetails}
                    variant="outline"
                    className="mt-4"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Data
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredTickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border border-border rounded-lg p-6 bg-accent/10 hover:bg-accent/20 transition-colors"
                    >
                      {/* Ticket Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white font-bold text-lg">
                            {getCategoryIcon(ticket.complaint?.category || 'other')}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                              Ticket: {ticket.ticket_number}
                              {ticket.complaint && (
                                <Badge className={`${getPriorityColor(ticket.complaint.priority)} border font-medium`}>
                                  {ticket.complaint.priority.toUpperCase()}
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Select 
                            value={ticket.status} 
                            onValueChange={(value) => updateTicketStatus(ticket.id, value)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Badge className={`${getStatusColor(ticket.status)} border font-medium px-3 py-1`}>
                            {ticket.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Complaint Details */}
                      {ticket.complaint && (
                        <div className="bg-muted/20 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Complaint Details
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-sm text-muted-foreground">Title:</span>
                              <p className="text-foreground font-medium">{ticket.complaint.title}</p>
                            </div>
                            <div>
                              <span className="font-medium text-sm text-muted-foreground">Description:</span>
                              <p className="text-foreground text-sm leading-relaxed">{ticket.complaint.description}</p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Tag className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  {categoryLabels[ticket.complaint.category as keyof typeof categoryLabels] || ticket.complaint.category}
                                </span>
                              </div>
                              {ticket.complaint.attachment && (
                                <Badge variant="outline" className="text-xs">
                                  📎 Has Attachment
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* User Information */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          User Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <span className="font-medium text-sm text-muted-foreground">Name:</span>
                            <p className="text-foreground font-medium">{ticket.user_profile.full_name}</p>
                          </div>
                          <div>
                            <span className="font-medium text-sm text-muted-foreground">Email:</span>
                            <p className="text-foreground text-sm">{ticket.user_profile.email}</p>
                          </div>
                          {ticket.user_profile.employee_id && ticket.user_profile.employee_id !== 'N/A' && (
                            <div>
                              <span className="font-medium text-sm text-muted-foreground">Employee ID:</span>
                              <p className="text-foreground font-mono text-sm">{ticket.user_profile.employee_id}</p>
                            </div>
                          )}
                          {ticket.user_profile.department && ticket.user_profile.department !== 'N/A' && (
                            <div>
                              <span className="font-medium text-sm text-muted-foreground">Department:</span>
                              <p className="text-foreground text-sm">{ticket.user_profile.department}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
