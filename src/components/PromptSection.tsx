import { useState } from 'react';
import { ChevronDown, Play, Pause, Trash2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioRecorder } from './AudioRecorder';
import { FileUpload } from './FileUpload';
import { PromptData } from '../types';

interface PromptSectionProps {
  prompt: PromptData;
  onUpdate: (updates: Partial<PromptData>) => void;
  onTranscribe: (audioFile: File) => Promise<string>;
  index: number;
}

export function PromptSection({ prompt, onUpdate, onTranscribe, index }: PromptSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleRecordingComplete = async (audioBlob: Blob, audioUrl: string) => {
    const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
    onUpdate({ audioFile: file, audioUrl });
    
    // Auto-transcribe
    setIsTranscribing(true);
    try {
      const transcription = await onTranscribe(file);
      onUpdate({ transcription });
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const audioUrl = URL.createObjectURL(file);
    onUpdate({ audioFile: file, audioUrl });
    
    // Auto-transcribe
    setIsTranscribing(true);
    try {
      const transcription = await onTranscribe(file);
      onUpdate({ transcription });
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePlayback = () => {
    if (!prompt.audioUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      const audio = new Audio(prompt.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const clearAudio = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    setIsPlaying(false);
    onUpdate({ audioFile: null, audioUrl: null, transcription: '' });
  };

  const hasContent = prompt.audioUrl || prompt.textInput || prompt.transcription;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-midnight-800 rounded-2xl border border-midnight-700 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-midnight-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
            hasContent 
              ? 'bg-sage-500/20 text-sage-400' 
              : 'bg-midnight-600 text-gray-400'
          }`}>
            {hasContent ? <Check className="w-4 h-4" /> : index + 1}
          </div>
          <h3 className="text-lg font-display font-semibold text-white">{prompt.title}</h3>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 space-y-4">
              {/* Prompt question */}
              <p className="text-gray-400 text-sm italic border-l-2 border-shiphero-red/50 pl-3">
                {prompt.prompt}
              </p>

              {/* Audio controls */}
              <div className="flex flex-wrap items-center gap-3">
                <AudioRecorder 
                  onRecordingComplete={handleRecordingComplete}
                  isTranscribing={isTranscribing}
                />
                
                {prompt.audioUrl && (
                  <>
                    <button
                      onClick={togglePlayback}
                      className="flex items-center gap-2 px-4 py-2 bg-shiphero-red/20 hover:bg-shiphero-red/30 rounded-lg transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-shiphero-red" />
                      ) : (
                        <Play className="w-4 h-4 text-shiphero-red" />
                      )}
                      <span className="text-sm text-shiphero-red">
                        {isPlaying ? 'Pause' : 'Play'}
                      </span>
                    </button>
                    <button
                      onClick={clearAudio}
                      className="p-2 text-gray-400 hover:text-coral-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* File upload */}
              {!prompt.audioUrl && (
                <FileUpload
                  onFileSelect={handleFileUpload}
                  acceptedTypes="audio/*"
                  label="Or drop an audio file here"
                />
              )}

              {/* Transcription display */}
              {prompt.transcription && (
                <div className="p-4 bg-midnight-700/50 rounded-xl border border-midnight-600">
                  <p className="text-xs text-shiphero-blue font-medium mb-2">TRANSCRIPTION</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{prompt.transcription}</p>
                </div>
              )}

              {/* Text input */}
              <div>
                <label className="block text-xs text-gray-500 font-medium mb-2">
                  OR TYPE YOUR NOTES
                </label>
                <textarea
                  value={prompt.textInput}
                  onChange={(e) => onUpdate({ textInput: e.target.value })}
                  placeholder="Type your notes here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-midnight-700 border border-midnight-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20 transition-all resize-none"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

