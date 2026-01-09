import { useRef } from 'react';
import { Upload, FileAudio } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string;
  label?: string;
}

export function FileUpload({ 
  onFileSelect, 
  acceptedTypes = 'audio/*',
  label = 'Drop audio file or click to upload'
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      className="relative border-2 border-dashed border-midnight-600 hover:border-shiphero-red/50 rounded-xl p-6 cursor-pointer transition-all group bg-midnight-800/30 hover:bg-midnight-700/30"
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="p-3 rounded-full bg-midnight-700 group-hover:bg-shiphero-red/20 transition-colors">
          {acceptedTypes.includes('audio') ? (
            <FileAudio className="w-6 h-6 text-gray-400 group-hover:text-shiphero-red transition-colors" />
          ) : (
            <Upload className="w-6 h-6 text-gray-400 group-hover:text-shiphero-red transition-colors" />
          )}
        </div>
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

