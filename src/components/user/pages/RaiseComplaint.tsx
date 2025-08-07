
import React from 'react';
import { motion } from 'framer-motion';
import ComplaintForm from '../complaint/ComplaintForm';

interface RaiseComplaintProps {
  onSuccess?: () => void;
}

export function RaiseComplaint({ onSuccess }: RaiseComplaintProps) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Submit a Complaint
        </h1>
        <p className="text-muted-foreground">
          We're here to help resolve your concerns. Please provide detailed information about your issue.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <ComplaintForm onSuccess={onSuccess} />
      </motion.div>
    </div>
  );
}
