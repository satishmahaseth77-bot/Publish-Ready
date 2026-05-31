import React, { useState } from 'react';
import { Menu, X, Brain, Volume2, User as UserIcon, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileNavProps {
  onOpenTutor: () => void;
  onOpenVoice: () => void;
  onOpenProfile: () => void;
  onOpenInfo: () => void;
  displayName?: string | null;
  photoURL?: string | null;
  isPremium?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenTutor,
  onOpenVoice,
  onOpenProfile,
  onOpenInfo,
  displayName,
  photoURL,
  isPremium,
}) => {
  const [open, setOpen] = useState(false);

  const action = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden touch-target p-2.5 rounded-xl bg-white/5 border border-white/10 text-white"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm md:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-[1101] w-[min(320px,88vw)] bg-[#08090e] border-l border-white/10 flex flex-col md:hidden"
              style={{ paddingTop: 'max(16px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Menu</span>
                <button onClick={() => setOpen(false)} className="touch-target p-2 rounded-lg text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => action(onOpenProfile)}
                className="mx-4 mt-4 flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-left"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                  {photoURL ? (
                    <img src={photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{displayName?.split(' ')[0] || 'Sign In / Member'}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Profile & Login</p>
                </div>
              </button>

              <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {[
                  { label: 'Quiz', href: '#evaluation-quiz' },
                  { label: 'Cosmos', href: '#cosmos-section' },
                  { label: 'Anatomy', href: '#anatomy-section' },
                  { label: 'Sciences', href: '#study-hub' },
                  { label: 'Premium', href: '#premium-section' },
                ].map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-400 hover:text-white hover:bg-white/5"
                  >
                    {link.label}
                  </a>
                ))}

                <button
                  onClick={() => action(onOpenTutor)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300"
                >
                  <Brain className="w-4 h-4" />
                  <span className="text-sm font-black uppercase tracking-wider">AI Tutor</span>
                  {isPremium && <span className="ml-auto w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />}
                </button>

                <button
                  onClick={() => action(onOpenVoice)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600/20 to-violet-600/20 border border-blue-500/30 text-white"
                >
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-black uppercase tracking-wider">Talk with Astra</span>
                </button>

                <button
                  onClick={() => action(onOpenInfo)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">Info</span>
                </button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
