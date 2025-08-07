
import React from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRealTimeUsers } from '@/hooks/useRealTimeUsers';
import { Badge } from '@/components/ui/badge';
import { RealTimeUserStats } from './dashboard/RealTimeUserStats';

export function UsersTab() {
  const { allUsers, loading } = useRealTimeUsers();

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'text-green-600 bg-green-50 border-green-200' 
      : 'text-red-600 bg-red-50 border-red-200';
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' 
      ? 'text-purple-600 bg-purple-50 border-purple-200' 
      : 'text-blue-600 bg-blue-50 border-blue-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="space-y-8 p-6">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading users...</p>
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
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
              <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Real-time updates</span>
            </div>
          </div>
        </motion.div>

        {/* Real-time Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <RealTimeUserStats />
        </motion.div>

        {/* Users List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-card border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center">
                <Users className="w-5 h-5 mr-2" />
                User List ({allUsers.length})
                <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-border hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                        {user.is_online && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"
                          ></motion.div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-foreground font-medium">
                          {user.full_name || 'No name provided'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className={`text-xs ${getRoleColor(user.role_type)}`}>
                        {user.role_type}
                      </Badge>
                      <Badge className={`text-xs ${
                        user.is_online 
                          ? 'bg-green-500/20 text-green-700 border-green-500/30' 
                          : getStatusColor(user.account_status)
                      }`}>
                        {user.is_online ? 'online' : user.account_status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
                
                {allUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
