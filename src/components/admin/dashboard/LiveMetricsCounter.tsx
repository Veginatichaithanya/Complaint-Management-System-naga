
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LiveMetricsCounterProps {
  value: number;
  previousValue?: number;
  label: string;
  format?: (value: number) => string;
}

export function LiveMetricsCounter({ 
  value, 
  previousValue, 
  label, 
  format = (v) => v.toString() 
}: LiveMetricsCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setIsAnimating(true);
      
      // Animate the counter
      const diff = value - previousValue;
      const duration = 1000;
      const steps = 20;
      const stepValue = diff / steps;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const interval = setInterval(() => {
        currentStep++;
        if (currentStep <= steps) {
          setDisplayValue(previousValue + (stepValue * currentStep));
        } else {
          setDisplayValue(value);
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, stepDuration);

      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [value, previousValue]);

  const hasChanged = previousValue !== undefined && previousValue !== value;
  const isIncrease = hasChanged && value > previousValue;
  const isDecrease = hasChanged && value < previousValue;

  return (
    <div className="relative">
      <motion.div
        animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 0.5 }}
        className={`text-3xl font-bold transition-colors duration-300 ${
          isAnimating 
            ? isIncrease 
              ? 'text-green-600' 
              : isDecrease 
                ? 'text-red-600' 
                : 'text-gray-900'
            : 'text-gray-900'
        }`}
      >
        {format(Math.round(displayValue))}
      </motion.div>
      
      {hasChanged && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className={`absolute -top-2 -right-2 text-xs font-medium px-1.5 py-0.5 rounded-full ${
            isIncrease 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}
        >
          {isIncrease ? '+' : ''}{value - previousValue}
        </motion.div>
      )}
    </div>
  );
}
