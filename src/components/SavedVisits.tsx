import { useState, useEffect } from 'react';
import { Clock, Trash2, ChevronRight, Building2, Edit3 } from 'lucide-react';
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
    // Show visits without summaries (drafts/in-progress)
    const drafts = allVisits.filter(v => !v.generatedSummary);
    setVisits(drafts.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this draft?')) {
      deleteVisit(id);
      loadVisits();
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  if (visits.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Edit3 className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-left">
            <span className="font-display font-semibold text-gray-900 block">Drafts & In-Progress</span>
            <span className="text-sm text-gray-500">{visits.length} {visits.length === 1 ? 'draft' : 'drafts'}</span>
          </div>
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
                      ? 'bg-amber-50 border border-amber-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${getHealthColor(visit.healthScore)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900 truncate">
                        {visit.customerName || 'Unnamed Customer'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(visit.updatedAt), 'MMM d, yyyy h:mm a')}
                      </span>
                      {visit.arr && (
                        <span className="text-xs text-green-600">
                          ARR: {visit.arr}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, visit.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
