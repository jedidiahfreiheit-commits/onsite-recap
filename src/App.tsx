import { useState, useEffect } from 'react';
import { Settings, Plus, Loader2, ChevronRight, ArrowLeft, Building2, Hash, DollarSign, Mic, Square, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { OnsiteVisit, PromptData, Contact, ActionItem, Attachment, HealthScore, Tag, SellingOpportunity } from './types';
import { createEmptyVisit, saveVisit } from './services/storage';
import { initializeGemini, transcribeAudio, generateSummary, isGeminiConfigured } from './services/gemini';
import { loadGoogleAPIs, isGoogleDriveConfigured } from './services/googleDrive';

import { PromptFlow } from './components/PromptFlow';
import { ContactsSection } from './components/ContactsSection';
import { ActionItems } from './components/ActionItems';
import { SentimentIndicator } from './components/SentimentIndicator';
import { TagSelector } from './components/TagSelector';
import { FollowUpReminder } from './components/FollowUpReminder';
import { AttachmentsSection } from './components/AttachmentsSection';
import { SummaryOutput } from './components/SummaryOutput';
import { SavedVisits } from './components/SavedVisits';
import { ProgressTracker } from './components/ProgressTracker';

type Step = 'start' | 'customer-info' | 'prompts' | 'details' | 'summary';

// ShipHero Logo Icon Component
function ShipHeroLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img src="/shiphero-logo.png" alt="ShipHero" className={className} />
  );
}

// ShipHero Full Logo with Text Component
function ShipHeroFullLogo({ className = "h-20" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <img src="/shiphero-logo.png" alt="ShipHero" className="h-full w-auto" />
      <div className="flex items-baseline">
        <span className="text-5xl font-display font-semibold text-gray-800 tracking-tight">ship</span>
        <span className="text-5xl font-display font-semibold text-[#D96B6B] tracking-tight">hero</span>
        <span className="text-xl font-display text-gray-800 ml-0.5">™</span>
      </div>
    </div>
  );
}

export default function App() {
  const [visit, setVisit] = useState<OnsiteVisit>(createEmptyVisit);
  const [step, setStep] = useState<Step>('start');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [geminiKey, setGeminiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');
  const [googleClientId, setGoogleClientId] = useState('');

  // Customer info recording state
  const [isRecordingCustomer, setIsRecordingCustomer] = useState(false);
  const [customerRecordingTime, setCustomerRecordingTime] = useState(0);
  const [isTranscribingCustomer, setIsTranscribingCustomer] = useState(false);
  const [customerAudioUrl, setCustomerAudioUrl] = useState<string | null>(null);
  const [customerMediaRecorder, setCustomerMediaRecorder] = useState<MediaRecorder | null>(null);
  const [customerTimer, setCustomerTimer] = useState<number | null>(null);

  // Load saved API keys
  useEffect(() => {
    const savedGeminiKey = localStorage.getItem('gemini-api-key');
    const savedGoogleClientId = localStorage.getItem('google-client-id');
    
    // Use saved key, env variable, or fallback
    const FALLBACK_KEY = 'AIzaSyArvMV1CzC-9N6p_vFhQloFAYbKN88bUp8';
    const keyToUse = savedGeminiKey || import.meta.env.VITE_GEMINI_API_KEY || FALLBACK_KEY;
    if (keyToUse) {
      setGeminiKey(keyToUse);
      initializeGemini(keyToUse);
      console.log('Gemini initialized with key:', keyToUse.substring(0, 10) + '...');
    }
    
    if (savedGoogleClientId) {
      setGoogleClientId(savedGoogleClientId);
      loadGoogleAPIs(savedGoogleClientId).catch(console.error);
    }
  }, []);

  const handleSaveSettings = () => {
    if (geminiKey) {
      localStorage.setItem('gemini-api-key', geminiKey);
      initializeGemini(geminiKey);
    }
    if (googleClientId) {
      localStorage.setItem('google-client-id', googleClientId);
      loadGoogleAPIs(googleClientId).catch(console.error);
    }
    setShowSettings(false);
  };

  const updateVisit = (updates: Partial<OnsiteVisit>) => {
    setVisit(prev => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      saveVisit(updated);
      return updated;
    });
  };

  const updatePrompt = (index: number, updates: Partial<PromptData>) => {
    setVisit(prev => {
      const newPrompts = [...prev.prompts];
      newPrompts[index] = { ...newPrompts[index], ...updates };
      const updated = { ...prev, prompts: newPrompts, updatedAt: new Date().toISOString() };
      saveVisit(updated);
      return updated;
    });
  };

  const handleTranscribe = async (audioFile: File): Promise<string> => {
    if (!isGeminiConfigured()) {
      setShowSettings(true);
      throw new Error('Please configure your Gemini API key first');
    }
    return await transcribeAudio(audioFile);
  };

  // Customer info recording handlers
  const startCustomerRecording = async () => {
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
        setCustomerAudioUrl(audioUrl);
        stream.getTracks().forEach(track => track.stop());

        const file = new File([audioBlob], `customer-${Date.now()}.webm`, { type: 'audio/webm' });
        setIsTranscribingCustomer(true);
        try {
          const transcription = await transcribeAudio(file);
          updateVisit({ customerSummary: transcription });
        } catch (error) {
          console.error('Transcription failed:', error);
        } finally {
          setIsTranscribingCustomer(false);
        }
      };

      recorder.start();
      setCustomerMediaRecorder(recorder);
      setIsRecordingCustomer(true);
      setCustomerRecordingTime(0);

      const interval = window.setInterval(() => {
        setCustomerRecordingTime(prev => prev + 1);
      }, 1000);
      setCustomerTimer(interval);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone.');
    }
  };

  const stopCustomerRecording = () => {
    if (customerMediaRecorder && isRecordingCustomer) {
      customerMediaRecorder.stop();
      setIsRecordingCustomer(false);
      if (customerTimer) {
        clearInterval(customerTimer);
        setCustomerTimer(null);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNextPrompt = () => {
    if (currentPromptIndex < visit.prompts.length - 1) {
      setCurrentPromptIndex(prev => prev + 1);
    } else {
      setStep('details');
    }
  };

  const handlePreviousPrompt = () => {
    if (currentPromptIndex > 0) {
      setCurrentPromptIndex(prev => prev - 1);
    }
  };

  const handleGenerateSummary = async () => {
    if (!isGeminiConfigured()) {
      alert('Please configure your Gemini API key in Settings first.');
      setShowSettings(true);
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Starting summary generation...');
      const summary = await generateSummary(visit);
      console.log('Summary generated successfully!');
      updateVisit({ generatedSummary: summary });
      setStep('summary');
    } catch (error: any) {
      console.error('Failed to generate summary:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to generate summary: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewVisit = () => {
    const newVisit = createEmptyVisit();
    setVisit(newVisit);
    saveVisit(newVisit);
    setStep('start');
    setCurrentPromptIndex(0);
    setCustomerAudioUrl(null);
  };

  const handleLoadVisit = (loadedVisit: OnsiteVisit) => {
    setVisit(loadedVisit);
    setStep(loadedVisit.generatedSummary ? 'summary' : 'start');
    setCurrentPromptIndex(0);
    setCustomerAudioUrl(null);
  };

  const handleDriveUpload = (fileId: string) => {
    updateVisit({ driveFileId: fileId });
  };

  return (
    <div className="min-h-screen bg-[#EBEBEB]">
      {/* Background - matches ShipHero logo background */}
      <div className="fixed inset-0 bg-[#EBEBEB]" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-200 backdrop-blur-xl bg-white/80">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShipHeroLogo className="w-10 h-10" />
                <div>
                  <h1 className="text-2xl font-display font-bold">
                    <span className="text-gray-900">ship</span>
                    <span className="text-shiphero-red">hero</span>
                    <span className="text-gray-400 text-lg ml-2">Onsite Recap</span>
                  </h1>
                  <p className="text-sm text-gray-500">AI-Powered Visit Documentation</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {step !== 'start' && (
                  <button
                    onClick={handleNewVisit}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                    New
                  </button>
                )}
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors text-gray-600"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Progress Tracker */}
        <ProgressTracker
          currentStep={step}
          promptsCompleted={visit.prompts.filter(p => p.audioUrl || p.textInput || p.transcription).length}
          totalPrompts={visit.prompts.length}
          hasCustomerInfo={!!(visit.customerName || visit.customerSummary)}
          hasDetails={!!(visit.contacts.length > 0 || visit.actionItems.length > 0 || visit.tags.length > 0)}
        />

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {/* START SCREEN */}
            {step === 'start' && (
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <SavedVisits onLoadVisit={handleLoadVisit} currentVisitId={visit.id} />

                <div className="text-center py-16">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex justify-center mb-12"
                  >
                    <ShipHeroFullLogo className="h-16 md:h-20" />
                  </motion.div>
                  
                  <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">
                    Onsite Visit Recap
                  </h2>
                  <p className="text-xl text-gray-500 mb-12 max-w-lg mx-auto">
                    Answer a few questions about your customer visit and let AI create a comprehensive summary.
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep('customer-info')}
                    className="inline-flex items-center gap-3 px-10 py-4 bg-[#E85A5A] hover:bg-red-600 rounded-2xl font-display font-semibold text-white text-xl shadow-xl shadow-[#E85A5A]/20 transition-all"
                  >
                    Start Recap
                    <ChevronRight className="w-6 h-6" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* CUSTOMER INFO */}
            {step === 'customer-info' && (
              <motion.div
                key="customer-info"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="min-h-[70vh] flex flex-col"
              >
                <button
                  onClick={() => setStep('start')}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900 mb-4">
                    Tell me about the customer
                  </h2>
                  <p className="text-gray-500 text-lg">
                    Start by giving me some context about who you visited
                  </p>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center">
                  {isTranscribingCustomer ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-32 h-32 rounded-full bg-shiphero-red/20 flex items-center justify-center">
                        <Loader2 className="w-12 h-12 text-shiphero-red animate-spin" />
                      </div>
                      <p className="text-shiphero-red font-medium">Processing...</p>
                    </div>
                  ) : isRecordingCustomer ? (
                    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
                      {/* Customer info reminder - stays visible during recording */}
                      <div className="w-full bg-white rounded-2xl p-5 border-2 border-shiphero-red/30 shadow-lg">
                        <p className="text-xs text-shiphero-red font-semibold uppercase tracking-wide mb-3">Tell me about this customer:</p>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Customer</p>
                            <p className="font-semibold text-gray-900">{visit.customerName || '(Not entered)'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Account ID</p>
                            <p className="font-semibold text-gray-900">{visit.accountId || '(Not entered)'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">ARR</p>
                            <p className="font-semibold text-gray-900">{visit.arr || '(Not entered)'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                          Describe who they are, their business, and your relationship
                        </p>
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={stopCustomerRecording}
                        className="w-28 h-28 rounded-full bg-shiphero-red hover:bg-red-600 flex items-center justify-center shadow-xl shadow-shiphero-red/30 transition-colors relative"
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full border-4 border-shiphero-red"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                        <Square className="w-10 h-10 text-white fill-current" />
                      </motion.button>
                      
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl font-mono text-gray-900">{formatTime(customerRecordingTime)}</span>
                        <p className="text-gray-500 text-lg">Tap the button when you're done</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startCustomerRecording}
                        className="w-32 h-32 rounded-full bg-shiphero-red hover:bg-red-600 flex items-center justify-center shadow-xl shadow-shiphero-red/30 transition-all"
                      >
                        <Mic className="w-12 h-12 text-white" />
                      </motion.button>
                      <p className="text-gray-600 text-lg">Tap to record</p>
                      <p className="text-gray-500 text-sm text-center max-w-md">
                        Include the customer name, account ID, ARR, and any relevant context about your relationship
                      </p>

                      {customerAudioUrl && (
                        <div className="flex items-center gap-2 text-green-600 mt-4">
                          <Check className="w-5 h-5" />
                          <span>Recording captured</span>
                        </div>
                      )}

                      <div className="w-full space-y-4 mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
                              <Building2 className="w-3.5 h-3.5" />
                              CUSTOMER NAME
                            </label>
                            <input
                              type="text"
                              value={visit.customerName}
                              onChange={(e) => updateVisit({ customerName: e.target.value })}
                              placeholder="Acme Corp"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
                              <Hash className="w-3.5 h-3.5" />
                              ACCOUNT ID
                            </label>
                            <input
                              type="text"
                              value={visit.accountId}
                              onChange={(e) => updateVisit({ accountId: e.target.value })}
                              placeholder="ACC-12345"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20"
                            />
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
                              <DollarSign className="w-3.5 h-3.5" />
                              ARR
                            </label>
                            <input
                              type="text"
                              value={visit.arr}
                              onChange={(e) => updateVisit({ arr: e.target.value })}
                              placeholder="$100,000"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20"
                            />
                          </div>
                        </div>

                        <textarea
                          value={visit.customerSummary}
                          onChange={(e) => updateVisit({ customerSummary: e.target.value })}
                          placeholder="Or type notes about the customer..."
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shiphero-blue focus:ring-1 focus:ring-shiphero-blue/20 resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setStep('prompts'); setCurrentPromptIndex(0); }}
                    className="flex items-center gap-2 px-8 py-3 bg-shiphero-red hover:bg-red-600 rounded-xl font-semibold text-white shadow-lg shadow-shiphero-red/20"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* PROMPTS */}
            {step === 'prompts' && (
              <motion.div
                key="prompts"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="flex items-center justify-between mb-8">
                  <button
                    onClick={() => currentPromptIndex === 0 ? setStep('customer-info') : handlePreviousPrompt()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  {/* Generate Summary button - always available */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-4 py-2 bg-shiphero-red/10 hover:bg-shiphero-red/20 text-shiphero-red rounded-lg transition-colors text-sm font-medium"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Generate Summary Now
                      </>
                    )}
                  </motion.button>
                </div>

                <PromptFlow
                  prompts={visit.prompts}
                  currentIndex={currentPromptIndex}
                  onUpdatePrompt={updatePrompt}
                  onNext={handleNextPrompt}
                  onPrevious={handlePreviousPrompt}
                  onSkip={handleNextPrompt}
                  onTranscribe={handleTranscribe}
                  sellingOpportunities={visit.sellingOpportunities}
                  onUpdateSellingOpportunities={(opportunities: SellingOpportunity[]) => updateVisit({ sellingOpportunities: opportunities })}
                />
              </motion.div>
            )}

            {/* DETAILS */}
            {step === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => { setStep('prompts'); setCurrentPromptIndex(visit.prompts.length - 1); }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to questions
                  </button>
                </div>

                {/* Generate Summary - Primary CTA at top */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-shiphero-red to-red-600 rounded-2xl p-6 text-white shadow-xl"
                >
                  <h2 className="text-2xl font-display font-bold mb-2">Ready to generate your summary?</h2>
                  <p className="text-white/80 mb-4">You can add optional details below, or generate now with what you have.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="px-8 py-3 bg-white text-shiphero-red rounded-xl font-semibold shadow-lg hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Generate Summary Now
                      </>
                    )}
                  </motion.button>
                </motion.div>

                <div className="text-center">
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-1">
                    Optional: Add More Details
                  </h3>
                  <p className="text-gray-500 text-sm">
                    These sections are optional and will enrich your summary if filled in
                  </p>
                </div>

                {/* Quick sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SentimentIndicator
                    value={visit.healthScore}
                    onChange={(value: HealthScore) => updateVisit({ healthScore: value })}
                  />
                  <TagSelector
                    selectedTags={visit.tags}
                    onChange={(tags: Tag[]) => updateVisit({ tags })}
                  />
                </div>

                <ContactsSection
                  contacts={visit.contacts}
                  onUpdate={(contacts: Contact[]) => updateVisit({ contacts })}
                />

                <ActionItems
                  items={visit.actionItems}
                  onUpdate={(items: ActionItem[]) => updateVisit({ actionItems: items })}
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <FollowUpReminder
                    date={visit.followUpDate}
                    notes={visit.followUpNotes}
                    onDateChange={(date) => updateVisit({ followUpDate: date })}
                    onNotesChange={(notes) => updateVisit({ followUpNotes: notes })}
                  />
                  <AttachmentsSection
                    attachments={visit.attachments}
                    onUpdate={(attachments: Attachment[]) => updateVisit({ attachments })}
                  />
                </div>

                {/* Generate Summary - Secondary button at bottom */}
                <div className="pt-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="w-full py-4 bg-shiphero-red hover:bg-red-600 rounded-xl font-semibold text-white shadow-lg shadow-shiphero-red/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating Summary...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Generate Summary
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* SUMMARY */}
            {step === 'summary' && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <button
                  onClick={() => setStep('details')}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to details
                </button>

                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex p-4 rounded-2xl bg-green-100 mb-4"
                  >
                    <Check className="w-10 h-10 text-green-600" />
                  </motion.div>
                  <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
                    Your Summary is Ready
                  </h2>
                  <p className="text-gray-500">
                    {visit.customerName && `Onsite visit with ${visit.customerName}`}
                  </p>
                </div>

                <SummaryOutput visit={visit} onDriveUpload={handleDriveUpload} />

                <div className="flex justify-center">
                  <button
                    onClick={handleNewVisit}
                    className="flex items-center gap-2 px-8 py-3 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Start New Visit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5 text-shiphero-red" />
                Settings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Gemini API Key</label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIza..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shiphero-blue"
                  />
                  <p className="text-xs text-gray-500 mt-1">Required for transcription and summaries</p>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Google OAuth Client ID</label>
                  <input
                    type="text"
                    value={googleClientId}
                    onChange={(e) => setGoogleClientId(e.target.value)}
                    placeholder="xxxxx.apps.googleusercontent.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-shiphero-blue"
                  />
                  <p className="text-xs text-gray-500 mt-1">Required for Google Drive</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 px-4 py-3 bg-shiphero-red hover:bg-red-600 rounded-xl text-white font-medium transition-colors"
                >
                  Save
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isGeminiConfigured() ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={isGeminiConfigured() ? 'text-green-600' : 'text-gray-500'}>
                    Gemini AI {isGeminiConfigured() ? 'Connected' : 'Not configured'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${isGoogleDriveConfigured() ? 'bg-green-500' : 'bg-gray-400'}`} />
                  <span className={isGoogleDriveConfigured() ? 'text-green-600' : 'text-gray-500'}>
                    Google Drive {isGoogleDriveConfigured() ? 'Ready' : 'Not configured'}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
