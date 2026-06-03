import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Clock, Sparkles } from 'lucide-react';
import { AstraOrb, GeminiWave, GeminiGlow } from './AstraOrb';
import { useVoiceConversation } from '../hooks/useVoiceConversation';
import { useUser } from '../context/UserContext';

interface AstraVoiceProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const AstraVoice: React.FC<AstraVoiceProps> = ({ isOpen, onClose }) => {
  const {
    liveTranscript,
    transcriptHistory,
    isListening,
    isSpeaking,
    isThinking,
    phase,
    timeLeft,
    orbState,
    lastAssistant,
    startListening,
    stopAll,
    sessionExpired,
  } = useVoiceConversation(isOpen);
  const { studentProfile } = useUser();
  const studentName = studentProfile?.studentName?.trim();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    window.history.pushState({ astraVoice: true }, '');
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('popstate', onPop);
    };
  }, [isOpen, onClose]);

  const handleClose = () => {
    stopAll();
    onClose();
  };

  const trackerLabel = sessionExpired
    ? 'Session ended'
    : isThinking
    ? 'Processing...'
    : isSpeaking
    ? 'Astra is responding'
    : isListening
    ? 'Listening...'
    : 'Ready to listen';

  const trackerText = sessionExpired
    ? 'Session ended. Tap close and start a new voice link anytime — always free.'
    : isThinking
    ? 'Astra is building your response with deep contextual focus.'
    : isSpeaking
    ? 'Astra is speaking — delivering your answer now.'
    : isListening
    ? 'Speak clearly. Astra is capturing your words and will respond immediately.'
    : 'Tap the mic or say anything to begin. Astra can be interrupted while she speaks.';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex flex-col overflow-hidden"
        style={{
          paddingTop: 'max(16px, env(safe-area-inset-top))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(16px, env(safe-area-inset-left))',
          paddingRight: 'max(16px, env(safe-area-inset-right))',
        }}
      >
        {/* Animated aurora background */}
        <div className="absolute inset-0 bg-[#030308]">
          <motion.div
            animate={{
              background: [
                'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(66,133,244,0.35), transparent 60%)',
                'radial-gradient(ellipse 80% 60% at 80% 40%, rgba(155,114,203,0.35), transparent 60%)',
                'radial-gradient(ellipse 80% 60% at 50% 70%, rgba(236,72,153,0.3), transparent 60%)',
                'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(66,133,244,0.35), transparent 60%)',
              ],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vmax] h-[140vmax] opacity-30"
            style={{
              background: 'conic-gradient(from 0deg, #4285f4, #9b72cb, #ec4899, #f59e0b, #22d3ee, #4285f4)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex flex-col gap-3 px-2 sm:px-4 py-3 flex-shrink-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50">Voice Link Active</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-cyan-400">
              <Clock className="w-3 h-3" />
              <span className={timeLeft < 120 ? 'text-red-400' : 'text-cyan-400'}>
                {formatTime(timeLeft)} · Free 30 min session
              </span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-xl">
              {studentName ? `Astra is your premium voice mentor, tailored for ${studentName}.` : 'Astra is your premium voice mentor. Emotionally intelligent and ready to help.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="p-3 rounded-2xl text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              aria-label="Close Astra Voice"
              title="Close Astra Voice"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={handleClose}
              className="astro-terminate-btn touch-target inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-white transition-all"
              aria-label="Terminate voice session and close Astra Voice"
            >
              <X className="w-4 h-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em]">Terminate</span>
            </button>
          </div>
        </div>

        {/* Center orb */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 px-4">
          <div className="relative flex items-center justify-center w-full max-w-[min(280px,100%)] aspect-square max-h-[min(35vh,240px)] mx-auto">
            <GeminiGlow state={orbState} size={240} />
            <AstraOrb state={orbState} size={170} />
          </div>

          <div className="w-full max-w-[min(280px,100%)] mt-4 px-4 mx-auto">
            <GeminiWave state={orbState} width={260} height={48} />
          </div>

          {/* Status */}
          <div className="mt-6 text-center max-w-lg px-4 min-h-[120px]">
            <div className="astra-voice-tracker" role="status" aria-live="polite">
              <p className="astra-voice-tracker-label">{trackerLabel}</p>
              <p className="astra-voice-tracker-text">{trackerText}</p>
            </div>

            <AnimatePresence mode="wait">
              {sessionExpired ? (
                <motion.p key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm font-medium">
                  Session ended. Tap close and start a new voice link anytime — always free.
                </motion.p>
              ) : isThinking ? (
                <motion.div key="think" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-violet-400/70 flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 animate-spin" /> {phase}
                  </p>
                </motion.div>
              ) : isSpeaking ? (
                <motion.div key="speak" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400/60">Astra is speaking</p>
                  <div className="min-h-[6rem] flex items-center">
                    <p className="text-white/90 text-base sm:text-lg font-medium leading-relaxed break-words text-center max-w-2xl px-4">
                      {lastAssistant}
                    </p>
                  </div>
                </motion.div>
              ) : isListening ? (
                <motion.div key="listen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3 max-w-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-400/60">Listening</p>
                  <div className="min-h-[4.5rem] flex flex-col items-center justify-center gap-2">
                    {transcriptHistory.length > 0 ? (
                      transcriptHistory.map((line, idx) => (
                        <motion.p
                          key={`${line}-${idx}`}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25, delay: idx * 0.05 }}
                          className={`text-center max-w-xl px-4 break-words leading-relaxed ${idx === 0 ? 'text-cyan-300 text-lg sm:text-xl font-semibold' : 'text-slate-400/80 text-sm'}`}
                          style={{ opacity: 1 - idx * 0.2 }}
                        >
                          {idx === 0 ? `"${liveTranscript || line}"` : line}
                        </motion.p>
                      ))
                    ) : (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0.3, y: 4 }}
                        transition={{ duration: 0.2 }}
                        className="text-cyan-300 text-lg sm:text-xl font-bold italic break-words leading-relaxed text-center max-w-xl px-4"
                      >
                        {liveTranscript ? `"${liveTranscript}"` : "I'm listening..."}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <p className="text-white/50 text-sm">Speak naturally — Astra responds with voice</p>
                  {!sessionExpired && (
                    <button
                      onClick={startListening}
                      className="touch-target mx-auto flex flex-col items-center gap-3 group"
                    >
                      <motion.div
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        className="w-16 h-16 rounded-full border-2 border-cyan-400/40 bg-gradient-to-br from-blue-600/30 to-violet-600/30 flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.35)]"
                      >
                        <Mic className="w-7 h-7 text-cyan-300" />
                      </motion.div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 group-hover:text-white/70">Tap to speak</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer indicators */}
        <div className="relative z-10 flex items-center justify-center gap-8 pb-4 text-[9px] font-black uppercase tracking-widest text-slate-600">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' : 'bg-slate-800'}`} /> Output
          </span>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-400 shadow-[0_0_8px_#f87171]' : 'bg-slate-800'}`} /> Input
          </span>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isThinking ? 'bg-violet-400 shadow-[0_0_8px_#a78bfa]' : 'bg-slate-800'}`} /> Neural
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
