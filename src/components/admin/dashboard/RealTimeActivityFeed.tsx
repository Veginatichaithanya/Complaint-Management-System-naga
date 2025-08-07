
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, MessageSquare, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RealTimeUpdate {
  type: 'complaint_created' | 'ticket_updated' | 'ticket_resolved';
  data: any;
  timestamp: string;
}

interface RealTimeActivityFeedProps {
  updates: RealTimeUpdate[];
  lastUpdate: Date;
}

export function RealTimeActivityFeed({ updates, lastUpdate }: RealTimeActivityFeedProps) {
  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'complaint_created':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'ticket_resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ticket_updated':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getUpdateMessage = (update: RealTimeUpdate) => {
    switch (update.type) {
      case 'complaint_created':
        return `New complaint: "${update.data.new?.title || 'Untitled'}"`;
      case 'ticket_resolved':
        return `Ticket #${update.data.new?.ticket_number || 'Unknown'} resolved`;
      case 'ticket_updated':
        return `Ticket #${update.data.new?.ticket_number || 'Unknown'} updated`;
      default:
        return 'System update';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'complaint_created':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ticket_resolved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'ticket_updated':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-gray-900">
          <Clock className="w-5 h-5 mr-2" />
          Real-Time Activity
          <div className="ml-auto flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {updates.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            ) : (
              updates.map((update, index) => (
                <motion.div
                  key={`${update.timestamp}-${index}`}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ 
                    duration: 0.3,
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 200
                  }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex-shrink-0">
                    {getUpdateIcon(update.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getUpdateMessage(update)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(update.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge className={`${getBadgeVariant(update.type)} border text-xs`}>
                    {update.type.replace('_', ' ')}
                  </Badge>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
