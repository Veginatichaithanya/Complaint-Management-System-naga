
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Activity, 
  Clock, 
  TrendingUp,
  BarChart3,
  PieChart,
  Wifi
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEnhancedRealTimeAnalytics } from '@/hooks/useEnhancedRealTimeAnalytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, ComposedChart, Area, AreaChart } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export function EnhancedRealTimeAnalytics() {
  const { analytics, loading, lastUpdate } = useEnhancedRealTimeAnalytics();

  if (loading || !analytics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const userStats = [
    {
      title: 'Total Users',
      value: analytics.users.total,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Online Now',
      value: analytics.users.online,
      icon: UserCheck,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Offline',
      value: analytics.users.offline,
      icon: UserX,
      color: 'text-gray-500',
      bg: 'bg-gray-500/10'
    },
    {
      title: 'New Today',
      value: analytics.users.new_today,
      icon: UserPlus,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Active Sessions',
      value: analytics.sessions.active_sessions,
      icon: Activity,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      title: 'Avg Session Time',
      value: `${analytics.sessions.avg_session_time}m`,
      icon: Clock,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Enhanced Real-Time Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-muted-foreground">Live</span>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {userStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Growth Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Growth This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                +{analytics.users.new_this_week}
              </div>
              <p className="text-sm text-muted-foreground">New users this week</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Growth This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                +{analytics.users.new_this_month}
              </div>
              <p className="text-sm text-muted-foreground">New users this month</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {analytics.sessions.bounce_rate}%
              </div>
              <p className="text-sm text-muted-foreground">Short sessions rate</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Registration Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                User Registration Trend (7 Days)
                <div className="ml-auto flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.users.registration_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10B981" 
                    fill="#10B981" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* User Activity Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                User Activity Trend
                <div className="ml-auto flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={analytics.users.activity_trend}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="active_count" fill="#3B82F6" name="Active Users" />
                  <Line 
                    type="monotone" 
                    dataKey="total_count" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Total Users"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Roles Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                User Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={analytics.users.by_role}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    label={({ role, percent }) => `${role} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.users.by_role.map((entry, index) => (
                      <Cell key={`role-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.users.by_status}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="status" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Complaints by Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Complaints Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.complaints.by_priority}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="priority" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Complaints Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Complaints Trend (Last 7 Days)
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Wifi className="w-4 h-4 mr-1" />
                Live Updates
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.complaints.trend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#EF4444" 
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
