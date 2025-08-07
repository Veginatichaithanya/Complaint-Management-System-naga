
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, MessageSquare, Ticket, Clock, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ComplaintSuccessProps {
  ticketId: string;
  onViewComplaints: () => void;
  onAskAI?: () => void;
}

export function ComplaintSuccess({ ticketId, onViewComplaints, onAskAI }: ComplaintSuccessProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center justify-center min-h-[500px]"
    >
      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-xl border-border/50 shadow-xl">
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            ✅ Support Ticket Created Successfully!
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Your complaint has been submitted and a support ticket has been created. 
            Our IBM support team will review and respond within 24 hours.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6 border border-blue-100">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Your Ticket ID</span>
            </div>
            <p className="font-mono font-bold text-blue-800 text-xl">{ticketId}</p>
            <p className="text-xs text-blue-600 mt-1">Keep this ID for tracking your request</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4 text-orange-500" />
              <div>
                <p className="font-medium">Response Time</p>
                <p className="text-xs">2-24 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 text-green-500" />
              <div>
                <p className="font-medium">Email Updates</p>
                <p className="text-xs">You'll be notified</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onViewComplaints} 
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 h-12 text-base font-medium"
            >
              <Ticket className="w-4 h-4 mr-2" />
              View My Tickets
            </Button>
            
            {onAskAI && (
              <Button 
                onClick={onAskAI} 
                variant="outline" 
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50 h-12 text-base"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Need Help? Ask AI Assistant
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            💡 Tip: You can track your ticket status in real-time from "My Tickets" section
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
