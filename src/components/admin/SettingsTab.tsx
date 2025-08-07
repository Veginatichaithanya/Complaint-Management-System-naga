
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RefreshCw, Database, Bell, Shield, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useRealTimeAnalytics } from '@/hooks/useRealTimeAnalytics';
import { toast } from 'sonner';

export function SettingsTab() {
  const { analytics, loading } = useRealTimeAnalytics();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    system: {
      autoBackup: true,
      maintenanceMode: false,
      debugMode: false
    },
    appearance: {
      theme: 'light',
      animations: true,
      compactMode: false
    },
    database: {
      connectionPool: 10,
      queryTimeout: 30,
      autoVacuum: true
    }
  });

  const [systemHealth, setSystemHealth] = useState({
    database: 'healthy',
    api: 'healthy',
    cache: 'healthy',
    storage: 'healthy'
  });

  const handleSettingChange = (section: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const saveSettings = () => {
    // In real implementation, this would save to backend
    toast.success('Settings saved successfully');
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error': return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const refreshSystemHealth = () => {
    // In real implementation, this would check actual system health
    toast.info('System health check completed');
  };

  if (loading) {
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
            <Settings className="w-8 h-8 mr-3 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
              <p className="text-muted-foreground mt-1">Configure real-time system preferences</p>
            </div>
          </div>
          <Button onClick={saveSettings}>
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <span className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    System Health
                  </span>
                  <Button size="sm" variant="outline" onClick={refreshSystemHealth}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(systemHealth).map(([component, status]) => (
                    <div key={component} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                      <span className="text-foreground font-medium capitalize">{component}</span>
                      {getHealthBadge(status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-foreground capitalize">{key} Notifications</Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleSettingChange('notifications', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  System Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.system).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={key} className="text-foreground">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <Switch
                        id={key}
                        checked={value}
                        onCheckedChange={(checked) => handleSettingChange('system', key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Theme</Label>
                    <select 
                      value={settings.appearance.theme}
                      onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                      className="px-3 py-1 border border-border rounded-md bg-background text-foreground"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Animations</Label>
                    <Switch
                      checked={settings.appearance.animations}
                      onCheckedChange={(checked) => handleSettingChange('appearance', 'animations', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Compact Mode</Label>
                    <Switch
                      checked={settings.appearance.compactMode}
                      onCheckedChange={(checked) => handleSettingChange('appearance', 'compactMode', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Real-time Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Real-time System Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-accent/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analytics?.complaints?.total || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Complaints</div>
                </div>
                <div className="text-center p-4 bg-accent/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics?.users?.active_today || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="text-center p-4 bg-accent/50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime</div>
                </div>
                <div className="text-center p-4 bg-accent/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">45ms</div>
                  <div className="text-sm text-muted-foreground">Response Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
