
import React from 'react';
import { IBMComplaintsTable } from '@/components/admin/IBMComplaintsTable';
import { FeedbackStatusChecker } from '@/components/feedback/FeedbackStatusChecker';

export default function AdminComplaints() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Main Complaints Table */}
      <IBMComplaintsTable />
      
      {/* Note about feedback integration */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Feedback Integration</h3>
        <p className="text-blue-800 text-sm">
          The FeedbackStatusChecker component can be integrated into individual complaint detail views 
          to show feedback forms for closed/resolved complaints.
        </p>
      </div>
    </div>
  );
}
