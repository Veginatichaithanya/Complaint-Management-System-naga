
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash2, Calendar, ExternalLink, AlertTriangle, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useComplaintOperations } from '@/hooks/useComplaintOperations';
import { formatDistanceToNow } from 'date-fns';

interface Complaint {
  complaint_id: string;
  user_id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  attachment: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface EditableComplaintCardProps {
  complaint: Complaint;
  onUpdate: () => void;
  onDelete: () => void;
}

const categories = [
  'Software Bug', 'Hardware Issue', 'HR Policy', 'Access Request',
  'Network Issue', 'Security Concern', 'Process Improvement', 'Other'
];

const priorities = ['Low', 'Medium', 'High', 'Urgent'];

export function EditableComplaintCard({ complaint, onUpdate, onDelete }: EditableComplaintCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: complaint.title,
    category: complaint.category,
    priority: complaint.priority,
    description: complaint.description,
    attachment: complaint.attachment
  });

  const { updateComplaint, deleteComplaint, canEdit, canDelete, isLoading } = useComplaintOperations();

  const handleSave = async () => {
    try {
      await updateComplaint(complaint.complaint_id, editForm);
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDelete = async () => {
    const success = await deleteComplaint(complaint.complaint_id);
    if (success) {
      onDelete();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-md transition-shadow duration-300">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1 flex-1">
              {isEditing ? (
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-semibold"
                  placeholder="Issue title"
                />
              ) : (
                <CardTitle className="text-lg font-semibold text-foreground">
                  {complaint.title}
                </CardTitle>
              )}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>#{complaint.complaint_id.substring(0, 8)}</span>
                <span>•</span>
                <Calendar className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}</span>
                {complaint.updated_at && complaint.updated_at !== complaint.created_at && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Updated {formatDistanceToNow(new Date(complaint.updated_at), { addSuffix: true })}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Badge className={getStatusColor(complaint.status)}>
                {complaint.status}
              </Badge>
              {canEdit(complaint.status) && !isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              {canDelete(complaint.status) && !isEditing && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                        Delete Complaint
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this complaint? This action cannot be undone.
                        <div className="mt-2 p-2 bg-muted rounded text-sm">
                          <strong>"{complaint.title}"</strong>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {isEditing && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        title: complaint.title,
                        category: complaint.category,
                        priority: complaint.priority,
                        description: complaint.description,
                        attachment: complaint.attachment
                      });
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Category</label>
                    <Select value={editForm.category} onValueChange={(value) => setEditForm(prev => ({ ...prev, category: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Priority</label>
                    <Select value={editForm.priority} onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Detailed description..."
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground line-clamp-2">
                  {complaint.description}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getPriorityColor(complaint.priority)}>
                    {complaint.priority} Priority
                  </Badge>
                  <Badge variant="outline">
                    {complaint.category}
                  </Badge>
                  {complaint.attachment && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      📎 Attachment
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Status: {complaint.status}
                  </div>
                  {complaint.attachment && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(complaint.attachment!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Attachment
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
