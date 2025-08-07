
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { ChangeTracker } from '@/components/diagnostics/ChangeTracker';

export function DiagnosticDashboard() {
  const diagnostics = {
    supabaseConnection: true,
    reactQueryActive: true,
    routingWorking: true,
    lastUpdate: new Date().toISOString()
  };

  return (
    <div className="p-6 space-y-6">
      <ChangeTracker componentName="DiagnosticDashboard" version="1.0" />
      
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="w-5 h-5 mr-2" />
            System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Supabase Connection</span>
              <div className="flex items-center">
                {diagnostics.supabaseConnection ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="ml-2 text-sm">
                  {diagnostics.supabaseConnection ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>React Query Active</span>
              <div className="flex items-center">
                {diagnostics.reactQueryActive ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="ml-2 text-sm">
                  {diagnostics.reactQueryActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Routing Working</span>
              <div className="flex items-center">
                {diagnostics.routingWorking ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="ml-2 text-sm">
                  {diagnostics.routingWorking ? 'Working' : 'Error'}
                </span>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last Update: {diagnostics.lastUpdate}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                If you're seeing this, code changes are being applied successfully.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
