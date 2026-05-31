import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, Clock, Sparkles } from 'lucide-react';
import { AstraOrb, GeminiWave, GeminiGlow } from './AstraOrb';
import { useVoiceConversation } from '../hooks/useVoiceConversation';

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
        <div className="relative z-10 flex items-center justify-between px-2 sm:px-4 py-3 flex-shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white/50">Voice Link Active</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span className={timeLeft < 120 ? 'text-red-400' : 'text-cyan-400'}>
                {formatTime(timeLeft)} · Free 30 min session
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="touch-target p-3 rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all"
            aria-label="Close voice session"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Center orb */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 px-4">
          <div className="relative flex items-center justify-center w-full max-w-lg aspect-square max-h-[min(55vh,420px)]">
            <GeminiGlow state={orbState} size={420} />
            <AstraOrb state={orbState} size={280} />
          </div>

          <div className="w-full max-w-md mt-2 px-4">
            <GeminiWave state={orbState} width={360} height={56} />
          </div>

          {/* Status */}
          <div className="mt-6 text-center max-w-lg px-4 min-h-[100px]">
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
                <motion.div key="speak" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400/60">Astra is speaking</p>
                  <p className="text-white/85 text-base sm:text-lg font-medium leading-snug line-clamp-4">{lastAssistant}</p>
                </motion.div>
              ) : isListening ? (
                <motion.div key="listen" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-400/60">Listening</p>
                  <p className="text-cyan-300 text-xl sm:text-2xl font-bold italic">
                    {liveTranscript ? `"${liveTranscript}"` : "I'm listening..."}
                  </p>
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
