
import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Brain, MessageSquare } from 'lucide-react';

interface RobotAvatarProps {
  state: 'idle' | 'thinking' | 'typing' | 'speaking';
  size?: 'sm' | 'md' | 'lg';
}

export function RobotAvatar({ state, size = 'md' }: RobotAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const getAnimationProps = () => {
    switch (state) {
      case 'thinking':
        return {
          animate: { 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1]
          },
          transition: { 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      case 'typing':
        return {
          animate: { 
            y: [0, -2, 0],
            rotate: [0, 1, -1, 0]
          },
          transition: { 
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      case 'speaking':
        return {
          animate: { 
            scale: [1, 1.1, 1],
            rotate: [0, 2, -2, 0]
          },
          transition: { 
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
      default:
        return {
          animate: { 
            y: [0, -3, 0],
            rotate: [0, 1, -1, 0]
          },
          transition: { 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut" as const
          }
        };
    }
  };

  const getIcon = () => {
    switch (state) {
      case 'thinking':
        return <Brain className="w-full h-full text-purple-400" />;
      case 'typing':
        return <MessageSquare className="w-full h-full text-blue-400" />;
      default:
        return <Bot className="w-full h-full text-blue-500" />;
    }
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden`}
      {...getAnimationProps()}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-400/30 to-purple-500/30 rounded-full"
        animate={state === 'thinking' ? {
          opacity: [0.3, 0.7, 0.3],
          scale: [1, 1.2, 1]
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
      />
      
      {/* Robot icon */}
      <div className="relative z-10 p-2">
        {getIcon()}
      </div>
      
      {/* Pulse rings for speaking state */}
      {state === 'speaking' && (
        <>
          <motion.div
            className="absolute inset-0 border-2 border-blue-400/50 rounded-full"
            animate={{
              scale: [1, 1.5],
              opacity: [0.5, 0]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut" as const
            }}
          />
          <motion.div
            className="absolute inset-0 border-2 border-purple-400/50 rounded-full"
            animate={{
              scale: [1, 1.8],
              opacity: [0.3, 0]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut" as const,
              delay: 0.3
            }}
          />
        </>
      )}
    </motion.div>
  );
}
