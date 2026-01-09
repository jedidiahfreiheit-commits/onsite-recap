import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, audioUrl: string) => void;
  isTranscribing?: boolean;
}

export function AudioRecorder({ onRecordingComplete, isTranscribing }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        onRecordingComplete(audioBlob, audioUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait">
        {isTranscribing ? (
          <motion.div
            key="transcribing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-2 px-4 py-2 bg-midnight-600 rounded-lg text-shiphero-red"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Transcribing...</span>
          </motion.div>
        ) : isRecording ? (
          <motion.button
            key="stop"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-400 rounded-lg transition-colors"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Square className="w-5 h-5 fill-current" />
            </motion.div>
            <span className="text-sm font-medium text-white">{formatTime(recordingTime)}</span>
          </motion.button>
        ) : (
          <motion.button
            key="record"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 bg-midnight-600 hover:bg-midnight-700 border border-midnight-600 hover:border-shiphero-red/50 rounded-lg transition-all group"
          >
            <Mic className="w-5 h-5 text-gray-400 group-hover:text-shiphero-red transition-colors" />
            <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Record</span>
          </motion.button>
        )}
      </AnimatePresence>

      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-coral-400 rounded-full"
              animate={{
                height: [8, 20, 8],
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
}

