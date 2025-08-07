
import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Sparkles, TrendingUp, Clock, Bell } from 'lucide-react';

interface RealTimeUpdate {
  type: 'complaint_created' | 'ticket_updated' | 'ticket_resolved';
  data: any;
  timestamp: string;
}

interface DashboardHeaderProps {
  lastUpdate?: Date;
  recentUpdates?: RealTimeUpdate[];
}

export function DashboardHeader({ lastUpdate, recentUpdates = [] }: DashboardHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-8 shadow-lg"
    >
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-100 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative flex items-center justify-between">
        <div className="space-y-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-2"
          >
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Welcome Back
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-gray-900"
          >
            Admin Dashboard
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-gray-600"
          >
            Monitor your support system's performance and manage operations efficiently
          </motion.p>

          {/* Last Update Info */}
          {lastUpdate && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center space-x-2 text-sm text-gray-500"
            >
              <Clock className="w-4 h-4" />
              <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
            </motion.div>
          )}
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="hidden lg:flex flex-col items-center space-y-3"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg float">
              <Activity className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-xl border border-green-200">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">All Systems Operational</span>
          </div>

          {/* Recent Updates Indicator */}
          {recentUpdates.length > 0 && (
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
              <Bell className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {recentUpdates.length} recent update{recentUpdates.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
