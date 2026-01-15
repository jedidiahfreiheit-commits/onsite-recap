import { useState, useEffect } from 'react';
import { Clock, Trash2, ChevronRight, Building2, FileText, Search, Download, Eye, Calendar, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { OnsiteVisit } from '../types';
import { getAllVisits, deleteVisit } from '../services/storage';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

interface SummaryRepositoryProps {
  onLoadVisit: (visit: OnsiteVisit) => void;
  currentVisitId?: string;
}

export function SummaryRepository({ onLoadVisit, currentVisitId }: SummaryRepositoryProps) {
  const [visits, setVisits] = useState<OnsiteVisit[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [previewVisit, setPreviewVisit] = useState<OnsiteVisit | null>(null);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = () => {
    const allVisits = getAllVisits();
    // Only show visits that have summaries
    const visitsWithSummaries = allVisits.filter(v => v.generatedSummary);
    setVisits(visitsWithSummaries.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    ));
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this summary?')) {
      deleteVisit(id);
      loadVisits();
      if (previewVisit?.id === id) {
        setPreviewVisit(null);
      }
    }
  };

  const handleDownloadPdf = (e: React.MouseEvent, visit: OnsiteVisit) => {
    e.stopPropagation();
    
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Onsite Visit Summary', margin, 25);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Customer: ${visit.customerName}`, margin, 40);
    pdf.text(`Account ID: ${visit.accountId}`, margin, 48);
    pdf.text(`ARR: ${visit.arr}`, margin, 56);
    pdf.text(`Date: ${new Date(visit.createdAt).toLocaleDateString()}`, margin, 64);
    
    pdf.setDrawColor(200);
    pdf.line(margin, 70, pageWidth - margin, 70);
    
    const cleanText = visit.generatedSummary
      .replace(/^#{1,3} /gm, '')
      .replace(/\*\*/g, '')
      .replace(/^- \[[ x]\] /gm, '• ')
      .replace(/^- /gm, '• ');
    
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(cleanText, maxWidth);
    let y = 80;
    
    for (const line of lines) {
      if (y > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, margin, y);
      y += 6;
    }
    
    const fileName = `onsite-recap-${visit.customerName || 'visit'}-${new Date(visit.createdAt).toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'green': return 'bg-green-500';
      case 'yellow': return 'bg-amber-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const filteredVisits = visits.filter(visit => 
    visit.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.accountId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    visit.generatedSummary?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (visits.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-shiphero-red/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-shiphero-red" />
            </div>
            <div className="text-left">
              <span className="font-display font-semibold text-gray-900 block">Summary Repository</span>
              <span className="text-sm text-gray-500">{visits.length} saved {visits.length === 1 ? 'summary' : 'summaries'}</span>
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
              {/* Search */}
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search summaries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-shiphero-blue"
                  />
                </div>
              </div>

              <div className="px-4 pb-4 space-y-2 max-h-96 overflow-y-auto">
                {filteredVisits.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No summaries found</p>
                ) : (
                  filteredVisits.map((visit) => (
                    <motion.div
                      key={visit.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`w-full rounded-xl transition-all border ${
                        visit.id === currentVisitId
                          ? 'bg-shiphero-red/5 border-shiphero-red/30'
                          : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                      }`}
                    >
                      <div 
                        onClick={() => onLoadVisit(visit)}
                        className="flex items-center gap-4 p-4 cursor-pointer"
                      >
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getHealthColor(visit.healthScore)}`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="font-medium text-gray-900 truncate">
                              {visit.customerName || 'Unnamed Customer'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(visit.updatedAt), 'MMM d, yyyy')}
                            </span>
                            {visit.arr && (
                              <span className="flex items-center gap-1 text-green-600">
                                <DollarSign className="w-3 h-3" />
                                {visit.arr}
                              </span>
                            )}
                            {visit.accountId && (
                              <span className="text-gray-400">ID: {visit.accountId}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewVisit(visit);
                            }}
                            className="p-2 text-gray-400 hover:text-shiphero-blue hover:bg-shiphero-blue/10 rounded-lg transition-colors"
                            title="Quick preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDownloadPdf(e, visit)}
                            className="p-2 text-gray-400 hover:text-shiphero-red hover:bg-shiphero-red/10 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, visit.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setPreviewVisit(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-shiphero-red to-red-600 px-6 py-4 text-white">
                <h2 className="text-xl font-display font-bold">{previewVisit.customerName || 'Summary Preview'}</h2>
                <div className="flex gap-4 text-sm text-white/80 mt-1">
                  <span>ID: {previewVisit.accountId}</span>
                  <span>ARR: {previewVisit.arr}</span>
                  <span>{format(new Date(previewVisit.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-gray-700 text-sm font-sans leading-relaxed">
                    {previewVisit.generatedSummary}
                  </pre>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  onClick={() => setPreviewVisit(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      handleDownloadPdf(e, previewVisit);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-shiphero-red text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={() => {
                      onLoadVisit(previewVisit);
                      setPreviewVisit(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-shiphero-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Open Full View
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

