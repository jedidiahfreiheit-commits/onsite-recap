import { useState, useEffect } from 'react';
import { Clock, Trash2, ChevronRight, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnsiteVisit } from '../types';
import { getAllVisits, deleteVisit } from '../services/storage';
import { format } from 'date-fns';

interface SavedVisitsProps {
  onLoadVisit: (visit: OnsiteVisit) => void;
  currentVisitId?: string;
}

export function SavedVisits({ onLoadVisit, currentVisitId }: SavedVisitsProps) {
  const [visits, setVisits] = useState<OnsiteVisit[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = () => {
    const allVisits = getAllVisits();
    setVisits(allVisits.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this visit?')) {
      deleteVisit(id);
      loadVisits();
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'bg-sage-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-coral-500';
      default: return 'bg-gray-500';
    }
  };

  if (visits.length === 0) {
    return null;
  }

  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-midnight-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-400" />
          <span className="font-display font-semibold text-white">Previous Visits</span>
          <span className="text-sm text-gray-500">({visits.length})</span>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 max-h-80 overflow-y-auto">
              {visits.map((visit) => (
                <motion.button
                  key={visit.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => onLoadVisit(visit)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                    visit.id === currentVisitId
                      ? 'bg-shiphero-red/20 border border-shiphero-red/30'
                      : 'bg-midnight-700/50 hover:bg-midnight-700 border border-transparent'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${getHealthColor(visit.healthScore)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-white truncate">
                        {visit.customerName || 'Unnamed Customer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {format(new Date(visit.updatedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      {visit.arr && (
                        <span className="text-xs text-shiphero-red">
                          ARR: {visit.arr}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, visit.id)}
                    className="p-2 text-gray-500 hover:text-coral-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

