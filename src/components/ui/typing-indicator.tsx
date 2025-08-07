
import React from 'react';
import { motion } from 'framer-motion';
import { RobotAvatar } from './robot-avatar';

interface TypingIndicatorProps {
  message?: string;
}

export function TypingIndicator({ message = "AI Assistant is typing..." }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex items-start gap-4"
    >
      <RobotAvatar state="typing" size="md" />
      
      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-lg max-w-xs">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{message}</span>
          
          {/* Animated typing dots */}
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.1
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
