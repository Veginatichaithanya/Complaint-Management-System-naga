
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useComplaintSubmission } from '@/hooks/useComplaintSubmission';
import { FileText, Upload } from 'lucide-react';

const departments = [
  'IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales', 
  'Engineering', 'Legal', 'Administration', 'Research & Development'
];

const categories = [
  'Software Bug', 'Hardware Issue', 'HR Policy', 'Access Request',
  'Network Issue', 'Security Concern', 'Process Improvement', 'Other'
];

const priorities = ['Low', 'Medium', 'High', 'Urgent'];

interface ComplaintFormProps {
  onSuccess?: () => void;
}

export function ComplaintForm({ onSuccess }: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    full_name: '',
    employee_id: '',
    department: '',
    title: '',
    category: '',
    priority: '',
    description: '',
    attachment: ''
  });

  const { submitComplaint, isSubmitting } = useComplaintSubmission();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await submitComplaint(formData);
      if (result) {
        // Reset form
        setFormData({
          full_name: '',
          employee_id: '',
          department: '',
          title: '',
          category: '',
          priority: '',
          description: '',
          attachment: ''
        });
        
        onSuccess?.();
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <FileText className="w-6 h-6 mr-2 text-primary" />
            Submit New Complaint
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
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

            <div>
              <Label htmlFor="department">Department *</Label>
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

            {/* Complaint Details */}
            <div>
              <Label htmlFor="title">Complaint Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select complaint category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority level" />
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
              <Label htmlFor="description">Detailed Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Provide a detailed description of your complaint..."
                rows={6}
                required
              />
            </div>

            <div>
              <Label htmlFor="attachment">Attachment URL (Optional)</Label>
              <Input
                id="attachment"
                value={formData.attachment}
                onChange={(e) => handleInputChange('attachment', e.target.value)}
                placeholder="https://example.com/attachment.pdf"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting Complaint...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Submit Complaint
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
