import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BookOpen, Video, Brain, ClipboardList, ChevronRight, Loader2, Sparkles, Play, ExternalLink, CheckCircle2, XCircle, RefreshCw, Crown, Lock, GraduationCap, ChevronDown, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useUser } from '../context/UserContext';
import { logActivity } from '../services/activityService';
import { fetchMultilingualVideos, VideoGroup } from '../services/youtubeService';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Tab = 'lesson' | 'videos' | 'summary' | 'quiz';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CHAPTERS_BY_SUBJECT: Record<string, string[]> = {
  Science: ['Introduction to Science', 'States of Matter', 'Energy & Forces', 'Ecosystems', 'Earth & Space', 'Human Body', 'Simple Machines', 'Light & Sound', 'Electricity', 'Scientific Method'],
  Mathematics: ['Numbers & Operations', 'Algebra', 'Geometry', 'Trigonometry', 'Calculus', 'Statistics & Probability', 'Linear Algebra', 'Differential Equations', 'Complex Numbers', 'Discrete Mathematics'],
  Chemistry: ['Atomic Structure', 'Periodic Table', 'Chemical Bonding', 'Stoichiometry', 'Acids & Bases', 'Thermochemistry', 'Kinetics', 'Equilibrium', 'Electrochemistry', 'Organic Chemistry'],
  Physics: ['Kinematics', 'Newton\'s Laws', 'Work & Energy', 'Momentum', 'Gravitation', 'Waves & Optics', 'Thermodynamics', 'Electrostatics', 'Magnetism', 'Modern Physics'],
  Biology: ['Cell Biology', 'Genetics & DNA', 'Evolution', 'Ecology', 'Photosynthesis', 'Respiration', 'Human Physiology', 'Nervous System', 'Reproduction', 'Microbiology'],
  Astronomy: ['Solar System', 'Stars & Stellar Evolution', 'Galaxies', 'Cosmology', 'Space Exploration', 'Exoplanets', 'Black Holes', 'The Universe', 'Telescopes & Instruments', 'Astrobiology'],
  'AI & Computer Science': ['Intro to Programming', 'Data Structures', 'Algorithms', 'Machine Learning Basics', 'Neural Networks', 'Computer Architecture', 'Operating Systems', 'Databases', 'Cryptography', 'AI Ethics'],
};

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

async function generateLesson(subject: string, chapter: string, classLevel: string): Promise<string> {
  if (!genAI) return 'AI features require a GEMINI_API_KEY to be configured.';
  const prompt = `You are an expert ${subject} teacher for a ${classLevel} student.
Teach the chapter: "${chapter}".
Format your response in Markdown with:
1. **Learning Objectives** (3-4 bullet points)
2. **Key Concepts** (explain each concept clearly, use examples appropriate for ${classLevel})
3. **Important Formulas / Definitions** (if applicable)
4. **Real-World Applications** (2-3 examples)
5. **Key Takeaways** (3 bullet points)

Keep the language clear, engaging, and exactly right for a ${classLevel} student. Use LaTeX for math formulas wrapped in $...$.`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return response.text ?? '';
}

async function generateSummary(subject: string, chapter: string, classLevel: string): Promise<string> {
  if (!genAI) return 'AI features require a GEMINI_API_KEY to be configured.';
  const prompt = `Create a concise, exam-ready summary of "${chapter}" in ${subject} for a ${classLevel} student.
Include:
- **One-line definition** of the chapter
- **5 must-know facts** (numbered list)
- **Common exam mistakes** to avoid
- **Quick memory tips** or mnemonics
Keep it punchy and easy to revise from. Use Markdown formatting.`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return response.text ?? '';
}

async function generateQuiz(subject: string, chapter: string, classLevel: string): Promise<QuizQuestion[]> {
  if (!genAI) return [];
  const prompt = `Generate 5 multiple choice questions on "${chapter}" in ${subject} for a ${classLevel} student.
Return ONLY a valid JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "question": "...",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctIndex": 0,
    "explanation": "..."
  }
]`;

  const response = await genAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  const text = response.text ?? '';
  try {
    const match = text.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [];
  } catch {
    return [];
  }
}

interface AITutorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AITutor: React.FC<AITutorProps> = ({ isOpen, onClose }) => {
  const { classLevel, subjects, isPremium, isTrialActive, uid } = useUser() as any;
  const canAccessPremium = isPremium || isTrialActive;
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] || 'Physics');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<Tab>('lesson');
  const [lessonContent, setLessonContent] = useState('');
  const [summaryContent, setSummaryContent] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [videos, setVideos] = useState<VideoGroup | null>(null);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<(number | null)[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showChapters, setShowChapters] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  const chapters = CHAPTERS_BY_SUBJECT[selectedSubject] || [];
  const effectiveClass = classLevel || 'Grade 10';

  useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(selectedSubject as any)) {
      setSelectedSubject(subjects[0]);
    }
  }, [subjects]);

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
    // Log chapter activity
    if (uid) logActivity(uid, { type: 'chapter', subject: selectedSubject, topic: chapter });
    try {
      const lesson = await generateLesson(selectedSubject, chapter, effectiveClass);
      setLessonContent(lesson);
    } catch {
      setLessonContent('Failed to load lesson. Please try again.');
    }
    setLoading(false);
  }, [selectedSubject, effectiveClass, uid]);

  const loadTab = useCallback(async (tab: Tab) => {
    setActiveTab(tab);
    if (!selectedChapter) return;
    if (tab === 'summary' && !summaryContent) {
      setLoading(true);
      try {
        const s = await generateSummary(selectedSubject, selectedChapter, effectiveClass);
        setSummaryContent(s);
      } catch { setSummaryContent('Failed to generate summary.'); }
      setLoading(false);
    }
    if (tab === 'quiz' && quizQuestions.length === 0) {
      setLoading(true);
      try {
        const q = await generateQuiz(selectedSubject, selectedChapter, effectiveClass);
        setQuizQuestions(q);
        setUserAnswers(new Array(q.length).fill(null));
      } catch { }
      setLoading(false);
    }
    if (tab === 'videos' && !videos) {
      setLoading(true);
      try {
        const v = await fetchMultilingualVideos(`${selectedSubject} ${selectedChapter}`, effectiveClass);
        setVideos(v);
      } catch { }
      setLoading(false);
    }
  }, [selectedChapter, selectedSubject, effectiveClass, summaryContent, quizQuestions, videos]);

  const handleAnswer = (qi: number, ai: number) => {
    if (quizSubmitted) return;
    const updated = [...userAnswers];
    updated[qi] = ai;
    setUserAnswers(updated);
  };

  const score = quizSubmitted ? userAnswers.filter((a, i) => a === quizQuestions[i]?.correctIndex).length : 0;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; premiumOnly?: boolean }[] = [
    { id: 'lesson', label: 'Lesson', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'videos', label: 'Videos', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'summary', label: 'AI Summary', icon: <Sparkles className="w-3.5 h-3.5" />, premiumOnly: true },
    { id: 'quiz', label: 'Live Quiz', icon: <ClipboardList className="w-3.5 h-3.5" />, premiumOnly: true },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
          onClick={onClose}
        />

        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          className="relative ml-auto w-full max-w-5xl h-full bg-[#070810] border-l border-white/10 flex flex-col overflow-hidden"
        >
          {/* Ambient top glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-cyan-500/5 blur-[80px] pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <Brain className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-black uppercase tracking-wider text-sm">AI Tutor</h2>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                  {effectiveClass} · {selectedSubject}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!canAccessPremium && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">Upgrade for full access</span>
                </div>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Left sidebar: Subject + Chapters */}
            <div className={`${showChapters ? 'w-56' : 'w-0'} transition-all duration-300 flex-shrink-0 border-r border-white/5 flex flex-col overflow-hidden`}>
              {/* Subject selector */}
              <div className="p-3 border-b border-white/5">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2 px-1">Subject</div>
                <div className="space-y-1">
                  {(subjects.length > 0 ? subjects : ['Physics']).map((s: string) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSubject(s); setSelectedChapter(''); setLessonContent(''); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[11px] font-bold transition-all ${selectedSubject === s ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapters */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2 px-1">Chapters</div>
                <div className="space-y-1">
                  {chapters.map(ch => (
                    <button
                      key={ch}
                      onClick={() => loadChapter(ch)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-[11px] transition-all flex items-center gap-2 group ${selectedChapter === ch ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                      <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${selectedChapter === ch ? 'rotate-90' : ''}`} />
                      <span className="truncate">{ch}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Toggle sidebar */}
            <button
              onClick={() => setShowChapters(v => !v)}
              className="absolute left-56 top-1/2 -translate-y-1/2 z-20 w-5 h-10 bg-white/5 border border-white/10 rounded-r-lg flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ left: showChapters ? '14rem' : '0' }}
            >
              <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${showChapters ? '-rotate-90' : 'rotate-90'}`} />
            </button>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedChapter ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 rounded-3xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center mb-6">
                    <GraduationCap className="w-10 h-10 text-cyan-500/40" />
                  </div>
                  <h3 className="text-white font-black uppercase tracking-widest text-lg mb-2">Select a Chapter</h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Pick a chapter from the left panel. Your AI tutor will generate a full lesson tailored for <span className="text-cyan-400">{effectiveClass}</span>.
                  </p>
                </div>
              ) : (
                <>
                  {/* Chapter header + tabs */}
                  <div className="px-6 pt-4 pb-0 border-b border-white/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-white font-black uppercase tracking-wider text-base">{selectedChapter}</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{selectedSubject} · {effectiveClass}</p>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1">
                      {TABS.map(tab => {
                        const locked = tab.premiumOnly && !canAccessPremium;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => !locked && loadTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab.id && !locked ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-white'} ${locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {tab.icon}
                            {tab.label}
                            {locked && <Lock className="w-2.5 h-2.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center h-48 gap-4">
                        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">
                          {activeTab === 'lesson' ? 'Generating lesson...' : activeTab === 'summary' ? 'Creating AI summary...' : activeTab === 'quiz' ? 'Building quiz...' : 'Loading videos...'}
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        {activeTab === 'lesson' && lessonContent && (
                          <motion.div key="lesson" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-cyan-400 prose-strong:text-white prose-code:text-cyan-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1">
                              <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {lessonContent}
                              </Markdown>
                            </div>
                          </motion.div>
                        )}

                        {activeTab === 'summary' && (
                          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {!canAccessPremium ? (
                              <PremiumGate feature="AI Chapter Summaries" />
                            ) : summaryContent ? (
                              <div className="prose prose-invert prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-amber-400 prose-strong:text-white">
                                <Markdown remarkPlugins={[remarkGfm]}>{summaryContent}</Markdown>
                              </div>
                            ) : null}
                          </motion.div>
                        )}

                        {activeTab === 'videos' && (
                          <motion.div key="videos" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <VideoPanel videos={videos} />
                          </motion.div>
                        )}

                        {activeTab === 'quiz' && (
                          <motion.div key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            {!canAccessPremium ? (
                              <PremiumGate feature="Live Quiz Engine" />
                            ) : quizQuestions.length > 0 ? (
                              <QuizPanel
                                questions={quizQuestions}
                                userAnswers={userAnswers}
                                submitted={quizSubmitted}
                                score={score}
                                onAnswer={handleAnswer}
                                onSubmit={() => setQuizSubmitted(true)}
                                onRetry={() => { setQuizQuestions([]); setUserAnswers([]); setQuizSubmitted(false); loadTab('quiz'); }}
                              />
                            ) : null}
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
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
        <Crown className="w-7 h-7 text-amber-400" />
      </div>
      <h4 className="text-white font-black uppercase tracking-wider text-sm mb-1">{feature}</h4>
      <p className="text-slate-500 text-xs mb-4">This feature is available on Scholar plan and above.</p>
      <a href="#premium-section" className="px-5 py-2 bg-amber-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-colors">
        View Plans
      </a>
    </div>
  );
}

function VideoPanel({ videos }: { videos: VideoGroup | null }) {
  const [lang, setLang] = useState<'english' | 'hindi' | 'nepali'>('english');
  const list = videos ? videos[lang] : [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        {(['english', 'hindi', 'nepali'] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lang === l ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-white/5 border border-white/10 text-slate-500 hover:text-white'}`}>
            {l === 'english' ? '🇬🇧 English' : l === 'hindi' ? '🇮🇳 Hindi' : '🇳🇵 Nepali'}
          </button>
        ))}
      </div>
      {!videos && <p className="text-slate-500 text-sm">Loading videos...</p>}
      {list.length === 0 && videos && <p className="text-slate-500 text-sm">No videos found for this language.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {list.map(v => (
          <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer"
            className="group flex gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
            <div className="relative flex-shrink-0 w-28 h-18 rounded-xl overflow-hidden">
              <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white leading-tight line-clamp-2 mb-1">{v.title}</p>
              <p className="text-[10px] text-slate-500 truncate">{v.channelTitle}</p>
              <div className="flex items-center gap-1 mt-2">
                <ExternalLink className="w-2.5 h-2.5 text-cyan-500" />
                <span className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest">Watch</span>
              </div>
            </div>
          </a>
        ))}
      </div>
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
  return (
    <div className="space-y-6">
      {submitted && (
        <div className={`p-4 rounded-2xl border text-center ${score >= 4 ? 'bg-green-500/10 border-green-500/20' : score >= 3 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="text-2xl font-black text-white mb-1">{score}/{questions.length}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">
            {score >= 4 ? '🎉 Excellent work!' : score >= 3 ? '👍 Good effort!' : '💪 Keep practicing!'}
          </div>
          <button onClick={onRetry} className="mt-3 flex items-center gap-1.5 mx-auto px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
            <RefreshCw className="w-3 h-3" /> New Quiz
          </button>
        </div>
      )}

      {questions.map((q, qi) => {
        const answered = userAnswers[qi] !== null;
        const correct = submitted && userAnswers[qi] === q.correctIndex;
        const wrong = submitted && answered && userAnswers[qi] !== q.correctIndex;
        return (
          <div key={qi} className={`p-5 rounded-2xl border transition-colors ${correct ? 'bg-green-500/5 border-green-500/20' : wrong ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/5'}`}>
            <div className="flex items-start gap-2 mb-4">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 flex-shrink-0">Q{qi + 1}</span>
              <p className="text-sm font-bold text-white leading-relaxed">{q.question}</p>
            </div>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = userAnswers[qi] === oi;
                const isCorrect = submitted && oi === q.correctIndex;
                const isWrong = submitted && selected && oi !== q.correctIndex;
                return (
                  <button key={oi} onClick={() => onAnswer(qi, oi)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[11px] transition-all border ${isCorrect ? 'bg-green-500/10 border-green-500/30 text-green-400' : isWrong ? 'bg-red-500/10 border-red-500/30 text-red-400' : selected ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/10 hover:text-white'}`}>
                    <span className="flex items-center gap-2">
                      {submitted && isCorrect && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />}
                      {isWrong && <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-3 text-[11px] text-slate-400 italic leading-relaxed border-t border-white/5 pt-3">
                💡 {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {!submitted && (
        <button
          onClick={onSubmit}
          disabled={userAnswers.some(a => a === null)}
          className="w-full py-3 bg-cyan-500 rounded-2xl text-black font-black uppercase tracking-widest text-[11px] hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Submit Answers
        </button>
      )}
    </div>
  );
}
