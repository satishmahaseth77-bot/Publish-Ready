import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Cpu, Zap, Activity, Brain, BookOpen, Atom, FlaskConical, Telescope, Calculator, Dna, Star, Lightbulb, Target, Trophy, X } from 'lucide-react';

const MESSAGES = [
  { text: "Hey! Want to explore a new topic? Tap a chapter to begin.", icon: Sparkles, color: 'cyan' },
  { text: "Hello! I am Astra — your neural learning companion. Speed: 1 THz, Memory: 1 ZB.", icon: Cpu, color: 'blue' },
  { text: "Neuro intelligence mode activated. Ready to learn something incredible?", icon: Brain, color: 'purple' },
  { text: "Did you know? The human brain has ~86 billion neurons. Let's use them!", icon: Dna, color: 'pink' },
  { text: "Light travels 299,792 km per second. Your curiosity travels faster.", icon: Zap, color: 'yellow' },
  { text: "Fun fact: There are more atoms in a grain of sand than stars in the Milky Way.", icon: Atom, color: 'green' },
  { text: "Today's goal: Understand one new concept deeper than yesterday.", icon: Target, color: 'orange' },
  { text: "Chemistry tip: Oxidation loses electrons, Reduction gains. Remember OIL RIG!", icon: FlaskConical, color: 'emerald' },
  { text: "The universe is 13.8 billion years old. You have your whole life to learn it.", icon: Telescope, color: 'indigo' },
  { text: "Math is the language of the universe — every formula tells a story.", icon: Calculator, color: 'violet' },
  { text: "Have a doubt? Use the Doubt Solver — Astra answers in seconds.", icon: Lightbulb, color: 'amber' },
  { text: "Your brain rewires itself every time you learn. You're literally changing right now.", icon: Activity, color: 'rose' },
  { text: "Quiz yourself after reading — recall is 3x more effective than re-reading!", icon: BookOpen, color: 'teal' },
  { text: "A photon takes 8 minutes to reach Earth from the Sun. Science is everywhere!", icon: Star, color: 'yellow' },
  { text: "You've been studying for a while. Take a 5-minute break — it helps retention!", icon: Trophy, color: 'amber' },
  { text: "DNA stands for Deoxyribonucleic Acid. It fits 3 billion base pairs in every cell.", icon: Dna, color: 'pink' },
  { text: "Newton's first law: A curious mind in motion stays in motion.", icon: Zap, color: 'cyan' },
  { text: "The periodic table has 118 elements. You don't need to memorize all — just understand them.", icon: Atom, color: 'blue' },
  { text: "Black holes aren't empty — they're the densest objects in the universe. Mind-blowing!", icon: Telescope, color: 'purple' },
  { text: "AI Tutor is waiting! Select a chapter and get a lesson tailored just for you.", icon: Brain, color: 'green' },
];

const COLOR_MAP: Record<string, { border: string; shadow: string; icon: string; bg: string }> = {
  cyan:    { border: 'border-cyan-500/40',    shadow: 'shadow-cyan-500/20',    icon: 'text-cyan-400',    bg: 'bg-cyan-500/10' },
  blue:    { border: 'border-blue-500/40',    shadow: 'shadow-blue-500/20',    icon: 'text-blue-400',    bg: 'bg-blue-500/10' },
  purple:  { border: 'border-purple-500/40',  shadow: 'shadow-purple-500/20',  icon: 'text-purple-400',  bg: 'bg-purple-500/10' },
  pink:    { border: 'border-pink-500/40',    shadow: 'shadow-pink-500/20',    icon: 'text-pink-400',    bg: 'bg-pink-500/10' },
  yellow:  { border: 'border-yellow-500/40',  shadow: 'shadow-yellow-500/20',  icon: 'text-yellow-400',  bg: 'bg-yellow-500/10' },
  green:   { border: 'border-green-500/40',   shadow: 'shadow-green-500/20',   icon: 'text-green-400',   bg: 'bg-green-500/10' },
  orange:  { border: 'border-orange-500/40',  shadow: 'shadow-orange-500/20',  icon: 'text-orange-400',  bg: 'bg-orange-500/10' },
  emerald: { border: 'border-emerald-500/40', shadow: 'shadow-emerald-500/20', icon: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  indigo:  { border: 'border-indigo-500/40',  shadow: 'shadow-indigo-500/20',  icon: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
  violet:  { border: 'border-violet-500/40',  shadow: 'shadow-violet-500/20',  icon: 'text-violet-400',  bg: 'bg-violet-500/10' },
  amber:   { border: 'border-amber-500/40',   shadow: 'shadow-amber-500/20',   icon: 'text-amber-400',   bg: 'bg-amber-500/10' },
  rose:    { border: 'border-rose-500/40',    shadow: 'shadow-rose-500/20',    icon: 'text-rose-400',    bg: 'bg-rose-500/10' },
  teal:    { border: 'border-teal-500/40',    shadow: 'shadow-teal-500/20',    icon: 'text-teal-400',    bg: 'bg-teal-500/10' },
};

export const GlobalPopups: React.FC<{ isChatOpen?: boolean; isTutorOpen?: boolean }> = ({ isChatOpen, isTutorOpen }) => {
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [dismissed, setDismissed] = useState(false);
  const suppress = !!(isChatOpen || isTutorOpen);

  useEffect(() => {
    if (suppress) {
      setCurrentIdx(-1);
      return;
    }

    const show = () => {
      if (Math.random() > 0.35) {
        setDismissed(false);
        setCurrentIdx(Math.floor(Math.random() * MESSAGES.length));
        setTimeout(() => setCurrentIdx(-1), 7000);
      }
    };

    const initial = setTimeout(show, 4000);
    const interval = setInterval(show, 18000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, [suppress]);

  if (suppress) return null;

  const msg = currentIdx >= 0 ? MESSAGES[currentIdx] : null;
  const colors = msg ? (COLOR_MAP[msg.color] || COLOR_MAP.cyan) : null;

  return (
    <div className="fixed bottom-36 right-4 md:right-10 flex flex-col gap-4 z-[200]">
      <AnimatePresence>
        {msg && !dismissed && colors && (
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, x: 60, scale: 0.88 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`bg-black/95 backdrop-blur-2xl border ${colors.border} text-white px-5 py-4 rounded-2xl shadow-2xl ${colors.shadow} flex items-start gap-3 max-w-[280px] md:max-w-sm pointer-events-auto`}
          >
            <div className={`w-8 h-8 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center flex-shrink-0 mt-0.5`}>
              {React.createElement(msg.icon, { className: `${colors.icon} w-4 h-4` })}
            </div>
            <p className="text-sm font-medium leading-relaxed text-slate-200 flex-1">
              {msg.text}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); setDismissed(true); setCurrentIdx(-1); }}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-red-500/30 border border-white/15 hover:border-red-500/50 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
