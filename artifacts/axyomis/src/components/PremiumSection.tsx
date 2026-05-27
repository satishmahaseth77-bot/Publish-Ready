import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, Crown, Star, BarChart3, Video, Sparkles, GraduationCap, Clock, Bell, Shield, Timer, Zap } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useCurrency } from '../hooks/useCurrency';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Spark',
    price: 0,
    period: 'forever',
    tagline: 'Start your journey',
    color: 'border-white/10',
    glow: '',
    badge: null,
    accentColor: 'text-slate-400',
    btnClass: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
    features: [
      { text: 'Wiki topic cards (all 7 subjects)', available: true },
      { text: '5 quizzes per day', available: true },
      { text: 'Basic Lyra AI chat', available: true },
      { text: '3D anatomy & cosmos viewer', available: true },
      { text: 'Class-level adaptive content', available: false, comingSoon: false },
      { text: 'AI Tutor with chapter lessons', available: false },
      { text: 'YouTube video compilation per topic', available: false },
      { text: 'AI chapter summaries', available: false },
      { text: 'Study plan generator', available: false },
      { text: 'Daily parent report', available: false },
    ],
  },
  {
    id: 'scholar' as const,
    name: 'Scholar',
    price: 4.99,
    period: 'month',
    tagline: 'Unlock intelligent learning',
    color: 'border-blue-500/40',
    glow: 'shadow-blue-500/20',
    badge: null,
    accentColor: 'text-blue-400',
    btnClass: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20',
    features: [
      { text: 'Everything in Spark', available: true },
      { text: 'Unlimited quizzes', available: true },
      { text: 'Advanced Lyra AI chat', available: true },
      { text: 'Class-level adaptive content', available: true },
      { text: 'AI Tutor — chapter lessons', available: true },
      { text: 'YouTube videos per topic (3 languages)', available: true },
      { text: 'AI chapter summaries', available: true },
      { text: 'Live chapter quizzes', available: true },
      { text: 'Study plan generator', available: false },
      { text: 'Daily parent report', available: false },
    ],
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: 9.99,
    period: 'month',
    tagline: 'Full intelligence suite',
    color: 'border-cyan-400/60',
    glow: 'shadow-cyan-500/30',
    badge: 'Most Popular',
    accentColor: 'text-cyan-400',
    btnClass: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-black hover:from-cyan-400 hover:to-blue-400 shadow-xl shadow-cyan-500/30',
    features: [
      { text: 'Everything in Scholar', available: true },
      { text: 'AI-powered study plan generator', available: true },
      { text: 'Real-time topic tests (unlimited)', available: true },
      { text: 'Personal evaluation engine', available: true },
      { text: 'Daily parent report (email)', available: true },
      { text: 'Study analytics dashboard', available: true },
      { text: 'Priority AI response speed', available: true },
      { text: 'WhatsApp parent reports', available: false, comingSoon: true },
    ],
  },
  {
    id: 'elite' as const,
    name: 'Elite',
    price: 19.99,
    period: 'month',
    tagline: 'Ultimate mastery tier',
    color: 'border-amber-400/60',
    glow: 'shadow-amber-500/30',
    badge: 'All-Access',
    accentColor: 'text-amber-400',
    btnClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black hover:from-amber-400 hover:to-orange-400 shadow-xl shadow-amber-500/30',
    features: [
      { text: 'Everything in Premium', available: true },
      { text: 'WhatsApp reports to parents', available: true, comingSoon: true },
      { text: 'Advanced 1-on-1 AI tutoring', available: true },
      { text: 'Predictive exam performance AI', available: true, comingSoon: true },
      { text: 'Curriculum-aligned chapter maps', available: true, comingSoon: true },
      { text: 'Early access to new features', available: true },
      { text: 'Dedicated support channel', available: true },
      { text: 'Offline mode', available: true, comingSoon: true },
    ],
  },
];

const TESTIMONIALS = [
  { name: 'Priya S.', class: 'Grade 10', avatar: 12, quote: 'The AI tutor explained photosynthesis better than my teacher. Premium is worth every rupee!' },
  { name: 'Arjun K.', class: 'Grade 8', avatar: 24, quote: 'My parents love the daily email reports. I study harder knowing they can see my progress.' },
  { name: 'Emma T.', class: 'Undergraduate', avatar: 36, quote: 'The chapter videos + AI summary combo is insane. I finished organic chemistry revision in half the time.' },
  { name: 'Rahul M.', class: 'Grade 12', avatar: 48, quote: 'The study plan AI literally maps out my entire week based on my exam date. Game changer.' },
];

function TrialBanner({ daysRemaining }: { daysRemaining: number }) {
  const urgent = daysRemaining <= 5;
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl border px-6 py-4 mb-12 flex items-center justify-between gap-4 ${urgent ? 'border-amber-500/40 bg-amber-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}`}
    >
      <div className={`absolute inset-0 blur-[60px] opacity-20 ${urgent ? 'bg-amber-500' : 'bg-cyan-500'}`} />
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${urgent ? 'bg-amber-500/10 border-amber-500/30' : 'bg-cyan-500/10 border-cyan-500/30'}`}>
          <Timer className={`w-5 h-5 ${urgent ? 'text-amber-400' : 'text-cyan-400'}`} />
        </div>
        <div>
          <div className={`text-sm font-black uppercase tracking-wider ${urgent ? 'text-amber-400' : 'text-cyan-400'}`}>
            🎉 Free Trial Active — Full Elite Access
          </div>
          <div className="text-slate-400 text-xs mt-0.5">
            {urgent
              ? `⚠️ Only ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left! Upgrade to keep full access.`
              : `${daysRemaining} days remaining · You have access to all Elite features for free.`}
          </div>
        </div>
      </div>
      <div className={`relative z-10 text-right flex-shrink-0`}>
        <div className={`text-3xl font-black ${urgent ? 'text-amber-400' : 'text-cyan-400'}`}>{daysRemaining}</div>
        <div className="text-[9px] uppercase tracking-widest text-slate-500">days left</div>
      </div>
    </motion.div>
  );
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <span
        className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border"
        style={{
          color: '#a78bfa',
          borderColor: 'rgba(167,139,250,0.4)',
          background: 'rgba(167,139,250,0.08)',
          boxShadow: '0 0 8px rgba(167,139,250,0.3)',
          animation: 'pulseBadge 2s ease-in-out infinite',
        }}
      >
        Soon
      </span>
    </span>
  );
}

export const PremiumSection: React.FC = () => {
  const { isPremium, premiumTier, effectiveTier, isTrialActive, trialDaysRemaining, upgradeToPremium, uid } = useUser();
  const { pricing, format, currency } = useCurrency();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);

  const localPriceFor = (id: 'free' | 'scholar' | 'premium' | 'elite') =>
    id === 'free' ? null : pricing[id];

  const handleUpgrade = (tier: 'scholar' | 'premium' | 'elite') => {
    if (!uid) { alert('Please sign in to upgrade your plan.'); return; }
    setSelectedUpgrade(tier);
    setTimeout(() => { upgradeToPremium(tier); setSelectedUpgrade(null); }, 1500);
  };

  return (
    <section id="premium-section" className="relative max-w-7xl mx-auto px-4 sm:px-8 py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <div className="text-center mb-12 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Premium Intelligence</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-4">
          Unlock Your <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Full Potential</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm font-light leading-relaxed">
          Every student gets a <strong className="text-white">30-day free trial</strong> with full Elite access. No credit card required.
        </p>
        {isPremium && !isTrialActive && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
              Active: {premiumTier.charAt(0).toUpperCase() + premiumTier.slice(1)} Plan
            </span>
          </div>
        )}
      </div>

      {/* Trial banner */}
      {isTrialActive && uid && (
        <div className="relative z-10 max-w-3xl mx-auto mb-8">
          <TrialBanner daysRemaining={trialDaysRemaining} />
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {PLANS.map((plan, idx) => {
          const isActive = effectiveTier === plan.id || (isTrialActive && plan.id === 'elite');
          const isHovered = hoveredPlan === plan.id;
          const isUpgrading = selectedUpgrade === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200 }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className="relative group"
            >
              {(plan.id === 'premium' || plan.id === 'elite') && (
                <div
                  className={`absolute -inset-px rounded-3xl transition-opacity duration-500 ${isHovered || isActive ? 'opacity-100' : 'opacity-60'}`}
                  style={{
                    background: plan.id === 'premium'
                      ? 'linear-gradient(135deg,rgba(34,211,238,0.6),rgba(59,130,246,0.6),rgba(34,211,238,0.6))'
                      : 'linear-gradient(135deg,rgba(245,158,11,0.6),rgba(249,115,22,0.6),rgba(245,158,11,0.6))',
                    backgroundSize: '200% 200%',
                    animation: 'gradientShift 3s ease infinite',
                  }}
                />
              )}

              <div
                className={`relative rounded-3xl border ${plan.color} flex flex-col h-full backdrop-blur-xl overflow-hidden transition-all duration-300 ${isHovered ? `shadow-2xl ${plan.glow}` : ''}`}
                style={{ background: 'rgba(8,9,14,0.97)' }}
              >
                {/* Inner glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 blur-[60px] rounded-full pointer-events-none opacity-40"
                  style={{ background: plan.id === 'free' ? 'rgba(148,163,184,0.15)' : plan.id === 'scholar' ? 'rgba(59,130,246,0.3)' : plan.id === 'premium' ? 'rgba(34,211,238,0.3)' : 'rgba(245,158,11,0.3)' }} />

                {plan.badge && (
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest z-10 ${plan.id === 'premium' ? 'bg-cyan-500 text-black' : 'bg-amber-500 text-black'}`}>
                    {plan.badge}
                  </div>
                )}

                {/* Trial active badge on Elite */}
                {isTrialActive && plan.id === 'elite' && uid && (
                  <div className="absolute top-4 left-4 z-10 px-2 py-1 rounded-full bg-green-500 text-black text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" /> Active Trial
                  </div>
                )}

                <div className="p-6 flex flex-col h-full relative z-10">
                  <div className="mb-5">
                    <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${plan.accentColor}`}>{plan.name}</div>
                    <div className="flex items-baseline gap-1 flex-wrap">
                      {plan.price === 0 ? (
                        <span className="text-4xl font-black text-white">Free</span>
                      ) : (
                        <>
                          <span className="text-4xl font-black text-white">{format(localPriceFor(plan.id) ?? plan.price)}</span>
                          <span className="text-slate-500 text-sm">/{plan.period}</span>
                        </>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">{plan.tagline}</p>
                    {plan.price !== 0 && (
                      <p className="text-[9px] text-slate-600 mt-1 flex items-center gap-1 uppercase tracking-widest">
                        <span>{currency.flag}</span> Local price · {currency.code}
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  {plan.id === 'free' ? (
                    <button className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest mb-5 transition-all ${plan.btnClass}`}>
                      Get Started Free
                    </button>
                  ) : isTrialActive && plan.id === 'elite' && !isPremium ? (
                    <div className="w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest mb-5 bg-green-500/20 border border-green-500/30 text-green-400 text-center">
                      ✓ Trial Active
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(plan.id as any)}
                      disabled={premiumTier === plan.id || isUpgrading}
                      className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest mb-5 transition-all ${premiumTier === plan.id ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-default' : plan.btnClass} ${isUpgrading ? 'opacity-70' : ''}`}
                    >
                      {isUpgrading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Activating...
                        </span>
                      ) : premiumTier === plan.id ? (
                        <span className="flex items-center justify-center gap-1.5"><Check className="w-3 h-3" /> Current Plan</span>
                      ) : 'Upgrade Now'}
                    </button>
                  )}

                  <div className="h-px bg-white/5 mb-4" />

                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className={`flex items-start gap-2.5 text-[11px] ${f.available ? 'text-slate-300' : 'text-slate-600'}`}>
                        {f.available ? (
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.accentColor}`} />
                        ) : (
                          <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-700" />
                        )}
                        <span>
                          {f.text}
                          {(f as any).comingSoon && <ComingSoonBadge />}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature highlights */}
      <div className="mt-20 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
        {[
          { icon: <GraduationCap className="w-5 h-5" />, label: 'AI Tutor', desc: 'Class-adaptive lessons', live: true },
          { icon: <Video className="w-5 h-5" />, label: 'Video Library', desc: 'Per-topic compilation', live: true },
          { icon: <BarChart3 className="w-5 h-5" />, label: 'Study Plans', desc: 'AI-built schedules', live: true },
          { icon: <Bell className="w-5 h-5" />, label: 'Parent Reports', desc: 'Daily email updates', live: true },
          { icon: <Clock className="w-5 h-5" />, label: 'Live Tests', desc: 'Real-time evaluation', live: true },
          { icon: <Sparkles className="w-5 h-5" />, label: 'WhatsApp', desc: 'Coming soon · Elite', live: false },
        ].map((feat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden">
            {!feat.live && (
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-400" style={{ boxShadow: '0 0 6px rgba(167,139,250,0.8)', animation: 'pulseBadge 2s ease-in-out infinite' }} />
            )}
            <div className={feat.live ? 'text-cyan-400' : 'text-violet-400'}>{feat.icon}</div>
            <div className="text-[11px] font-black text-white uppercase tracking-widest">{feat.label}</div>
            <div className="text-[10px] text-slate-500">{feat.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="mt-20 relative z-10">
        <h3 className="text-center text-2xl font-black uppercase tracking-widest text-white mb-2">Students <span className="text-cyan-400">Love It</span></h3>
        <p className="text-center text-slate-500 text-xs mb-8 uppercase tracking-widest">Real results from real learners</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-slate-800">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}`} alt={t.name} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-500">{t.class}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">"{t.quote}"</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes pulseBadge { 0%,100%{opacity:1;box-shadow:0 0 6px rgba(167,139,250,0.6)} 50%{opacity:0.7;box-shadow:0 0 14px rgba(167,139,250,1)} }
      `}</style>
    </section>
  );
};
