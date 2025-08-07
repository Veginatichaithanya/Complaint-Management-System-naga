
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, Clock, Video } from 'lucide-react';
import { SimilarIssue } from '@/hooks/useMeetings';
import { MeetingScheduler } from './MeetingScheduler';
import { motion } from 'framer-motion';

interface SimilarIssuesDetectorProps {
  issues: SimilarIssue[];
  loading: boolean;
}

export function SimilarIssuesDetector({ issues, loading }: SimilarIssuesDetectorProps) {
  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-gray-900">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Similar Issues Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-gray-900">
          <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
          Similar Issues Detection
          {issues.length > 0 && (
            <Badge className="ml-2 bg-red-100 text-red-800">
              {issues.length} issues detected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No similar issues detected in the last 24 hours</p>
            <p className="text-sm text-gray-400 mt-1">Issues with 2+ similar complaints will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue, index) => (
              <motion.div
                key={`${issue.issue_keywords}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-orange-50 to-red-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {issue.issue_keywords}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {issue.complaint_count} complaints
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Latest: {new Date(issue.latest_created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${
                        issue.priority === 'high' 
                          ? 'bg-red-100 text-red-800' 
                          : issue.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {issue.priority} priority
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {issue.category}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Affecting {issue.user_ids.length} IBM employees
                  </div>
                  <MeetingScheduler 
                    similarIssue={issue}
                    trigger={
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Video className="w-4 h-4 mr-2" />
                        Schedule Meeting
                      </Button>
                    }
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
