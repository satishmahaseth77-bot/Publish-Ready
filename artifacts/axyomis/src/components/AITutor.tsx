import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, BookOpen, Video, Brain, ClipboardList, ChevronRight, ChevronLeft,
  Loader2, Sparkles, Play, CheckCircle2, XCircle, RefreshCw, Crown, Lock,
  GraduationCap, ChevronDown, HelpCircle, Zap, Star, Calendar, AlertTriangle,
  SkipForward, MessageCircle
} from 'lucide-react';
import { useUser } from '../context/UserContext';
import { UpgradeModal } from './UpgradeModal';
import { logActivity } from '../services/activityService';
import { fetchMultilingualVideos, VideoGroup } from '../services/youtubeService';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { DoubtsSection } from './DoubtsSection';
import { CORE_COURSES, getCourseUnits, type CoreSubject } from '../data/curriculum';

type Tab = 'lesson' | 'videos' | 'summary' | 'quiz' | 'doubts';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
  Science: ['Introduction to Science','States of Matter','Energy & Forces','Ecosystems','Earth & Space','Human Body','Simple Machines','Light & Sound','Electricity','Scientific Method'],
  Mathematics: ['Numbers & Operations','Algebra','Geometry','Trigonometry','Calculus','Statistics & Probability','Linear Algebra','Differential Equations','Complex Numbers','Discrete Mathematics'],
  Chemistry: ['Atomic Structure','Periodic Table','Chemical Bonding','Stoichiometry','Acids & Bases','Thermochemistry','Kinetics','Equilibrium','Electrochemistry','Organic Chemistry'],
  Physics: ['Kinematics','Newton\'s Laws','Work & Energy','Momentum','Gravitation','Waves & Optics','Thermodynamics','Electrostatics','Magnetism','Modern Physics'],
  Biology: ['Cell Biology','Genetics & DNA','Evolution','Ecology','Photosynthesis','Respiration','Human Physiology','Nervous System','Reproduction','Microbiology'],
  Astronomy: ['Solar System','Stars & Stellar Evolution','Galaxies','Cosmology','Space Exploration','Exoplanets','Black Holes','The Universe','Telescopes & Instruments','Astrobiology'],
  'AI & Computer Science': ['Intro to Programming','Data Structures','Algorithms','Machine Learning Basics','Neural Networks','Computer Architecture','Operating Systems','Databases','Cryptography','AI Ethics'],
};

const SUBJECT_FACTS: Record<string, string[]> = {
  Science: ['The human body contains about 37 trillion cells.','Water expands when it freezes — unusual among liquids!'],
  Mathematics: ['Pi has been calculated to over 100 trillion digits.','Zero was invented in India around 5th century AD.'],
  Chemistry: ['Gold is so unreactive it can be found pure in nature.','Diamond and graphite are both pure carbon — just arranged differently.'],
  Physics: ['Light takes ~8 minutes to reach Earth from the Sun.','At absolute zero (−273.15°C), all molecular motion stops.'],
  Biology: ['Your DNA, stretched out, would reach from Earth to Pluto and back.','Tardigrades can survive in outer space!'],
  Astronomy: ['A day on Venus is longer than a year on Venus.','There are more stars in the universe than grains of sand on Earth.'],
  'AI & Computer Science': ['The first computer bug was a real insect found in a relay in 1947.','Modern GPUs can perform over 100 trillion operations per second.'],
};

async function groqChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }] }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json() as { reply: string };
  return data.reply ?? '';
}

function getDayOfYear(): number {
  const now = new Date();
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
}

function getChapterOfDay(subject: string): string {
  const list = CHAPTERS_BY_SUBJECT[subject] || [];
  return list[getDayOfYear() % list.length] || list[0];
}

async function generateLesson(subject: string, chapter: string, classLevel: string): Promise<string> {
  return groqChat(
    `You are an expert ${subject} teacher for a ${classLevel} student.`,
    `Teach the chapter: "${chapter}".\nFormat in Markdown with:\n1. **Learning Objectives** (3-4 bullets)\n2. **Key Concepts** (clear examples for ${classLevel})\n3. **Important Formulas / Definitions** (if applicable, use LaTeX $...$ for math)\n4. **Real-World Applications** (2-3 examples)\n5. **Key Takeaways** (3 bullets)\nKeep it engaging and exactly right for ${classLevel}.`
  );
}

async function generateSummary(subject: string, chapter: string, classLevel: string): Promise<string> {
  return groqChat(
    `You are an expert exam tutor for ${classLevel}.`,
    `Concise exam-ready summary of "${chapter}" in ${subject}.\nInclude:\n- One-line definition\n- 5 must-know facts (numbered)\n- Common exam mistakes to avoid\n- Quick memory tips / mnemonics\nUse Markdown. Be punchy.`
  );
}

async function generateQuiz(subject: string, chapter: string, classLevel: string): Promise<QuizQuestion[]> {
  const text = await groqChat(
    `You are a quiz generator. Return ONLY a valid JSON array, no markdown fences, no explanation.`,
    `Generate 5 MCQ questions on "${chapter}" in ${subject} for ${classLevel}.\nReturn ONLY a valid JSON array like:\n[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correctIndex":0,"explanation":"..."}]`
  );
  try {
    const m = text.match(/\[[\s\S]*\]/);
    return m ? JSON.parse(m[0]) : [];
  } catch { return []; }
}

interface AITutorProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: () => void;
  onOpenReader?: (topic: string, subject: string) => void;
  initialMode?: 'doubts' | 'lesson';
}

export const AITutor: React.FC<AITutorProps> = ({ isOpen, onClose, onOpenChat, onOpenReader, initialMode }) => {
  const { classLevel, subjects, isPremium, isTrialActive, uid, studentProfile } = useUser() as any;
  const canAccessPremium = isPremium || isTrialActive;
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('lesson');
  const [lessonContent, setLessonContent] = useState('');
  const [summaryContent, setSummaryContent] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [videos, setVideos] = useState<VideoGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [factOfDay, setFactOfDay] = useState<string>('');
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set());
  const contentRef = useRef<HTMLDivElement>(null);
  const effectiveSubjects: string[] = subjects.length > 0 ? subjects : ['Physics', 'Biology', 'Chemistry'];
  const effectiveClass: string = classLevel || 'Grade 10';
  const country = studentProfile?.country || 'Nepal';

  // Android/iOS back button support
  useEffect(() => {
    if (!isOpen) return;
    window.history.pushState({ tutorOpen: true }, '');
    const handler = () => { onClose(); };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [isOpen, onClose]);

  // Set default subject
  useEffect(() => {
    if (effectiveSubjects.length > 0 && !selectedSubject) {
      setSelectedSubject(effectiveSubjects[0]);
    }
  }, [effectiveSubjects]);

  useEffect(() => {
    if (!isOpen || !initialMode) return;
    if (initialMode === 'doubts') {
      setActiveTab('doubts');
      setSelectedChapter('__doubts__');
    }
  }, [isOpen, initialMode]);

  // Load fact of day
  useEffect(() => {
    if (!isOpen || !selectedSubject) return;
    const key = `fact_${selectedSubject}_${getDayOfYear()}`;
    const cached = sessionStorage.getItem(key);
    if (cached) { setFactOfDay(cached); return; }
    const fallbacks = SUBJECT_FACTS[selectedSubject] || SUBJECT_FACTS.Science;
    // Show fallback immediately, then try to fetch a fresh one
    setFactOfDay(fallbacks[getDayOfYear() % fallbacks.length]);
    groqChat(
      'You are a science educator.',
      `Give ONE fascinating, accurate, and surprising fact about ${selectedSubject} appropriate for a ${effectiveClass} student. Keep it to 1-2 sentences. No intro like "Did you know" — just the fact directly.`
    ).then(f => {
      if (f.trim()) { setFactOfDay(f.trim()); sessionStorage.setItem(key, f.trim()); }
    }).catch(() => {});
  }, [isOpen, selectedSubject, effectiveClass]);

  const coreSubjects = CORE_COURSES.map(c => c.subject);
  const allSubjects = [...new Set([...effectiveSubjects, ...coreSubjects])];
  const isCoreSubject = coreSubjects.includes(selectedSubject as CoreSubject);
  const chapters = isCoreSubject
    ? getCourseUnits(selectedSubject as CoreSubject, effectiveClass).flatMap(u => u.topics)
    : (CHAPTERS_BY_SUBJECT[selectedSubject] || []);
  const chapterOfDay = selectedSubject ? getChapterOfDay(selectedSubject) : '';

  const loadChapter = useCallback(async (chapter: string) => {
    setSelectedChapter(chapter);
    setLessonContent('');
    setSummaryContent('');
    setQuizQuestions([]);
    setVideos(null);
    setUserAnswers([]);
    setQuizSubmitted(false);
    setActiveTab('lesson');
    setLoading(true);
    if (uid) logActivity(uid, { type: 'chapter', subject: selectedSubject, topic: chapter });
    try {
      const lesson = await generateLesson(selectedSubject, chapter, effectiveClass);
      setLessonContent(lesson);
      setCompletedChapters(prev => { const n = new Set(prev); n.add(`${selectedSubject}::${chapter}`); return n; });
    } catch {
      setLessonContent('Failed to load lesson. Please try again.');
    }
    setLoading(false);
  }, [selectedSubject, effectiveClass, uid]);

  const loadTab = useCallback(async (tab: Tab) => {
    setActiveTab(tab);
    if (!selectedChapter && tab !== 'doubts') return;
    if (tab === 'summary' && !summaryContent) {
      setLoading(true);
      try { setSummaryContent(await generateSummary(selectedSubject, selectedChapter, effectiveClass)); }
      catch { setSummaryContent('Failed to generate summary.'); }
      setLoading(false);
    }
    if (tab === 'quiz' && quizQuestions.length === 0) {
      setLoading(true);
      try {
        const q = await generateQuiz(selectedSubject, selectedChapter, effectiveClass);
        setQuizQuestions(q);
        setUserAnswers(new Array(q.length).fill(null));
      } catch {}
      setLoading(false);
    }
    if (tab === 'videos' && !videos) {
      setLoading(true);
      try { setVideos(await fetchMultilingualVideos(`${selectedSubject} ${selectedChapter} class ${effectiveClass}`, effectiveClass)); }
      catch {}
      setLoading(false);
    }
  }, [selectedChapter, selectedSubject, effectiveClass, summaryContent, quizQuestions, videos]);

  const handleAnswer = (qi: number, ai: number) => {
    if (quizSubmitted) return;
    const u = [...userAnswers]; u[qi] = ai; setUserAnswers(u);
  };
  const score = quizSubmitted ? userAnswers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length : 0;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; premiumOnly?: boolean }[] = [
    { id: 'lesson', label: 'Lesson', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'videos', label: 'Videos', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'summary', label: 'AI Summary', icon: <Sparkles className="w-3.5 h-3.5" />, premiumOnly: true },
    { id: 'quiz', label: 'Live Quiz', icon: <ClipboardList className="w-3.5 h-3.5" />, premiumOnly: true },
    { id: 'doubts', label: 'Doubts', icon: <HelpCircle className="w-3.5 h-3.5" /> },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[460] flex pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
          onClick={onClose}
        />

        {/* Main panel */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 28 }}
          className="relative ml-auto w-full max-w-5xl h-full flex flex-col overflow-hidden"
          style={{ background: '#050610' }}
        >
          {/* Sci-fi background layers */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }} />
            <div className="absolute inset-0 opacity-[0.02]" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,1) 2px, rgba(0,0,0,1) 4px)',
            }} />
            <div className="absolute top-0 left-0 w-[600px] h-[300px] bg-cyan-500/6 blur-[140px] rounded-full" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-violet-500/6 blur-[120px] rounded-full" />
            <div className="absolute top-1/2 right-0 w-[200px] h-[400px] bg-blue-500/4 blur-[100px] rounded-full" />
          </div>

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between px-4 md:px-6 py-3.5 border-b border-cyan-500/10 bg-black/30 backdrop-blur-md flex-shrink-0">
            <div className="flex items-center gap-3">
              {selectedChapter && (
                <button
                  onClick={() => { setSelectedChapter(''); setLessonContent(''); }}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all md:hidden"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#050610] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-black uppercase tracking-wider text-sm">AI Tutor</h2>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-[8px] font-black uppercase tracking-widest text-green-400">Online</span>
                  </div>
                  <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest font-mono">{effectiveClass} · {selectedSubject || 'Select Subject'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onOpenChat && (
                <button
                  onClick={onOpenChat}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-all"
                  title="Open Astra chat"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Ask Astra</span>
                </button>
              )}
              {!canAccessPremium && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Upgrade for full access</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 flex items-center justify-center transition-all group"
                aria-label="Close AI Tutor"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-red-400" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex flex-1 overflow-hidden relative z-10">
            {/* Sidebar */}
            <AnimatePresence>
              {showSidebar && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 border-r border-cyan-500/10 flex flex-col overflow-hidden bg-black/20"
                >
                  {/* Subject selector */}
                  <div className="p-3 border-b border-white/5">
                    <p className="text-[8px] font-black uppercase tracking-widest text-cyan-500/40 mb-2 px-1">Subject</p>
                    <div className="space-y-0.5">
                      {allSubjects.map((s: string) => (
                        <button
                          key={s}
                          onClick={() => { setSelectedSubject(s); setSelectedChapter(''); setLessonContent(''); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${selectedSubject === s ? 'bg-cyan-500/15 border border-cyan-500/25 text-cyan-300' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                        >
                          {s}
                          {coreSubjects.includes(s as CoreSubject) && (
                            <span className="ml-1 text-[8px] text-violet-400/70">★</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Chapter list */}
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="flex items-center justify-between mb-2 px-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-cyan-500/40">Chapters</p>
                      {chapters.length > 0 && (
                        <span className="text-[8px] font-black text-green-400/60 uppercase tracking-widest">
                          {chapters.filter(ch => completedChapters.has(`${selectedSubject}::${ch}`)).length}/{chapters.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {chapters.map((ch, idx) => {
                        const isChapterOfDay = ch === chapterOfDay;
                        const isDone = completedChapters.has(`${selectedSubject}::${ch}`);
                        return (
                          <button
                            key={ch}
                            onClick={() => loadChapter(ch)}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-[10px] transition-all flex items-center gap-1.5 group ${selectedChapter === ch ? 'bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 font-bold' : isDone ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' : 'text-slate-500 hover:text-white hover:bg-white/[0.04]'}`}
                          >
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[8px] font-black ${isDone ? 'bg-green-500/20 text-green-400' : selectedChapter === ch ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-slate-600'}`}>{isDone ? '✓' : idx + 1}</span>
                            <span className="truncate flex-1">{ch}</span>
                            {isChapterOfDay && !isDone && <Star className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sidebar toggle */}
            <button
              onClick={() => setShowSidebar(v => !v)}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-cyan-500/5 border border-cyan-500/15 border-l-0 rounded-r-lg flex items-center justify-center hover:bg-cyan-500/10 transition-colors"
              style={{ left: showSidebar ? 220 : 0 }}
            >
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showSidebar ? '-rotate-90' : 'rotate-90'}`} />
            </button>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedChapter ? (
                /* Landing screen */
                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  {/* Welcome banner */}
                  <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-cyan-500/8 to-blue-500/5 border border-cyan-500/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Neural Teaching Environment</span>
                      </div>
                      <h3 className="text-white font-black text-xl md:text-2xl leading-tight mb-1">
                        Welcome to <span className="text-cyan-400">AI Tutor</span>
                      </h3>
                      <p className="text-slate-400 text-xs">
                        Select a chapter from the left to generate a full lesson, quiz, video series, or get your doubt solved — all tailored for <span className="text-cyan-300 font-bold">{effectiveClass}</span>.
                      </p>
                    </div>
                  </div>

                  {/* Chapter of the Day */}
                  {chapterOfDay && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Chapter of the Day</span>
                      </div>
                      <button
                        onClick={() => loadChapter(chapterOfDay)}
                        className="w-full text-left p-4 rounded-2xl bg-gradient-to-br from-amber-500/8 to-orange-500/5 border border-amber-500/25 hover:border-amber-500/40 transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex items-center justify-between">
                          <div>
                            <p className="text-white font-black text-sm mb-0.5">{chapterOfDay}</p>
                            <p className="text-amber-400/70 text-[10px] uppercase tracking-widest font-bold">{selectedSubject} · Start today's chapter →</p>
                          </div>
                          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <Star className="w-5 h-5 text-amber-400" />
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Fact of the Day */}
                  {factOfDay && (
                    <div className="mb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Fact of the Day</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/8 to-purple-500/5 border border-violet-500/20">
                        <p className="text-slate-300 text-sm leading-relaxed italic">"{factOfDay}"</p>
                      </div>
                    </div>
                  )}

                  {/* All chapters grid */}
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">All Chapters — {selectedSubject}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {chapters.map((ch, idx) => (
                        <button
                          key={ch}
                          onClick={() => loadChapter(ch)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left group ${ch === chapterOfDay ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 'bg-white/[0.02] border-white/5 hover:border-cyan-500/20 hover:bg-white/[0.04]'}`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-black ${ch === chapterOfDay ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-slate-600'}`}>{idx + 1}</span>
                          <span className={`text-[11px] font-bold flex-1 truncate group-hover:text-white transition-colors ${ch === chapterOfDay ? 'text-amber-300' : 'text-slate-400'}`}>{ch}</span>
                          {ch === chapterOfDay && <Star className="w-3 h-3 text-amber-400 flex-shrink-0" />}
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Doubt Solving shortcut */}
                  <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-violet-500/8 to-indigo-500/5 border border-violet-500/20 hover:border-violet-500/35 transition-all cursor-pointer" onClick={() => { setActiveTab('doubts'); setSelectedChapter('__doubts__'); }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                        <HelpCircle className="w-4.5 h-4.5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-white font-black text-xs">Have a doubt? Ask Astra</p>
                        <p className="text-violet-400/70 text-[10px] font-bold">Upload a question image or type — get a curriculum-accurate answer</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 ml-auto" />
                    </div>
                  </div>
                </div>
              ) : selectedChapter === '__doubts__' ? (
                /* Standalone Doubts panel */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 md:px-6 py-3 border-b border-white/5 flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedChapter(''); setActiveTab('lesson'); }}
                      className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h3 className="text-white font-black uppercase tracking-wider text-sm">Doubt Solver</h3>
                  </div>
                  <div ref={contentRef} className="flex-1 overflow-y-auto p-4 md:p-6">
                    <DoubtsSection subject={selectedSubject} classLevel={effectiveClass} country={country} />
                  </div>
                </div>
              ) : (
                /* Chapter content */
                <>
                  {/* Chapter header + tabs */}
                  <div className="px-4 md:px-6 pt-4 pb-0 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          onClick={() => { setSelectedChapter(''); setLessonContent(''); }}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all flex-shrink-0"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0">
                          <h3 className="text-white font-black uppercase tracking-wider text-sm truncate">{selectedChapter}</h3>
                          <p className="text-[9px] text-cyan-400/60 uppercase tracking-widest font-mono">{selectedSubject} · {effectiveClass}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                        <button
                          onClick={() => { setActiveTab('doubts'); }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${activeTab === 'doubts' ? 'bg-violet-500/15 border-violet-500/30 text-violet-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span className="hidden sm:block">Ask Doubt</span>
                        </button>
                      </div>
                    </div>
                    {/* Tabs */}
                    <div className="flex gap-0.5 overflow-x-auto pb-0 scrollbar-none">
                      {TABS.filter(t => t.id !== 'doubts').map(tab => {
                        const locked = tab.premiumOnly && !canAccessPremium;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => !locked && loadTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 md:px-4 py-2.5 rounded-t-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id && !locked ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-white'} ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                            {locked && <Lock className="w-2.5 h-2.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div ref={contentRef} className="flex-1 overflow-y-auto p-4 md:p-6">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <div className="relative w-12 h-12">
                          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-cyan-500 animate-spin" />
                          </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-500/60 animate-pulse">
                          {activeTab === 'lesson' ? 'Generating lesson...' : activeTab === 'summary' ? 'Creating AI summary...' : activeTab === 'quiz' ? 'Building quiz...' : 'Loading videos...'}
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        {activeTab === 'lesson' && lessonContent && (
                          <motion.div key="lesson" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            {onOpenReader && (
                              <button
                                onClick={() => onOpenReader(selectedChapter, selectedSubject)}
                                className="mb-6 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600/20 to-cyan-600/20 border border-violet-500/30 text-violet-200 text-[10px] font-black uppercase tracking-widest hover:from-violet-600/30 hover:to-cyan-600/30 transition-all touch-target"
                              >
                                <BookOpen className="w-4 h-4" />
                                Read Full Textbook Chapter
                              </button>
                            )}
                            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-cyan-400 prose-strong:text-white prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1 prose-p:text-slate-300 prose-li:text-slate-300">
                              <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {lessonContent}
                              </Markdown>
                            </div>
                          </motion.div>
                        )}
                        {activeTab === 'summary' && (
                          <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            {!canAccessPremium ? <PremiumGate feature="AI Chapter Summaries" /> : summaryContent ? (
                              <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-amber-400 prose-strong:text-white prose-p:text-slate-300 prose-li:text-slate-300">
                                <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{summaryContent}</Markdown>
                              </div>
                            ) : null}
                          </motion.div>
                        )}
                        {activeTab === 'videos' && (
                          <motion.div key="videos" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <VideoPanel videos={videos} subject={selectedSubject} chapter={selectedChapter} classLevel={effectiveClass} />
                          </motion.div>
                        )}
                        {activeTab === 'quiz' && (
                          <motion.div key="quiz" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            {!canAccessPremium ? <PremiumGate feature="Live Quiz Engine" /> : quizQuestions.length > 0 ? (
                              <QuizPanel
                                questions={quizQuestions}
                                userAnswers={userAnswers}
                                submitted={quizSubmitted}
                                score={score}
                                onAnswer={handleAnswer}
                                onSubmit={() => {
                                  const s = userAnswers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length;
                                  setQuizSubmitted(true);
                                  if (uid) logActivity(uid, { type: 'quiz', subject: selectedSubject, topic: selectedChapter, score: s, maxScore: quizQuestions.length });
                                }}
                                onRetry={() => { setQuizQuestions([]); setUserAnswers([]); setQuizSubmitted(false); loadTab('quiz'); }}
                              />
                            ) : null}
                          </motion.div>
                        )}
                        {activeTab === 'doubts' && (
                          <motion.div key="doubts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <DoubtsSection subject={selectedSubject} classLevel={effectiveClass} country={country} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function PremiumGate({ feature }: { feature: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
        <Crown className="w-7 h-7 text-amber-400" />
      </div>
      <h4 className="text-white font-black uppercase tracking-wider text-sm mb-1">{feature}</h4>
      <p className="text-slate-500 text-xs mb-4">Available on Scholar plan and above.</p>
      <button onClick={() => setOpen(true)} className="px-5 py-2 bg-amber-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20">
        Unlock now
      </button>
      <UpgradeModal
        open={open}
        onClose={() => setOpen(false)}
        featureName={feature}
        requiredTier="scholar"
        description="is part of the Scholar plan — unlock chapter summaries, live quizzes, and AI-tutored lessons."
      />
    </div>
  );
}

function VideoPanel({ videos, subject, chapter, classLevel }: { videos: VideoGroup | null; subject: string; chapter: string; classLevel: string }) {
  const [lang, setLang] = useState<'english' | 'hindi' | 'nepali'>('english');
  const [activeIdx, setActiveIdx] = useState(0);
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [videoError, setVideoError] = useState(false);

  useEffect(() => { setActiveIdx(0); setWatched(new Set()); setVideoError(false); }, [lang]);

  const list = videos ? videos[lang] : [];
  const active = list[activeIdx] || null;

  const goTo = (idx: number) => {
    setWatched(prev => new Set([...prev, activeIdx]));
    setActiveIdx(idx);
    setVideoError(false);
  };
  const goNext = () => { if (activeIdx < list.length - 1) goTo(activeIdx + 1); };
  const goPrev = () => { if (activeIdx > 0) goTo(activeIdx - 1); };

  return (
    <div className="space-y-4">
      {/* Language tabs */}
      <div className="flex gap-2">
        {(['english', 'hindi', 'nepali'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${lang === l ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}>
            {l === 'english' ? `🇬🇧 EN${videos?.english?.length ? ` (${videos.english.length})` : ''}` : l === 'hindi' ? `🇮🇳 HI${videos?.hindi?.length ? ` (${videos.hindi.length})` : ''}` : `🇳🇵 NP${videos?.nepali?.length ? ` (${videos.nepali.length})` : ''}`}
          </button>
        ))}
      </div>

      {!videos && (
        <div className="flex flex-col items-center justify-center h-48 gap-3">
          <Loader2 className="w-7 h-7 text-cyan-500 animate-spin" />
          <p className="text-[9px] font-black uppercase tracking-widest text-cyan-500/50">Finding best videos for {classLevel}...</p>
        </div>
      )}

      {videos && list.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <Video className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-[10px] uppercase tracking-widest font-bold">No videos found for this language</p>
        </div>
      )}

      {active && (
        <>
          {/* Player */}
          <div className="rounded-2xl overflow-hidden bg-black border border-white/10">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              {videoError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-3">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <p className="text-slate-400 text-xs text-center px-4">This video is restricted or unavailable.<br />Try the next one.</p>
                  <button onClick={goNext} disabled={activeIdx >= list.length - 1}
                    className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 rounded-xl text-black font-black text-[10px] uppercase tracking-widest disabled:opacity-30 hover:bg-cyan-400 transition-all">
                    <SkipForward className="w-3.5 h-3.5" /> Next Video
                  </button>
                </div>
              ) : (
                <>
                  <iframe
                    key={`${active.id}-${lang}`}
                    src={`https://www.youtube.com/embed/${active.id}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                    title={active.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full border-0"
                    onError={() => setVideoError(true)}
                  />
                  {/* Subtle notice */}
                  <button
                    onClick={() => setVideoError(true)}
                    className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] text-slate-500 hover:text-white transition-colors border border-white/10"
                  >
                    Video not playing? Skip →
                  </button>
                </>
              )}
            </div>
            {/* Player controls */}
            <div className="px-4 py-3 bg-black/40 border-t border-white/5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">Part {activeIdx + 1}/{list.length}</span>
                  {watched.has(activeIdx) && <span className="text-[9px] font-black text-green-400 flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" /> Watched</span>}
                </div>
                <p className="text-[12px] font-bold text-white truncate">{active.title}</p>
                <p className="text-[10px] text-slate-500 truncate">{active.channelTitle}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={goPrev} disabled={activeIdx === 0}
                  className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={goNext} disabled={activeIdx >= list.length - 1}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-black font-black uppercase tracking-widest text-[10px] hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Playlist */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">{chapter} · {list.length} Part Series</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {list.map((v, i) => {
                const isActive = i === activeIdx;
                const isDone = watched.has(i);
                return (
                  <button key={v.id} onClick={() => goTo(i)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${isActive ? 'bg-cyan-500/10 border-cyan-500/25' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-[9px] font-black transition-all ${isDone ? 'border-green-500/40 bg-green-500/10 text-green-400' : isActive ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400' : 'border-white/10 text-slate-500'}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div className="relative w-16 flex-shrink-0 rounded-lg overflow-hidden aspect-video bg-black">
                      <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      {isActive && <div className="absolute inset-0 bg-cyan-500/30 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full animate-pulse" /></div>}
                      {!isActive && !isDone && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"><Play className="w-3.5 h-3.5 text-white" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Part {i + 1}</div>
                      <p className={`text-[10px] font-bold leading-tight line-clamp-2 ${isActive ? 'text-cyan-300' : 'text-white'}`}>{v.title}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuizPanel({ questions, userAnswers, submitted, score, onAnswer, onSubmit, onRetry }: {
  questions: QuizQuestion[];
  userAnswers: (number | null)[];
  submitted: boolean;
  score: number;
  onAnswer: (qi: number, ai: number) => void;
  onSubmit: () => void;
  onRetry: () => void;
}) {
  const pct = Math.round((score / questions.length) * 100);
  return (
    <div className="space-y-6">
      {submitted && (
        <div className={`p-5 rounded-2xl border text-center ${pct >= 80 ? 'bg-green-500/8 border-green-500/25' : pct >= 60 ? 'bg-amber-500/8 border-amber-500/25' : 'bg-red-500/8 border-red-500/25'}`}>
          <div className={`text-4xl font-black mb-1 ${pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{pct}%</div>
          <p className="text-white font-black uppercase tracking-wider text-sm mb-0.5">{pct >= 80 ? 'Excellent Work!' : pct >= 60 ? 'Good Effort!' : 'Keep Practicing!'}</p>
          <p className="text-slate-500 text-xs">{score} / {questions.length} correct</p>
          <button onClick={onRetry} className="mt-4 flex items-center gap-2 px-5 py-2 bg-white/10 rounded-xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/15 transition-all mx-auto">
            <RefreshCw className="w-3.5 h-3.5" /> Try Again
          </button>
        </div>
      )}
      {questions.map((q, qi) => {
        const answered = userAnswers[qi];
        const isCorrect = submitted && answered === q.correctIndex;
        const isWrong = submitted && answered !== null && answered !== q.correctIndex;
        return (
          <div key={qi} className="space-y-3">
            <div className="flex gap-3">
              <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-black flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-green-500/15 text-green-400 border border-green-500/30' : isWrong ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 'bg-white/5 text-slate-500 border border-white/10'}`}>{qi + 1}</span>
              <p className="text-white font-semibold text-sm leading-relaxed">{q.question}</p>
            </div>
            <div className="space-y-2 pl-10">
              {q.options.map((opt, ai) => {
                const isSelected = userAnswers[qi] === ai;
                const isCorrectOpt = submitted && ai === q.correctIndex;
                const isWrongOpt = submitted && isSelected && ai !== q.correctIndex;
                return (
                  <button
                    key={ai}
                    onClick={() => onAnswer(qi, ai)}
                    disabled={submitted}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${isCorrectOpt ? 'bg-green-500/15 border-green-500/40 text-green-300' : isWrongOpt ? 'bg-red-500/15 border-red-500/40 text-red-300' : isSelected ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/[0.03] border-white/8 text-slate-400 hover:text-white hover:border-white/20'} ${submitted ? 'cursor-default' : 'hover:bg-white/[0.05]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {isCorrectOpt ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" /> : isWrongOpt ? <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" /> : null}
                      {opt}
                    </div>
                  </button>
                );
              })}
              {submitted && userAnswers[qi] !== q.correctIndex && (
                <div className="px-4 py-3 rounded-xl bg-blue-500/8 border border-blue-500/20 text-xs text-blue-300 leading-relaxed">
                  <span className="font-black text-blue-400 uppercase tracking-widest text-[9px] block mb-1">Explanation</span>
                  {q.explanation}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={userAnswers.some(a => a === null)}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-black font-black uppercase tracking-widest text-[11px] transition-all shadow-lg shadow-cyan-500/20"
        >
          Submit Quiz
        </button>
      )}
    </div>
  );
}
