
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function ChangeTest() {
  const currentTime = new Date().toLocaleString();
  
  return (
    <Card className="bg-green-50 border-green-200">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          ✅ Code Changes Are Working!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-green-700">
          If you can see this message, it means code changes are being applied successfully.
        </p>
        <p className="text-sm text-green-600 mt-2">
          Generated at: {currentTime}
        </p>
      </CardContent>
    </Card>
  );
}
