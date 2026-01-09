import { useState } from 'react';
import { Paperclip, X, FileText, Image, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Attachment } from '../types';
import { generateId } from '../services/storage';
import { FileUpload } from './FileUpload';

interface AttachmentsSectionProps {
  attachments: Attachment[];
  onUpdate: (attachments: Attachment[]) => void;
}

export function AttachmentsSection({ attachments, onUpdate }: AttachmentsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    const attachment: Attachment = {
      id: generateId(),
      name: file.name,
      type: file.type,
      url,
      size: file.size,
    };
    
    onUpdate([...attachments, attachment]);
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    const attachment = attachments.find(a => a.id === id);
    if (attachment) {
      URL.revokeObjectURL(attachment.url);
    }
    onUpdate(attachments.filter(a => a.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-midnight-800 rounded-2xl border border-midnight-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/20">
            <Paperclip className="w-5 h-5 text-pink-400" />
          </div>
          <h3 className="text-lg font-display font-semibold text-white">Attachments</h3>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-midnight-700 hover:bg-midnight-600 rounded-lg transition-colors text-gray-300 hover:text-white"
        >
          <Paperclip className="w-4 h-4" />
          Add File
        </button>
      </div>

      {/* Attachments grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <AnimatePresence>
          {attachments.map((attachment) => (
            <motion.div
              key={attachment.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-3 p-3 bg-midnight-700/50 rounded-lg border border-midnight-600 group"
            >
              <div className="p-2 rounded-lg bg-midnight-600 text-gray-400">
                {getFileIcon(attachment.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{attachment.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
              </div>
              <button
                onClick={() => handleRemove(attachment.id)}
                className="p-1.5 text-gray-500 hover:text-coral-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {attachments.length === 0 && !isAdding && (
        <p className="text-center text-gray-500 py-6">
          No attachments yet. Add photos, documents, or other files.
        </p>
      )}

      {/* File upload area */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedTypes="*/*"
              label="Drop any file here or click to upload"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

