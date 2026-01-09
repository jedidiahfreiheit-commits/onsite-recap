import { motion } from 'framer-motion';
import { Building2, MessageSquare, ClipboardList, Check, Hexagon } from 'lucide-react';

type Step = 'start' | 'customer-info' | 'prompts' | 'details' | 'summary';

interface ProgressTrackerProps {
  currentStep: Step;
  promptsCompleted: number;
  totalPrompts: number;
  hasCustomerInfo: boolean;
  hasDetails: boolean;
}

const stages = [
  { id: 'customer-info', label: 'Customer', icon: Building2 },
  { id: 'prompts', label: 'Questions', icon: MessageSquare },
  { id: 'details', label: 'Details', icon: ClipboardList },
  { id: 'summary', label: 'Summary', icon: Hexagon },
];

export function ProgressTracker({
  currentStep,
  promptsCompleted,
  totalPrompts,
  hasCustomerInfo,
  hasDetails,
}: ProgressTrackerProps) {
  if (currentStep === 'start') return null;

  // Calculate overall percentage
  const calculatePercentage = () => {
    let completed = 0;
    const weights = {
      customerInfo: 15,
      prompts: 60,
      details: 15,
      summary: 10,
    };

    // Customer info (15%)
    if (hasCustomerInfo) {
      completed += weights.customerInfo;
    } else if (currentStep === 'customer-info') {
      completed += weights.customerInfo * 0.5;
    }

    // Prompts (60%)
    const promptProgress = promptsCompleted / totalPrompts;
    if (currentStep === 'prompts' || currentStep === 'details' || currentStep === 'summary') {
      completed += weights.prompts * promptProgress;
    }

    // Details (15%)
    if (hasDetails) {
      completed += weights.details;
    } else if (currentStep === 'details') {
      completed += weights.details * 0.5;
    }

    // Summary (10%)
    if (currentStep === 'summary') {
      completed += weights.summary;
    }

    return Math.round(completed);
  };

  const getStageStatus = (stageId: string): 'completed' | 'current' | 'upcoming' => {
    const stageOrder = ['customer-info', 'prompts', 'details', 'summary'];
    const currentIndex = stageOrder.indexOf(currentStep);
    const stageIndex = stageOrder.indexOf(stageId);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const percentage = calculatePercentage();

  return (
    <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Percentage and stages */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-gray-900">{percentage}%</span>
            <span className="text-sm text-gray-500">complete</span>
          </div>
          
          {/* Stage indicators */}
          <div className="hidden sm:flex items-center gap-1">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage.id);
              const Icon = stage.icon;
              
              return (
                <div key={stage.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                      status === 'current'
                        ? 'bg-shiphero-red/10 text-shiphero-red'
                        : status === 'completed'
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {status === 'completed' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">{stage.label}</span>
                  </div>
                  
                  {index < stages.length - 1 && (
                    <div
                      className={`w-4 h-0.5 mx-1 rounded ${
                        status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-shiphero-red to-shiphero-blue rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Mobile stage indicator */}
        <div className="sm:hidden mt-3 flex items-center justify-center gap-2">
          {stages.map((stage) => {
            const status = getStageStatus(stage.id);
            return (
              <div
                key={stage.id}
                className={`w-2 h-2 rounded-full transition-all ${
                  status === 'current'
                    ? 'w-6 bg-shiphero-red'
                    : status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

