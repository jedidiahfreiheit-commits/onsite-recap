import { useState } from 'react';
import { Copy, Check, Download, Cloud, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { OnsiteVisit } from '../types';
import { uploadPdfToDrive, getDriveFileUrl, isSignedIn, signIn } from '../services/googleDrive';
import { saveVisit } from '../services/storage';

interface SummaryOutputProps {
  visit: OnsiteVisit;
  onDriveUpload: (fileId: string) => void;
}

export function SummaryOutput({ visit, onDriveUpload }: SummaryOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(visit.generatedSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generatePdf = (): jsPDF => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Onsite Visit Summary', margin, 25);
    
    // Customer info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Customer: ${visit.customerName}`, margin, 40);
    pdf.text(`Account ID: ${visit.accountId}`, margin, 48);
    pdf.text(`ARR: ${visit.arr}`, margin, 56);
    pdf.text(`Date: ${new Date(visit.createdAt).toLocaleDateString()}`, margin, 64);
    
    // Divider
    pdf.setDrawColor(200);
    pdf.line(margin, 70, pageWidth - margin, 70);
    
    // Summary content
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(visit.generatedSummary, maxWidth);
    let y = 80;
    
    for (const line of lines) {
      if (y > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, margin, y);
      y += 6;
    }
    
    return pdf;
  };

  const handleDownloadPdf = () => {
    const pdf = generatePdf();
    const fileName = `onsite-recap-${visit.customerName || 'visit'}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const handleUploadToDrive = async () => {
    if (!isSignedIn()) {
      try {
        await signIn();
      } catch (error) {
        console.error('Failed to sign in:', error);
        alert('Failed to sign in to Google. Please try again.');
        return;
      }
    }

    setIsUploading(true);
    try {
      const pdf = generatePdf();
      const pdfBlob = pdf.output('blob');
      const fileName = `onsite-recap-${visit.customerName || 'visit'}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      const fileId = await uploadPdfToDrive(fileName, pdfBlob);
      onDriveUpload(fileId);
      
      // Save the updated visit with Drive file ID
      saveVisit({ ...visit, driveFileId: fileId });
      
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to upload to Drive:', error);
      alert('Failed to upload to Google Drive. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!visit.generatedSummary) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
        <p className="text-gray-500 text-center">No summary generated yet.</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-display font-bold text-gray-900">Generated Summary</h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              copied 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleUploadToDrive}
            disabled={isUploading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              uploadSuccess
                ? 'bg-green-100 text-green-600'
                : 'bg-shiphero-blue/10 hover:bg-shiphero-blue/20 text-shiphero-blue'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : uploadSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Cloud className="w-4 h-4" />
            )}
            {uploadSuccess ? 'Saved!' : 'Save to Drive'}
          </motion.button>
        </div>
      </div>

      {visit.driveFileId && (
        <div className="mb-4 p-3 bg-shiphero-blue/10 rounded-lg border border-shiphero-blue/20">
          <a
            href={getDriveFileUrl(visit.driveFileId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-shiphero-blue hover:text-blue-700"
          >
            <ExternalLink className="w-4 h-4" />
            View in Google Drive
          </a>
        </div>
      )}

      <div className="prose max-w-none">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 max-h-[600px] overflow-y-auto">
          <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
            {visit.generatedSummary}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
