import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Crown, Check, Sparkles } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';
import { useUser } from '../context/UserContext';

interface Props {
  open: boolean;
  onClose: () => void;
  featureName: string;
  requiredTier?: 'scholar' | 'premium' | 'elite';
  description?: string;
}

const TIER_META = {
  scholar: { label: 'Scholar', color: 'from-blue-500 to-blue-400', accent: 'text-blue-400' },
  premium: { label: 'Premium', color: 'from-cyan-500 to-blue-500', accent: 'text-cyan-400' },
  elite: { label: 'Elite', color: 'from-amber-500 to-orange-500', accent: 'text-amber-400' },
};

export const UpgradeModal: React.FC<Props> = ({ open, onClose, featureName, requiredTier = 'premium', description }) => {
  const { pricing, format, currency } = useCurrency();
  const { upgradeToPremium, uid } = useUser();
  const meta = TIER_META[requiredTier];
  const price = pricing[requiredTier];

  const handleUpgrade = () => {
    if (!uid) {
      onClose();
      const el = document.getElementById('premium-section');
      el?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    upgradeToPremium(requiredTier);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden border border-white/10 bg-[#0a0c14] shadow-2xl"
          >
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Gradient header */}
            <div className={`relative bg-gradient-to-br ${meta.color} px-6 pt-8 pb-12 overflow-hidden`}>
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl" />
              <div className="relative z-10 flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Premium feature</div>
                  <div className="text-xl font-black text-white leading-tight">{meta.label} plan</div>
                </div>
              </div>
              <p className="relative z-10 text-white/90 text-sm leading-relaxed">
                <strong>{featureName}</strong> {description || 'is part of our paid tiers — upgrade to unlock it.'}
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black text-white">{format(price)}</span>
                <span className="text-slate-500 text-sm">/ month</span>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-5 flex items-center gap-1.5">
                <span>{currency.flag}</span> Priced for {currency.country}
              </div>

              <ul className="space-y-2.5 mb-6">
                {(requiredTier === 'scholar'
                  ? ['Unlimited quizzes', 'AI Tutor chapter lessons', 'YouTube videos per topic', 'Advanced Lyra AI']
                  : requiredTier === 'premium'
                  ? ['Everything in Scholar', 'AI study plan generator', 'Personal evaluation engine', 'Daily parent reports', 'Priority AI response speed']
                  : ['Everything in Premium', 'WhatsApp parent reports', '1-on-1 advanced AI tutoring', 'Predictive exam AI', 'Early access to new features']
                ).map((line) => (
                  <li key={line} className="flex items-start gap-2.5 text-[12px] text-slate-300">
                    <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${meta.accent}`} />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                className={`w-full py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest bg-gradient-to-r ${meta.color} text-white shadow-lg hover:scale-[1.02] active:scale-[0.99] transition-transform flex items-center justify-center gap-2`}
              >
                <Sparkles className="w-4 h-4" />
                Upgrade to {meta.label}
              </button>
              <button
                onClick={onClose}
                className="w-full mt-2 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
