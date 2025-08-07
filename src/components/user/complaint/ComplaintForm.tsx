
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { useComplaintSubmission } from "@/hooks/useComplaintSubmission";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ComplaintFormProps {
  onSuccess: (complaintId: string) => void;
}

const ComplaintForm: React.FC<ComplaintFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    employee_id: '',
    email: user?.email || '',
    department: '',
    issue_title: '',
    description: '',
    category: '',
    priority: 'medium',
    attachment_url: ''
  });

  const { submitComplaint, isSubmitting } = useComplaintSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.employee_id || !formData.email || 
        !formData.department || !formData.issue_title || !formData.description || 
        !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await submitComplaint({
        title: formData.issue_title,
        ...formData
      });
      if (result) {
        onSuccess(result.complaint_id.toString());
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Issue Report</CardTitle>
        <CardDescription>
          Please provide detailed information about your issue to help us resolve it quickly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => handleInputChange('employee_id', e.target.value)}
                placeholder="Enter your employee ID"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your.email@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department *</Label>
            <Select onValueChange={(value) => handleInputChange('department', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="it">IT</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="fresher">Fresher</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issue_title">Issue Title *</Label>
            <Input
              id="issue_title"
              value={formData.issue_title}
              onChange={(e) => handleInputChange('issue_title', e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="software_bug">Software Bug</SelectItem>
                <SelectItem value="login_issue">Login Issue</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="network">Network</SelectItem>
                <SelectItem value="technical_support">Technical Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select onValueChange={(value) => handleInputChange('priority', value)} defaultValue="medium">
              <SelectTrigger>
                <SelectValue placeholder="Select priority level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Please provide detailed information about the issue, including steps to reproduce, expected behavior, and actual behavior..."
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment">Attachment (Optional)</Label>
            <FileUpload
              onFileUpload={(url) => handleInputChange('attachment_url', url || '')}
              accept="image/*,.pdf,.doc,.docx"
              maxSize={10}
            />
            {formData.attachment_url && (
              <p className="text-sm text-green-600">File uploaded successfully</p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Issue Report'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComplaintForm;
