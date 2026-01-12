import { useState } from 'react';
import { Copy, Check, Download, FileText, Cloud, ExternalLink, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import { OnsiteVisit } from '../types';
import { uploadPdfToDrive, getDriveFileUrl, isSignedIn, signIn } from '../services/googleDrive';
import { saveVisit } from '../services/storage';

interface SummaryOutputProps {
  visit: OnsiteVisit;
  onDriveUpload: (fileId: string) => void;
}

// Parse markdown to styled HTML
function parseMarkdown(text: string): string {
  if (!text) return '';
  
  let html = text
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4 border-b-2 border-shiphero-red pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Checkboxes
    .replace(/^- \[ \] (.+)$/gm, '<div class="flex items-start gap-3 my-2"><span class="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5"></span><span>$1</span></div>')
    .replace(/^- \[x\] (.+)$/gm, '<div class="flex items-start gap-3 my-2"><span class="w-5 h-5 bg-green-500 rounded flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs">✓</span><span class="line-through text-gray-500">$1</span></div>')
    // Bullet points
    .replace(/^- (.+)$/gm, '<div class="flex items-start gap-3 my-2"><span class="w-2 h-2 bg-shiphero-red rounded-full flex-shrink-0 mt-2"></span><span>$1</span></div>')
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex items-start gap-3 my-2"><span class="w-6 h-6 bg-shiphero-blue text-white rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold">$1</span><span>$1</span></div>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="my-4">')
    .replace(/\n/g, '<br/>');
  
  return `<p class="my-4">${html}</p>`;
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
    
    // Summary content - strip markdown for PDF
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
    
    return pdf;
  };

  const handleDownloadPdf = () => {
    const pdf = generatePdf();
    const fileName = `onsite-recap-${visit.customerName || 'visit'}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  const handleDownloadDoc = () => {
    // Create HTML content for the Word document
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Onsite Visit Summary - ${visit.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; }
          h1 { color: #ef5252; border-bottom: 2px solid #ef5252; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          h3 { color: #555; margin-top: 20px; }
          .header-info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .header-info p { margin: 5px 0; }
          ul { padding-left: 20px; }
          li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <h1>Onsite Visit Summary</h1>
        <div class="header-info">
          <p><strong>Customer:</strong> ${visit.customerName}</p>
          <p><strong>Account ID:</strong> ${visit.accountId}</p>
          <p><strong>ARR:</strong> ${visit.arr}</p>
          <p><strong>Date:</strong> ${new Date(visit.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="content">
          ${visit.generatedSummary
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^- \[ \] (.+)$/gm, '<p>☐ $1</p>')
            .replace(/^- \[x\] (.+)$/gm, '<p>☑ $1</p>')
            .replace(/^- (.+)$/gm, '<p>• $1</p>')
            .replace(/^(\d+)\. (.+)$/gm, '<p>$1. $2</p>')
            .replace(/\n\n/g, '<br/><br/>')
            .replace(/\n/g, '<br/>')}
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `onsite-recap-${visit.customerName || 'visit'}-${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  console.log('SummaryOutput render - generatedSummary:', visit.generatedSummary?.substring(0, 100));
  
  if (!visit.generatedSummary) {
    console.log('SummaryOutput: No summary found in visit');
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 shadow-lg text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 text-lg">No summary generated yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document-style summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
      >
        {/* Document header */}
        <div className="bg-gradient-to-r from-shiphero-red to-red-600 px-8 py-6 text-white">
          <h1 className="text-2xl font-display font-bold mb-2">Onsite Visit Summary</h1>
          <div className="flex flex-wrap gap-6 text-sm opacity-90">
            <span><strong>Customer:</strong> {visit.customerName}</span>
            <span><strong>Account ID:</strong> {visit.accountId}</span>
            <span><strong>ARR:</strong> {visit.arr}</span>
            <span><strong>Date:</strong> {new Date(visit.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {visit.driveFileId && (
          <div className="px-8 py-3 bg-shiphero-blue/10 border-b border-shiphero-blue/20">
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

        {/* Summary content */}
        <div 
          className="px-8 py-6 prose prose-gray max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(visit.generatedSummary) }}
        />
      </motion.div>

      {/* Export buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg"
      >
        <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Export Summary</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCopy}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              copied 
                ? 'bg-green-100 text-green-600 border-2 border-green-300' 
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-2 border-transparent'
            }`}
          >
            {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            <span className="font-medium text-sm">{copied ? 'Copied!' : 'Copy Text'}</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadPdf}
            className="flex flex-col items-center gap-2 p-4 bg-red-50 hover:bg-red-100 rounded-xl text-shiphero-red transition-all border-2 border-transparent hover:border-shiphero-red/30"
          >
            <Download className="w-6 h-6" />
            <span className="font-medium text-sm">Download PDF</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadDoc}
            className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-shiphero-blue transition-all border-2 border-transparent hover:border-shiphero-blue/30"
          >
            <FileText className="w-6 h-6" />
            <span className="font-medium text-sm">Download DOC</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUploadToDrive}
            disabled={isUploading}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 ${
              uploadSuccess
                ? 'bg-green-100 text-green-600 border-green-300'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-transparent hover:border-gray-300'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : uploadSuccess ? (
              <Check className="w-6 h-6" />
            ) : (
              <Cloud className="w-6 h-6" />
            )}
            <span className="font-medium text-sm">{uploadSuccess ? 'Saved!' : 'Save to Drive'}</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
