
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, MessageCircle, TrendingUp, Settings, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics';

export function ChatbotTab() {
  const { analytics, loading: analyticsLoading } = useRealTimeAnalytics();
  const { metrics, loading: metricsLoading } = useDashboardMetrics();
  const [botStatus, setBotStatus] = useState('active');

  const loading = analyticsLoading || metricsLoading;

  if (loading || !analytics || !metrics) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-6">
          <div className="animate-pulse space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const chatbotStats = [
    {
      title: 'AI Resolved',
      value: metrics.ai_resolved_complaints,
      icon: Bot,
      description: 'Complaints resolved by AI',
      color: 'text-green-600'
    },
    {
      title: 'Total Interactions',
      value: analytics.complaints.total,
      icon: MessageCircle,
      description: 'Total chat interactions',
      color: 'text-blue-600'
    },
    {
      title: 'Success Rate',
      value: `${Math.round((metrics.ai_resolved_complaints / metrics.total_complaints) * 100)}%`,
      icon: TrendingUp,
      description: 'AI resolution success rate',
      color: 'text-purple-600'
    },
    {
      title: 'Active Sessions',
      value: analytics.users.active_today,
      icon: Activity,
      description: 'Current active chat sessions',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center">
            <Bot className="w-8 h-8 mr-3 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Chatbot Management</h1>
              <p className="text-muted-foreground mt-1">Real-time chatbot performance and settings</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={`${botStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {botStatus === 'active' ? 'Online' : 'Offline'}
            </Badge>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {chatbotStats.map((stat, index) => (
              <Card key={stat.title} className="bg-card border-border shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-muted-foreground">
                    <stat.icon className={`w-5 h-5 mr-2 ${stat.color}`} />
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Chatbot Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                    <span className="text-foreground font-medium">Resolution Rate</span>
                    <span className="text-green-600 font-bold">{metrics.resolution_rate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                    <span className="text-foreground font-medium">Average Response Time</span>
                    <span className="text-blue-600 font-bold">2.3s</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                    <span className="text-foreground font-medium">User Satisfaction</span>
                    <span className="text-purple-600 font-bold">4.8/5</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-accent/50 rounded-lg">
                    <span className="text-foreground font-medium">Escalation Rate</span>
                    <span className="text-orange-600 font-bold">12%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Bot Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Bot Status</span>
                    <Button
                      size="sm"
                      variant={botStatus === 'active' ? 'destructive' : 'default'}
                      onClick={() => setBotStatus(botStatus === 'active' ? 'inactive' : 'active')}
                    >
                      {botStatus === 'active' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Response Delay</span>
                    <Badge variant="outline">1-3 seconds</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Learning Mode</span>
                    <Badge className="bg-blue-100 text-blue-800">Enabled</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-foreground">Auto Escalation</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Conversations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Recent AI Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.complaints.by_category.slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div>
                      <p className="text-foreground font-medium">{item.name} Issues</p>
                      <p className="text-muted-foreground text-sm">{item.value} conversations</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">
                      AI Handled
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
