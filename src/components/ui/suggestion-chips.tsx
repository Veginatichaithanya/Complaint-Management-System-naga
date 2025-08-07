
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './button';
import { Shield, Wifi, Bug, Clock, Key, HelpCircle } from 'lucide-react';

interface SuggestionChipsProps {
  onSuggestionClick: (suggestion: string) => void;
  isVisible: boolean;
}

const suggestions = [
  {
    text: "Password reset issue",
    icon: Key,
    color: "from-red-400 to-red-600",
    query: "I'm having trouble resetting my IBM password"
  },
  {
    text: "VPN connection problem",
    icon: Wifi,
    color: "from-blue-400 to-blue-600", 
    query: "I can't connect to IBM VPN"
  },
  {
    text: "Access permission error",
    icon: Shield,
    color: "from-green-400 to-green-600",
    query: "I don't have access to a specific IBM tool"
  },
  {
    text: "Software bug report",
    icon: Bug,
    color: "from-orange-400 to-orange-600",
    query: "I found a bug in IBM software"
  },
  {
    text: "Workflow delay",
    icon: Clock,
    color: "from-purple-400 to-purple-600",
    query: "My workflow approval is delayed"
  },
  {
    text: "General help",
    icon: HelpCircle,
    color: "from-gray-400 to-gray-600",
    query: "I need general help with IBM tools"
  }
];

export function SuggestionChips({ onSuggestionClick, isVisible }: SuggestionChipsProps) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ staggerChildren: 0.1 }}
      className="space-y-3 mb-4"
    >
      <p className="text-sm text-gray-600 font-medium">
        Quick suggestions to get started:
      </p>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.text}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSuggestionClick(suggestion.query)}
              className="h-auto py-2 px-3 rounded-full border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs transition-all duration-200 hover:shadow-md group"
            >
              <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${suggestion.color} flex items-center justify-center mr-2 group-hover:scale-110 transition-transform`}>
                <suggestion.icon className="w-2 h-2 text-white" />
              </div>
              {suggestion.text}
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
