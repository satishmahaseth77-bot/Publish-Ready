import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, ChevronLeft, GraduationCap, BookOpen, Atom, FlaskConical, Dna, Telescope,
  Brain, Calculator, Check, User, Mail, MessageCircle, Sparkles, Phone, Calendar,
  Globe, Shield, X
} from 'lucide-react';
import { useUser, ClassLevel, Subject, ParentInfo, StudentProfile } from '../context/UserContext';

const SUBJECTS: { id: Subject; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'Science', icon: <Atom className="w-5 h-5" />, color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40', desc: 'General sciences' },
  { id: 'Mathematics', icon: <Calculator className="w-5 h-5" />, color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40', desc: 'Algebra, calculus & more' },
  { id: 'Chemistry', icon: <FlaskConical className="w-5 h-5" />, color: 'from-green-500/20 to-emerald-500/20 border-green-500/40', desc: 'Reactions & molecules' },
  { id: 'Physics', icon: <Sparkles className="w-5 h-5" />, color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40', desc: 'Forces & energy' },
  { id: 'Biology', icon: <Dna className="w-5 h-5" />, color: 'from-pink-500/20 to-rose-500/20 border-pink-500/40', desc: 'Life & living systems' },
  { id: 'Astronomy', icon: <Telescope className="w-5 h-5" />, color: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/40', desc: 'Stars, planets & cosmos' },
  { id: 'AI & Computer Science', icon: <Brain className="w-5 h-5" />, color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/40', desc: 'Algorithms & AI' },
];

const CLASS_GROUPS = [
  { label: 'Primary', range: 'G 1–5', grades: ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5'] as ClassLevel[], color: 'from-green-500/10 to-emerald-500/10 border-green-500/30', icon: '🌱' },
  { label: 'Middle', range: 'G 6–8', grades: ['Grade 6','Grade 7','Grade 8'] as ClassLevel[], color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30', icon: '📚' },
  { label: 'High School', range: 'G 9–12', grades: ['Grade 9','Grade 10','Grade 11','Grade 12'] as ClassLevel[], color: 'from-purple-500/10 to-violet-500/10 border-purple-500/30', icon: '🎓' },
  { label: 'Higher Ed', range: 'College+', grades: ['Undergraduate','Postgraduate'] as ClassLevel[], color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30', icon: '🏛️' },
];

const COUNTRIES = ['Nepal','India','USA','UK','Australia','Canada','Bangladesh','Pakistan','Sri Lanka','Other'];

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = ['Class', 'Subjects', 'My Profile', 'Parent 1', 'Parent 2'];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ isOpen, onClose }) => {
  const { completeOnboarding } = useUser();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  const [studentName, setStudentName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('Nepal');

  const [p1Name, setP1Name] = useState('');
  const [p1Email, setP1Email] = useState('');
  const [p1WhatsApp, setP1WhatsApp] = useState('');
  const [p1Relation, setP1Relation] = useState('Mother');

  const [p2Name, setP2Name] = useState('');
  const [p2Email, setP2Email] = useState('');
  const [p2WhatsApp, setP2WhatsApp] = useState('');
  const [p2Relation, setP2Relation] = useState('Father');

  const toggleSubject = (s: Subject) => {
    setSelectedSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const canGoNext = () => {
    if (step === 0) return !!selectedClass;
    if (step === 1) return selectedSubjects.length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!selectedClass || selectedSubjects.length === 0) return;
    setSaving(true);

    const studentProfile: StudentProfile = {};
    if (studentName) studentProfile.studentName = studentName;
    if (dateOfBirth) studentProfile.dateOfBirth = dateOfBirth;
    if (country) studentProfile.country = country;
    studentProfile.curriculum = country;

    const parentInfo: ParentInfo | undefined =
      (p1Name || p1Email || p1WhatsApp)
        ? { name: `${p1Relation}: ${p1Name}`, email: p1Email, whatsapp: p1WhatsApp }
        : undefined;

    const secondaryParent: ParentInfo | undefined =
      (p2Name || p2Email || p2WhatsApp)
        ? { name: `${p2Relation}: ${p2Name}`, email: p2Email, whatsapp: p2WhatsApp }
        : undefined;

    await completeOnboarding({
      classLevel: selectedClass,
      subjects: selectedSubjects,
      parentInfo,
      secondaryParent,
      studentProfile,
    });
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 24 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="relative w-full max-w-2xl bg-[#08090e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-cyan-500/8 blur-[70px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="px-6 md:px-8 pt-6 pb-4 relative z-10 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-white font-black uppercase tracking-wider text-sm">Setup Your Profile</h2>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest">Step {step + 1} of {STEPS.length}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <div key={s} className="flex-1 flex flex-col gap-1">
                  <div className={`h-0.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-cyan-500' : 'bg-white/10'}`} />
                  <span className={`text-[8px] font-bold uppercase tracking-widest transition-colors hidden sm:block ${i === step ? 'text-cyan-400' : 'text-slate-700'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 md:px-8 pb-4 relative z-10">
            <AnimatePresence mode="wait">

              {/* STEP 0: Class Level */}
              {step === 0 && (
                <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">What's your class?</h3>
                  <p className="text-slate-500 text-xs mb-4">Your AI tutor adapts all content to your level.</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CLASS_GROUPS.map(group => (
                      <div key={group.label} className={`rounded-2xl border bg-gradient-to-br ${group.color} p-3.5 space-y-2`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{group.icon}</span>
                          <div>
                            <div className="text-[11px] font-bold text-white">{group.label}</div>
                            <div className="text-[9px] text-slate-500">{group.range}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.grades.map(g => (
                            <button
                              key={g}
                              onClick={() => setSelectedClass(g)}
                              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${selectedClass === g ? 'bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/30' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'}`}
                            >
                              {g.replace('Grade ', 'G')}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 1: Subjects */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">Choose your subjects</h3>
                  <p className="text-slate-500 text-xs mb-4">Pick one or more — select all that you study.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {SUBJECTS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleSubject(s.id)}
                        className={`relative rounded-2xl border bg-gradient-to-br ${s.color} p-3.5 text-left transition-all ${selectedSubjects.includes(s.id) ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.01]'}`}
                      >
                        {selectedSubjects.includes(s.id) && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-cyan-500 rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </div>
                        )}
                        <div className="text-cyan-400 mb-1.5">{s.icon}</div>
                        <div className="text-[10px] font-black text-white uppercase tracking-wider">{s.id}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Student Profile */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">Your Profile</h3>
                  <p className="text-slate-500 text-xs mb-4">Helps Astra personalize your learning experience.</p>
                  <div className="space-y-3">
                    {/* Full Name */}
                    <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-cyan-500/40 transition-colors">
                      <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Your full name"
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
                      />
                    </div>
                    {/* Date of Birth */}
                    <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-cyan-500/40 transition-colors">
                      <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={e => setDateOfBirth(e.target.value)}
                        className="flex-1 bg-transparent text-white text-sm outline-none [color-scheme:dark]"
                      />
                    </div>
                    {/* Country */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">
                        <Globe className="w-3 h-3" />Country / Curriculum
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {COUNTRIES.map(c => (
                          <button
                            key={c}
                            onClick={() => setCountry(c)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${country === c ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'}`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15 text-[10px] text-cyan-400/70 font-bold uppercase tracking-widest">
                      🎯 AI answers will match your curriculum ({country})
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Parent 1 */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">Primary Contact</h3>
                  <p className="text-slate-500 text-xs mb-4">
                    Parent or guardian #1 — receives daily progress reports.
                  </p>
                  <div className="space-y-3">
                    {/* Relation */}
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Relationship</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['Mother','Father','Guardian','Sibling','Other'].map(r => (
                          <button key={r} onClick={() => setP1Relation(r)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${p1Relation === r ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    {[
                      { icon: <User className="w-4 h-4" />, ph: `${p1Relation}'s full name`, val: p1Name, set: setP1Name, type: 'text' },
                      { icon: <Mail className="w-4 h-4" />, ph: `${p1Relation}'s email address`, val: p1Email, set: setP1Email, type: 'email' },
                      { icon: <Phone className="w-4 h-4" />, ph: 'WhatsApp (Primary) — with country code, e.g. +977...', val: p1WhatsApp, set: setP1WhatsApp, type: 'tel' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-cyan-500/40 transition-colors">
                        <div className="text-slate-500 flex-shrink-0">{f.icon}</div>
                        <input
                          type={f.type}
                          placeholder={f.ph}
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
                        />
                      </div>
                    ))}
                    <div className="p-3 rounded-xl bg-white/3 border border-white/5 text-[10px] text-slate-600">
                      <Shield className="w-3 h-3 inline mr-1" />
                      This info is private and only used for daily progress reports. You can update it anytime in Profile settings.
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Parent 2 */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">Secondary Contact <span className="text-slate-500 font-normal text-sm">(Optional)</span></h3>
                  <p className="text-slate-500 text-xs mb-4">
                    Add a second parent/guardian for additional report notifications.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Relationship</div>
                      <div className="flex flex-wrap gap-1.5">
                        {['Mother','Father','Guardian','Sibling','Other'].map(r => (
                          <button key={r} onClick={() => setP2Relation(r)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${p2Relation === r ? 'bg-violet-500/20 border-violet-500/50 text-violet-300' : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    {[
                      { icon: <User className="w-4 h-4" />, ph: `${p2Relation}'s full name`, val: p2Name, set: setP2Name, type: 'text' },
                      { icon: <Mail className="w-4 h-4" />, ph: `${p2Relation}'s email address`, val: p2Email, set: setP2Email, type: 'email' },
                      { icon: <MessageCircle className="w-4 h-4" />, ph: 'WhatsApp (Secondary) — with country code', val: p2WhatsApp, set: setP2WhatsApp, type: 'tel' },
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-violet-500/30 transition-colors">
                        <div className="text-slate-500 flex-shrink-0">{f.icon}</div>
                        <input
                          type={f.type}
                          placeholder={f.ph}
                          value={f.val}
                          onChange={e => f.set(e.target.value)}
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
                        />
                      </div>
                    ))}
                    <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                      <p className="text-[10px] text-violet-400/70 font-bold uppercase tracking-widest">
                        ✨ You can skip this and add it later in Profile settings.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 md:px-8 py-5 border-t border-white/5 relative z-10 flex-shrink-0">
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Skip' : 'Back'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canGoNext()}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-cyan-400 disabled:opacity-30 transition-all shadow-lg shadow-cyan-500/20"
              >
                {saving ? 'Saving...' : "Let's go!"}
                <GraduationCap className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
