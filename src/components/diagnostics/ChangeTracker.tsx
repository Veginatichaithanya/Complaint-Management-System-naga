
import React, { useEffect } from 'react';

interface ChangeTrackerProps {
  componentName: string;
  version?: string;
}

export function ChangeTracker({ componentName, version = "1.0" }: ChangeTrackerProps) {
  useEffect(() => {
    console.log(`🔄 Component loaded: ${componentName} v${version} at ${new Date().toISOString()}`);
    console.log('🔍 Current location:', window.location.href);
    console.log('🏗️ Build timestamp:', Date.now());
    
    // Check if hot reload is working
    if (import.meta.hot) {
      console.log('🔥 Hot reload is active');
      import.meta.hot.on('vite:beforeUpdate', () => {
        console.log(`🔄 Hot reload triggered for ${componentName}`);
      });
    }

    return () => {
      console.log(`🔴 Component unmounting: ${componentName}`);
    };
  }, [componentName, version]);

  return null;
}
