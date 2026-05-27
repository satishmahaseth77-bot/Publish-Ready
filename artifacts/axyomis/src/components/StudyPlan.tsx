import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Clock, Target, BookOpen, ChevronRight, Loader2, Sparkles, Crown, Lock, RefreshCw, CheckCircle2, Circle } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useUser } from '../context/UserContext';
import { UpgradeModal } from './UpgradeModal';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

interface StudySession {
  day: string;
  subject: string;
  topic: string;
  duration: string;
  type: 'lesson' | 'practice' | 'revision' | 'quiz';
  priority: 'high' | 'medium' | 'low';
}

interface StudyPlanData {
  goal: string;
  weeklyHours: number;
  sessions: StudySession[];
  tips: string[];
  motivationalQuote: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPE_COLORS: Record<string, string> = {
  lesson: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  practice: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  revision: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  quiz: 'bg-green-500/10 border-green-500/20 text-green-400',
};
const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-green-400',
};

async function generateStudyPlan(classLevel: string, subjects: string[], hoursPerDay: number): Promise<StudyPlanData> {
  if (!genAI) throw new Error('No API key');
  const prompt = `Create a 7-day personalized study plan for a ${classLevel} student studying: ${subjects.join(', ')}.
Available study time: ${hoursPerDay} hours/day.

Return ONLY a valid JSON object (no markdown) with this exact structure:
{
  "goal": "One sentence describing the weekly learning goal",
  "weeklyHours": ${hoursPerDay * 7},
  "sessions": [
    {
      "day": "Monday",
      "subject": "Physics",
      "topic": "Newton's Laws of Motion",
      "duration": "45 min",
      "type": "lesson",
      "priority": "high"
    }
  ],
  "tips": ["Study tip 1", "Study tip 2", "Study tip 3"],
  "motivationalQuote": "A short motivational quote"
}
Include 2-4 sessions per day, mixing subjects. Types: lesson, practice, revision, quiz. Priorities: high, medium, low.`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const text = response.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Invalid response');
  return JSON.parse(match[0]);
}

export const StudyPlan: React.FC = () => {
  const { classLevel, subjects, isPremium, isTrialActive } = useUser() as any;
  const canAccess = isPremium || isTrialActive;
  const [plan, setPlan] = useState<StudyPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!classLevel || subjects.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const data = await generateStudyPlan(classLevel, subjects, hoursPerDay);
      setPlan(data);
      setCompletedSessions(new Set());
    } catch {
      setError('Failed to generate plan. Please try again.');
    }
    setLoading(false);
  };

  const toggleSession = (key: string) => {
    setCompletedSessions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const sessionsByDay = plan ? DAYS.reduce((acc, day) => {
    acc[day] = plan.sessions.filter(s => s.day === day);
    return acc;
  }, {} as Record<string, StudySession[]>) : {};

  const totalSessions = plan?.sessions.length || 0;
  const completedCount = completedSessions.size;
  const progress = totalSessions > 0 ? (completedCount / totalSessions) * 100 : 0;

  if (!canAccess) {
    return (
      <section id="study-plan" className="max-w-7xl mx-auto px-4 sm:px-8 mb-32">
        <div className="text-center py-12 sm:py-16 border border-white/5 rounded-3xl bg-white/[0.01]">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white mb-2">AI Study Plan</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto px-4">Get a personalised week-by-week AI study schedule tailored to your class level and subjects.</p>
          <button onClick={() => setShowUpgrade(true)} className="px-6 py-3 bg-amber-500 rounded-2xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-colors inline-flex items-center gap-2">
            <Crown className="w-4 h-4" /> Unlock with Premium
          </button>
        </div>
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          featureName="AI Study Plan"
          requiredTier="premium"
          description="builds you a personalised week-by-week study schedule based on your class and subjects."
        />
      </section>
    );
  }

  return (
    <section id="study-plan" className="max-w-7xl mx-auto px-4 sm:px-8 mb-32">
      <div className="flex items-center gap-4 mb-4">
        <span className="w-12 h-px bg-cyan-500"></span>
        <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white">AI Study Plan</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Premium</span>
        </div>
      </div>
      <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase max-w-md mb-8">
        AI-generated weekly schedule · {classLevel} · {subjects.join(', ')}
      </p>

      {/* Generator controls */}
      {!plan && !loading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="p-8 rounded-3xl border border-white/5 bg-white/[0.02] text-center">
          <Calendar className="w-12 h-12 text-cyan-500/40 mx-auto mb-4" />
          <h3 className="text-white font-black uppercase tracking-wider text-lg mb-2">Build Your Study Plan</h3>
          <p className="text-slate-500 text-sm mb-6">Your AI will create a personalised 7-day schedule based on your class and subjects.</p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Hours per day:</span>
            {[1, 1.5, 2, 3, 4].map(h => (
              <button key={h} onClick={() => setHoursPerDay(h)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border ${hoursPerDay === h ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
                {h}h
              </button>
            ))}
          </div>
          <button onClick={handleGenerate}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl text-black font-black uppercase tracking-widest text-[11px] hover:from-cyan-400 hover:to-blue-400 shadow-xl shadow-cyan-500/20 transition-all inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Generate My Plan
          </button>
          {error && <p className="mt-4 text-red-400 text-xs">{error}</p>}
        </motion.div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Building your personalised plan...</p>
        </div>
      )}

      {plan && !loading && (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Weekly Hours', value: `${plan.weeklyHours}h`, icon: <Clock className="w-4 h-4 text-cyan-400" /> },
                { label: 'Total Sessions', value: totalSessions, icon: <BookOpen className="w-4 h-4 text-purple-400" /> },
                { label: 'Completed', value: `${completedCount}/${totalSessions}`, icon: <CheckCircle2 className="w-4 h-4 text-green-400" /> },
                { label: 'Progress', value: `${Math.round(progress)}%`, icon: <Target className="w-4 h-4 text-amber-400" /> },
              ].map((stat, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center gap-3">
                  {stat.icon}
                  <div>
                    <div className="text-lg font-black text-white">{stat.value}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mb-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                <span>Weekly Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8 }} />
              </div>
            </div>

            {/* Goal */}
            <div className="mb-6 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Weekly Goal</span>
              </div>
              <p className="text-white text-sm font-medium">{plan.goal}</p>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {DAYS.map(day => {
                const sessions = sessionsByDay[day] || [];
                return (
                  <div key={day} className="rounded-2xl border border-white/5 bg-white/[0.01] overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                      <span className="text-[10px] font-black uppercase tracking-widest text-white">{day}</span>
                    </div>
                    <div className="p-3 space-y-2">
                      {sessions.length === 0 ? (
                        <p className="text-[10px] text-slate-600 text-center py-2">Rest day 🌙</p>
                      ) : sessions.map((s, si) => {
                        const key = `${day}-${si}`;
                        const done = completedSessions.has(key);
                        return (
                          <button key={si} onClick={() => toggleSession(key)}
                            className={`w-full text-left p-2.5 rounded-xl border transition-all ${done ? 'opacity-50' : ''} ${TYPE_COLORS[s.type]}`}>
                            <div className="flex items-start gap-1.5">
                              {done ? <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" /> : <Circle className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-50" />}
                              <div>
                                <div className={`text-[10px] font-black uppercase tracking-wider ${done ? 'line-through' : ''}`}>{s.topic}</div>
                                <div className="text-[9px] opacity-70 mt-0.5">{s.subject} · {s.duration}</div>
                                <div className="flex items-center gap-1 mt-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[s.priority]}`} />
                                  <span className="text-[8px] opacity-60 uppercase">{s.type}</span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {plan.tips.map((tip, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="text-[9px] font-black uppercase tracking-widest text-cyan-400 mb-1">Tip {i + 1}</div>
                  <p className="text-[11px] text-slate-400">{tip}</p>
                </div>
              ))}
            </div>

            {/* Quote + regenerate */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/10">
              <p className="italic text-slate-400 text-sm">"{plan.motivationalQuote}"</p>
              <button onClick={handleGenerate}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex-shrink-0">
                <RefreshCw className="w-3.5 h-3.5" /> New Plan
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
};
