
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ComplaintFormData = {
  full_name: string;
  employee_id: string;
  email: string;
  department: string;
  issue_title: string;
  category: string;
  priority: string;
  description: string;
  attachment_url: string | null;
  status: string;
};

const departments = [
  'IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales', 
  'Engineering', 'Legal', 'Administration', 'Research & Development'
];

const categories = [
  'Software Bug', 'Hardware Issue', 'HR Policy', 'Access Request',
  'Network Issue', 'Security Concern', 'Process Improvement', 'Other'
];

const priorities = ['Low', 'Medium', 'High', 'Urgent'];

export function IBMComplaintForm() {
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<ComplaintFormData>({
    full_name: '',
    employee_id: '',
    email: user?.email || '',
    department: '',
    issue_title: '',
    category: '',
    priority: 'Medium',
    description: '',
    attachment_url: null,
    status: 'Pending'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleInputChange = (field: keyof ComplaintFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PNG, JPG, and PDF files are allowed');
        return;
      }
      
      setAttachmentFile(file);
    }
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `complaint-attachments/${fileName}`;

      setUploadProgress(25);

      const { error: uploadError } = await supabase.storage
        .from('complaint-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(75);

      const { data } = supabase.storage
        .from('complaint-attachments')
        .getPublicUrl(filePath);

      setUploadProgress(100);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload attachment');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to submit a complaint');
      return;
    }

    // Validate required fields
    const requiredFields: (keyof ComplaintFormData)[] = ['full_name', 'employee_id', 'email', 'department', 'issue_title', 'category', 'priority', 'description'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let attachmentUrl = null;
      
      // Upload attachment if provided
      if (attachmentFile) {
        attachmentUrl = await uploadAttachment(attachmentFile);
        if (!attachmentUrl) {
          setIsSubmitting(false);
          return;
        }
      }

      // Insert complaint into database
      const complaintData = {
        ...formData,
        attachment_url: attachmentUrl,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('ibm_complaints')
        .insert([complaintData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Complaint submitted successfully!', {
        description: `Your complaint ID is: ${data.complaint_id}`,
      });

      setIsSubmitted(true);
      
      // Reset form
      setFormData({
        full_name: '',
        employee_id: '',
        email: user?.email || '',
        department: '',
        issue_title: '',
        category: '',
        priority: 'Medium',
        description: '',
        attachment_url: null,
        status: 'Pending'
      });
      setAttachmentFile(null);
      setUploadProgress(0);

    } catch (error) {
      console.error('Error submitting complaint:', error);
      toast.error('Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground">Please log in to submit a complaint.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-screen p-4"
      >
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Complaint Submitted!</h2>
            <p className="text-muted-foreground mb-4">
              Your complaint has been successfully submitted and is being reviewed by our team.
            </p>
            <Button 
              onClick={() => setIsSubmitted(false)}
              className="w-full"
            >
              Submit Another Complaint
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-6 max-w-4xl"
    >
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center">
            <AlertCircle className="w-6 h-6 mr-2 text-blue-600" />
            IBM Employee Complaint Submission System
          </CardTitle>
          <p className="text-muted-foreground">
            Submit detailed complaints for technical issues, department-related bugs, or requests
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="required">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employee_id" className="required">Employee ID</Label>
                <Input
                  id="employee_id"
                  value={formData.employee_id}
                  onChange={(e) => handleInputChange('employee_id', e.target.value)}
                  placeholder="e.g., 9922004191"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="required">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your.email@ibm.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="required">Department</Label>
              <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Issue Details */}
            <div className="space-y-2">
              <Label htmlFor="issue_title" className="required">Issue Title</Label>
              <Input
                id="issue_title"
                value={formData.issue_title}
                onChange={(e) => handleInputChange('issue_title', e.target.value)}
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="required">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="required">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
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

            <div className="space-y-2">
              <Label htmlFor="description" className="required">Detailed Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide a detailed description of the issue..."
                rows={5}
                required
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="attachment" className="flex items-center">
                <Upload className="w-4 h-4 mr-1" />
                Attachment (optional)
              </Label>
              <Input
                id="attachment"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground">
                PNG, JPG, PDF up to 10MB
              </p>
              {attachmentFile && (
                <div className="text-sm text-green-600">
                  Selected: {attachmentFile.name}
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-lg"
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center">
                  <Send className="w-5 h-5 mr-2" />
                  Submit Complaint
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
