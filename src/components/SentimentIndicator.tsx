import { motion } from 'framer-motion';
import { HealthScore } from '../types';

interface SentimentIndicatorProps {
  value: HealthScore;
  onChange: (value: HealthScore) => void;
}

const healthOptions: { value: HealthScore; label: string; color: string; bgColor: string }[] = [
  { value: 'green', label: 'Healthy', color: 'text-sage-400', bgColor: 'bg-sage-500' },
  { value: 'yellow', label: 'Needs Attention', color: 'text-amber-400', bgColor: 'bg-amber-500' },
  { value: 'red', label: 'At Risk', color: 'text-coral-400', bgColor: 'bg-coral-500' },
];

export function SentimentIndicator({ value, onChange }: SentimentIndicatorProps) {
  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 p-6">
      <h3 className="text-lg font-display font-semibold text-white mb-4">Account Health</h3>
      
      <div className="flex gap-3">
        {healthOptions.map((option) => (
          <motion.button
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(option.value)}
            className={`flex-1 relative p-4 rounded-xl border-2 transition-all ${
              value === option.value
                ? `border-${option.value === 'green' ? 'sage' : option.value === 'yellow' ? 'amber' : 'coral'}-500/50 bg-midnight-700`
                : 'border-midnight-600 hover:border-midnight-500 bg-midnight-700/50'
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div 
                className={`w-8 h-8 rounded-full ${option.bgColor} ${
                  value === option.value ? 'animate-pulse' : 'opacity-50'
                }`}
              />
              <span className={`text-sm font-medium ${
                value === option.value ? option.color : 'text-gray-500'
              }`}>
                {option.label}
              </span>
            </div>
            
            {value === option.value && (
              <motion.div
                layoutId="health-indicator"
                className="absolute inset-0 border-2 border-white/10 rounded-xl"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

