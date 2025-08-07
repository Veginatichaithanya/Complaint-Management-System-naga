
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare, Sparkles } from 'lucide-react';
import { RobotAvatar } from './robot-avatar';
import { Card, CardContent, CardHeader } from './card';
import { Button } from './button';

interface FloatingAIAssistantProps {
  onOpenChat: () => void;
}

export function FloatingAIAssistant({ onOpenChat }: FloatingAIAssistantProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {(isHovered || showTooltip) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mb-3 mr-2"
          >
            <Card className="bg-white/95 backdrop-blur-md border-blue-200 shadow-xl">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-gray-800">Need help?</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Ask AI Assistant about IBM issues
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="relative group"
        onClick={onOpenChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-lg opacity-30"
          animate={{
            scale: isHovered ? [1, 1.2, 1] : 1,
            opacity: isHovered ? [0.3, 0.5, 0.3] : 0.3
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Main button */}
        <div className="relative bg-white rounded-full p-3 shadow-2xl border border-blue-100">
          <RobotAvatar state={isHovered ? 'thinking' : 'idle'} size="lg" />
        </div>

        {/* Notification dot */}
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full flex items-center justify-center"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <MessageSquare className="w-2 h-2 text-white" />
        </motion.div>
      </motion.button>
    </div>
  );
}
