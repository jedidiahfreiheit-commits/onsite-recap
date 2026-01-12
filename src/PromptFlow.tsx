import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Mic, Square, Play, Pause, Trash2, Loader2, Check, SkipForward, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromptData, SellingOpportunity, SELLING_OPPORTUNITIES } from '../types';
import { createSpeechRecognition } from '../services/gemini';

const MAX_RECORDING_SECONDS = 300; // 5 minutes max recording time

interface PromptFlowProps {
  prompts: PromptData[];
  currentIndex: number;
  onUpdatePrompt: (index: number, updates: Partial<PromptData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onTranscribe: (audioFile: File) => Promise<string>;
  sellingOpportunities: SellingOpportunity[];
  onUpdateSellingOpportunities: (opportunities: SellingOpportunity[]) => void;
}

export function PromptFlow({
  prompts,
  currentIndex,
  onUpdatePrompt,
  onNext,
  onPrevious,
  onSkip,
  onTranscribe,
  sellingOpportunities,
  onUpdateSellingOpportunities,
}: PromptFlowProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Auto-stop recording at max time
  useEffect(() => {
    if (isRecording && recordingTime >= MAX_RECORDING_SECONDS) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        }
      }
    }
  }, [recordingTime, isRecording, timerInterval]);

  // Cleanup when navigating away (currentIndex changes)
  useEffect(() => {
    // Reset playback state when changing prompts
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }
    setLiveTranscript('');
  }, [currentIndex]);

  const currentPrompt = prompts[currentIndex];
  const hasContent = currentPrompt?.audioUrl || currentPrompt?.textInput || currentPrompt?.transcription;
  const completedCount = prompts.filter(p => p.audioUrl || p.textInput || p.transcription).length;
  const isSalesPrompt = currentPrompt?.title === 'Sales Opportunities';

  const toggleOpportunity = (opp: SellingOpportunity) => {
    if (sellingOpportunities.includes(opp)) {
      onUpdateSellingOpportunities(sellingOpportunities.filter(o => o !== opp));
    } else {
      onUpdateSellingOpportunities([...sellingOpportunities, opp]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const file = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
        
        onUpdatePrompt(currentIndex, { audioFile: file, audioUrl });
        stream.getTracks().forEach(track => track.stop());

        // Stop speech recognition
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        }

        // Use the live transcript we captured
        if (liveTranscript) {
          onUpdatePrompt(currentIndex, { transcription: liveTranscript });
        }
        setLiveTranscript('');
      };

      recorder.start();
      setMediaRecorder(recorder);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      setLiveTranscript('');

      // Start speech recognition for real-time transcription
      const recognition = createSpeechRecognition(
        (text) => {
          setLiveTranscript(text);
        },
        () => {
          // Recognition ended
        }
      );
      
      if (recognition) {
        speechRecognitionRef.current = recognition;
        recognition.start();
      }

      const interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please ensure microphone permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    onUpdatePrompt(currentIndex, { audioFile: file, audioUrl });

    setIsTranscribing(true);
    try {
      const transcription = await onTranscribe(file);
      onUpdatePrompt(currentIndex, { transcription });
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const togglePlayback = () => {
    if (!currentPrompt?.audioUrl) return;

    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      const audio = new Audio(currentPrompt.audioUrl);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setAudioElement(audio);
      setIsPlaying(true);
    }
  };

  const clearRecording = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    setIsPlaying(false);
    onUpdatePrompt(currentIndex, { audioFile: null, audioUrl: null, transcription: '' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Stop any active recording/playback before navigation
  const stopAllMedia = () => {
    // Stop recording if active
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    }
    // Stop playback if active
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }
  };

  const handleContinue = () => {
    stopAllMedia();
    onNext();
  };

  const handlePrevious = () => {
    stopAllMedia();
    onPrevious();
  };

  const handleSkip = () => {
    stopAllMedia();
    onSkip();
  };

  if (!currentPrompt) return null;

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">
            Question {currentIndex + 1} of {prompts.length}
          </span>
          <span className="text-sm text-shiphero-red">
            {completedCount} answered
          </span>
        </div>
        <div className="flex gap-2">
          {prompts.map((p, i) => (
            <div
              key={p.id}
              className={`h-2 flex-1 rounded-full transition-all ${
                i === currentIndex
                  ? 'bg-shiphero-red'
                  : p.audioUrl || p.textInput || p.transcription
                  ? 'bg-green-500'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main prompt area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPrompt.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {/* Prompt question */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-900 mb-3 leading-tight">
              {currentPrompt.prompt}
            </h2>
            <p className="text-gray-500 text-lg">
              {currentPrompt.title}
            </p>
          </div>

          {/* Selling Opportunities Selection - shown for Sales prompt */}
          {isSalesPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl mx-auto mb-8"
            >
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-shiphero-red" />
                  <h3 className="font-semibold text-gray-900">Select relevant products & services:</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(Object.keys(SELLING_OPPORTUNITIES) as SellingOpportunity[]).map((opp) => {
                    const isSelected = sellingOpportunities.includes(opp);
                    const { label } = SELLING_OPPORTUNITIES[opp];
                    return (
                      <button
                        key={opp}
                        onClick={() => toggleOpportunity(opp)}
                        className={`p-3 rounded-xl text-left transition-all border-2 ${
                          isSelected
                            ? 'bg-shiphero-red/10 border-shiphero-red text-shiphero-red'
                            : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                            isSelected ? 'bg-shiphero-red' : 'bg-gray-200'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className="font-medium text-sm">{label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {sellingOpportunities.length > 0 && (
                  <p className="mt-4 text-sm text-green-600 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    {sellingOpportunities.length} product{sellingOpportunities.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              <p className="text-center text-gray-500 text-sm mt-4">
                Now record or type details about why these would help the customer
              </p>
            </motion.div>
          )}

          {/* Recording / Input area */}
          <div className="flex-1 flex flex-col items-center justify-center">
            {isTranscribing ? (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="flex flex-col items-center gap-4"
              >
                <div className="w-32 h-32 rounded-full bg-shiphero-red/20 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-shiphero-red animate-spin" />
                </div>
                <p className="text-shiphero-red font-medium">Transcribing your response...</p>
              </motion.div>
            ) : currentPrompt.audioUrl ? (
              /* Playback controls */
              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlayback}
                    className="w-20 h-20 rounded-full bg-shiphero-red hover:bg-red-600 flex items-center justify-center shadow-xl shadow-shiphero-red/30 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-white" />
                    ) : (
                      <Play className="w-8 h-8 text-white ml-1" />
                    )}
                  </motion.button>
                  <button
                    onClick={clearRecording}
                    className="p-3 text-gray-400 hover:text-coral-400 transition-colors"
                    title="Delete recording"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>

                {currentPrompt.transcription && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-2xl w-full p-6 bg-white rounded-2xl border border-gray-200 shadow-sm"
                  >
                    <p className="text-xs text-shiphero-blue font-medium mb-2">YOUR RESPONSE</p>
                    <p className="text-gray-700 leading-relaxed">{currentPrompt.transcription}</p>
                  </motion.div>
                )}

                <div className="flex items-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Response recorded</span>
                </div>
              </div>
            ) : isRecording ? (
              /* Recording state - question stays visible */
              <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
                {/* Question reminder - always visible during recording */}
                <div className="w-full bg-white rounded-2xl p-6 border-2 border-shiphero-red/30 shadow-lg">
                  <p className="text-xs text-shiphero-red font-semibold uppercase tracking-wide mb-2">Answer this question:</p>
                  <p className="text-xl font-display font-semibold text-gray-900 leading-relaxed">
                    {currentPrompt.prompt}
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={stopRecording}
                  className="w-28 h-28 rounded-full bg-shiphero-red hover:bg-red-600 flex items-center justify-center shadow-xl shadow-shiphero-red/30 transition-colors relative"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-shiphero-red"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  <Square className="w-10 h-10 text-white fill-current" />
                </motion.button>
                
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[...Array(4)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-shiphero-red rounded-full"
                          animate={{ height: [12, 32, 12] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                    <span className="text-3xl font-mono text-gray-900">{formatTime(recordingTime)}</span>
                    <span className="text-gray-400">/ {formatTime(MAX_RECORDING_SECONDS)}</span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-shiphero-red"
                      initial={{ width: 0 }}
                      animate={{ width: `${(recordingTime / MAX_RECORDING_SECONDS) * 100}%` }}
                    />
                  </div>
                  <p className="text-gray-500">{formatTime(MAX_RECORDING_SECONDS - recordingTime)} remaining</p>
                  
                  {/* Live transcript */}
                  {liveTranscript && (
                    <div className="w-full bg-white/80 rounded-xl p-4 border border-gray-200 max-h-32 overflow-y-auto">
                      <p className="text-xs text-green-600 font-medium mb-1">Live transcription:</p>
                      <p className="text-gray-700 text-sm">{liveTranscript}</p>
                    </div>
                  )}
                  
                  <p className="text-gray-500 text-lg">Tap the button when you're done</p>
                </div>
              </div>
            ) : (
              /* Ready to record - simple and clear */
              <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startRecording}
                  className="w-36 h-36 rounded-full bg-shiphero-red hover:bg-red-600 flex items-center justify-center shadow-xl shadow-shiphero-red/30 transition-all"
                >
                  <Mic className="w-14 h-14 text-white" />
                </motion.button>
                <p className="text-gray-700 text-xl font-medium">Tap to start recording</p>

                <div className="w-full bg-white rounded-2xl p-4 border border-gray-200 shadow-sm mt-4">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <label className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors text-gray-600 hover:text-gray-800 text-sm">
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      Upload audio
                    </label>
                    <span className="text-gray-400 text-sm">or</span>
                    <button
                      onClick={() => document.getElementById(`text-input-${currentIndex}`)?.focus()}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Type instead
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Text input (always available) */}
            {!isRecording && !isTranscribing && (
              <div className="w-full max-w-2xl mt-8">
                <textarea
                  id={`text-input-${currentIndex}`}
                  value={currentPrompt.textInput}
                  onChange={(e) => onUpdatePrompt(currentIndex, { textInput: e.target.value })}
                  placeholder="Or type your notes here..."
                  rows={4}
                  className="w-full px-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20 transition-all resize-none text-lg shadow-sm"
                />
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          Skip
          <SkipForward className="w-4 h-4" />
        </button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleContinue}
          className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
            hasContent || currentIndex === prompts.length - 1
              ? 'bg-shiphero-red text-white shadow-lg shadow-shiphero-red/20'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
          }`}
        >
          {currentIndex === prompts.length - 1 ? 'Review & Generate' : 'Continue'}
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

