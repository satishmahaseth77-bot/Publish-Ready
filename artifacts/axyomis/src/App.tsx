/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { Chatbot } from './components/Chatbot';
import { QuizSection } from './components/QuizSection';
import { GlobalPopups } from './components/Popups';
import { Profile } from './components/Profile';
import { PremiumSection } from './components/PremiumSection';
import { AstraVoice } from './components/AstraVoice';
import { MobileNav } from './components/MobileNav';
import { AITutor } from './components/AITutor';
import { StudyPlan } from './components/StudyPlan';
import { StudyAnalytics } from './components/StudyAnalytics';
import { OnboardingFlow } from './components/OnboardingFlow';
import { ReviewSection } from './components/ReviewSection';
import { ParentReport } from './components/ParentReport';
import { auth, getUserProfile, handleGoogleRedirectResult } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { User as LucideUser, Volume2, Shield, Radio, Activity, Terminal, Brain, Crown, GraduationCap, HelpCircle, X } from 'lucide-react';
import { MarqueeBanner } from './components/MarqueeBanner';
import { Globe } from './components/Globe';
import { ScrollExpansionHero } from './components/ScrollExpansionHero';
import { OriginDialog } from './components/OriginDialog';
import { ChapterReader } from './components/ChapterReader';
import { TopicGrid } from './components/TopicGrid';
import { voiceService } from './services/voice';
import { useUser } from './context/UserContext';
import { load3D as engineLoad3D } from './engine3d';

export default function App() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAstraVoiceOpen, setIsAstraVoiceOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { hasCompletedOnboarding, isPremium, premiumTier, classLevel, subjects, uid } = useUser();

  // Reader state
  const [readerOpen, setReaderOpen] = useState(false);
  const [readerTopic, setReaderTopic] = useState('');
  const [readerContext, setReaderContext] = useState('');
  const [initialTutorMode, setInitialTutorMode] = useState<'doubts' | 'lesson' | undefined>(undefined);

  // Topic grid states
  const [studySubject, setStudySubject] = useState('Physics');
  const [kidsSubject, setKidsSubject] = useState('Nature');

  // 3D viewer states
  const [cosmosState, setCosmosState] = useState({ iframeSrc: null as string | null, desc: '', loading: false, activeId: null as string | null });
  const [anaState, setAnaState] = useState({ iframeSrc: null as string | null, desc: '', loading: false, activeId: null as string | null });
  const [hospState, setHospState] = useState({ iframeSrc: null as string | null, desc: '', loading: false, activeId: null as string | null });

  useEffect(() => {
    // Handle redirect result from Google sign-in (needed when popup is blocked)
    handleGoogleRedirectResult().then(user => {
      if (user) {
        getUserProfile(user.uid).then(profile => {
          setCurrentUser(profile || user);
        });
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setCurrentUser(profile || user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Dismiss loading screen after initialization
  useEffect(() => {
    const bar = document.getElementById('loader-bar');
    const pctEl = document.getElementById('loader-pct');
    const loader = document.getElementById('loader');
    if (!bar || !pctEl || !loader) return;

    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.floor(Math.random() * 15) + 5;
      if (pct >= 100) {
        pct = 100;
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add('loader-exit');
          setTimeout(() => { loader.style.display = 'none'; }, 1200);
        }, 500);
      }
      bar.style.width = pct + '%';
      pctEl.innerText = pct + '%';
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Trigger onboarding after login if not completed
  useEffect(() => {
    if (!uid || hasCompletedOnboarding) return;
    const timer = setTimeout(() => setIsOnboardingOpen(true), 1500);
    return () => clearTimeout(timer);
  }, [uid, hasCompletedOnboarding]);

  const handleChatStateChange = useCallback((open: boolean) => {
    if (open) {
      setIsAstraVoiceOpen(false);
      setIsAITutorOpen(false);
    }
    setIsChatOpen(open);
  }, []);

  const openAITutor = useCallback(() => {
    setIsChatOpen(false);
    setIsAstraVoiceOpen(false);
    setReaderOpen(false);
    setInitialTutorMode(undefined);
    setIsAITutorOpen(true);
  }, []);

  const openDoubtSolver = useCallback(() => {
    setIsChatOpen(false);
    setIsAstraVoiceOpen(false);
    setReaderOpen(false);
    setInitialTutorMode('doubts');
    setIsAITutorOpen(true);
  }, []);

  const openChat = useCallback(() => {
    setIsAITutorOpen(false);
    setIsAstraVoiceOpen(false);
    setReaderOpen(false);
    setIsChatOpen(true);
  }, []);

  const openAstraVoice = useCallback(() => {
    setIsChatOpen(false);
    setIsAITutorOpen(false);
    setReaderOpen(false);
    setIsAstraVoiceOpen(true);
  }, []);

  const terminateSession = useCallback(() => {
    setIsChatOpen(false);
    setIsAstraVoiceOpen(false);
    setIsAITutorOpen(false);
    setReaderOpen(false);
    if (typeof window !== 'undefined') {
      try { voiceService.cancel(); } catch {}
      try { window.dispatchEvent(new Event('axa-terminate-audio')); } catch {}
    }
  }, []);

  const openProfile = useCallback(() => {
    setIsProfileOpen(true);
  }, []);

  const openReader = useCallback((topic: string, context = '') => {
    setIsChatOpen(false);
    setIsAstraVoiceOpen(false);
    setIsAITutorOpen(false);
    setReaderTopic(topic);
    setReaderContext(context);
    setReaderOpen(true);
  }, []);

  const closeReader = useCallback(() => {
    setReaderOpen(false);
    setReaderTopic('');
    setReaderContext('');
  }, []);

  return (
    <div id="axyomis-root">
      <div className="fixed top-1 left-0 right-0 px-6 py-1 z-[1001] flex justify-between items-center pointer-events-none">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
            <span className="text-[8px] font-mono text-blue-500/80 uppercase tracking-widest">Signal Stable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-emerald-500" />
            <span className="text-[8px] font-mono text-emerald-500/80 uppercase tracking-widest">Secure Connection Active</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3 h-3 text-blue-400" />
            <span className="text-[8px] font-mono text-blue-400/80 uppercase tracking-widest">OS v1.0.4 r/c</span>
          </div>
        </div>
      </div>

      <MarqueeBanner />
      
      {/* Background Decorative Globe */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none z-0 overflow-hidden">
        <Globe />
      </div>

      {/* CUSTOM CURSOR */}
      <div className="cursor-dot" id="cursor-dot"></div>
      <div className="cursor-ring" id="cursor-ring"></div>

      {/* LOADING SCREEN */}
      <div id="loader">
        <canvas id="sparkles-canvas"></canvas>
        <div className="loader-content-wrapper">
          <div className="loader-brand">AXYOMIS-X</div>
          <div className="aceternity-line-container">
            <div className="aceternity-line-base"></div>
            <div className="aceternity-line-glow"></div>
          </div>
          <div className="loader-sub">Advanced Scientific Intelligence & Research Assistant</div>
          <div className="progress-bar-container">
            <div className="progress-bar" id="loader-bar"></div>
          </div>
          <div className="progress-pct" id="loader-pct">0%</div>
        </div>
      </div>

      <canvas id="starfield"></canvas>

      <nav>
        <a href="#" className="flex items-center gap-4">
          <div className="tech-logo">
            <div className="tech-logo-orbit1"></div>
            <div className="tech-logo-orbit2"></div>
            <div className="tech-logo-core"></div>
          </div>
          <div>
            <div className="brand-name font-bold tracking-tight text-white">Axyomis <span className="text-[var(--accent)]">-X</span></div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-mono">Biomedical OS / Release Candidate 1.0.4</p>
          </div>
        </a>
        <div className="nav-links hidden md:flex items-center">
          <a href="#evaluation-quiz">QUIZ</a>
          <a href="#cosmos-section">Cosmos</a>
          <a href="#anatomy-section">Anatomy</a>
          <a href="#study-hub">Sciences</a>
          <a href="#premium-section">Premium</a>
          <button
            onClick={openAITutor}
            className="px-4 py-2 bg-cyan-600/10 border border-cyan-500/30 rounded-full text-[10px] font-bold text-cyan-400 uppercase tracking-widest hover:bg-cyan-600/20 transition-all flex items-center gap-2"
          >
            <Brain className="w-3 h-3" />
            AI Tutor
            {isPremium && <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse" />}
          </button>
          <button 
            onClick={() => {
              setIsMatrixOpen(true);
              voiceService.speak("Initializing neural matrix synchronization protocol.");
            }}
            className="px-4 py-2 bg-blue-600/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:bg-blue-600/20 transition-all flex items-center gap-2"
          >
            <Volume2 className="w-3 h-3" />
            Info
          </button>
          <button 
            onClick={openProfile}
            className="flex items-center gap-2 p-2 px-4 rounded-full bg-white/5 border border-white/10 hover:border-blue-500/50 transition-all group touch-target"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-800 border border-white/10 group-hover:border-blue-500/50">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <LucideUser className="w-full h-full p-1 text-slate-500" />
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-400">
              {currentUser?.displayName?.split(' ')[0] || 'Member'}
            </span>
          </button>
        </div>
        <MobileNav
          onOpenTutor={openAITutor}
          onOpenVoice={openAstraVoice}
          onOpenProfile={openProfile}
          onOpenInfo={() => {
            setIsMatrixOpen(true);
            voiceService.speak('Initializing neural matrix synchronization protocol.');
          }}
          displayName={currentUser?.displayName}
          photoURL={currentUser?.photoURL}
          isPremium={isPremium}
        />
      </nav>

      <main id="app" className="pt-32">
        {/* HERO SECTION */}
        <section className="flex flex-col lg:flex-row items-center justify-between min-h-[80vh] max-w-7xl mx-auto px-4 sm:px-8 gap-12 relative">
          <div id="glow" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] bg-[rgba(229,211,179,0.12)] blur-[120px] rounded-full pointer-events-none z-0"></div>
          
          <div className="flex-1 w-full z-10 mt-10 lg:mt-0">
            <div className="cyber-greeting-box bg-[#0d0d10a6] border border-white/10 rounded-[48px] p-8 sm:p-16 backdrop-blur-3xl shadow-2xl">
              <p className="text-xl sm:text-2xl font-light text-[#B0B5B9] leading-relaxed mb-6 sm:mb-10">
                Inquire. Synthesize. Transcend. <span className="text-white font-black text-3xl sm:text-5xl block my-4 tracking-tighter uppercase">Lyra AI</span>
                Your high-order neural polymath for advanced scientific inquiry. 
              </p>
              <div className="relative group">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center bg-black/60 border border-[#878681] rounded-3xl sm:rounded-full p-2 sm:pl-6 transition-all hover:border-[var(--accent)] focus-within:border-[var(--accent)] gap-2 sm:gap-0">
                  <i className="fas fa-search text-[var(--accent)] hidden sm:block mr-4"></i>
                  <input 
                    type="text" 
                    id="hero-search-input" 
                    className="flex-1 bg-transparent border-none text-white outline-none py-3 px-4 sm:p-0 text-center sm:text-left"
                    placeholder="Search chapters, formulas, or cancer study videos..." 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openReader((e.target as HTMLInputElement).value);
                    }}
                  />
                  <button
                    className="rainbow-btn w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={() => {
                      const input = document.getElementById('hero-search-input') as HTMLInputElement;
                      openReader(input.value);
                      voiceService.speak(`Initializing search for ${input.value}. Accessing global pathology index.`);
                    }}
                  >
                    <span>Initialize Search</span>
                  </button>
                </div>
                <div className="mt-8 flex flex-wrap gap-4 items-center justify-center sm:justify-start">
                  <button 
                    onClick={openAstraVoice}
                    className="ambient-glow flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600/25 to-violet-600/25 border border-blue-500/40 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white hover:from-blue-600/35 hover:to-violet-600/35 transition-all shadow-[0_0_40px_rgba(59,130,246,0.2)] group touch-target"
                  >
                    <Volume2 className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span>Talk with Astra</span>
                  </button>
                  <button
                    onClick={openDoubtSolver}
                    className="ambient-glow flex items-center gap-3 px-8 py-4 bg-white/10 border border-white/15 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-white/15 transition-all shadow-[0_0_30px_rgba(255,255,255,0.08)]"
                  >
                    <HelpCircle className="w-4 h-4 text-cyan-300" />
                    <span>Doubt Solver</span>
                  </button>
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#111] bg-slate-800 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} alt="Researcher" />
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-[#111] bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                      12k
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest pl-2">Actively Researching</span>
                </div>
              </div>
            </div>
          </div>

          <div id="card" className="flex-1 relative flex justify-center items-center h-[400px] sm:h-[550px] w-full z-10 transition-all duration-500 ease-out hover:scale-105 hover:rotate-1 group/spline">
            <div className="glass-card w-full max-w-[450px] h-full bg-[var(--glass-bg)] rounded-[30px] border border-[var(--glass-border)] backdrop-blur-3xl shadow-2xl overflow-hidden relative group-hover/spline:shadow-[0_0_80px_rgba(34,211,238,0.2)] group-hover/spline:border-[var(--accent)]/50 transition-all duration-500">
              {/* @ts-ignore */}
              <spline-viewer url="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"></spline-viewer>
              <div className="absolute bottom-8 left-8 right-8 pointer-events-none group-hover/spline:translate-y-[-4px] transition-transform duration-500">
                <h1 className="text-white text-3xl font-bold tracking-widest uppercase mb-1 font-['Rajdhani']">Lyra AI</h1>
                <p className="text-white/60 font-semibold tracking-wider uppercase flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff] animate-pulse"></span>
                  Core Active
                </p>
              </div>
            </div>
          </div>
        </section>

        <ScrollExpansionHero />
        
        <div className="pt-20">
          {/* Main Content Sections... */}
        </div>

        <section id="kids-zone" className="max-w-7xl mx-auto px-8 mb-32">
          <h2 className="text-center text-5xl font-bold uppercase tracking-widest mb-4">Quantum Kids: <span className="text-[var(--accent)]">Early Explorers</span></h2>
          <p className="text-center text-[#8b8b93] max-w-2xl mx-auto mb-12">A specially designed gateway for young minds to embark on their first scientific journey.</p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['Nature', 'Fruits', 'Vegetables', 'Hygiene'].map((subject) => (
              <div key={subject} className="relative group">
                <button
                  className={`subject-toggle px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-[var(--accent-dim)] hover:border-[var(--accent)] text-slate-300 font-bold uppercase tracking-widest transition-all cursor-pointer ${subject === kidsSubject ? 'active-subject' : ''}`}
                  onClick={() => setKidsSubject(subject)}
                >
                  {subject}
                </button>
              </div>
            ))}
          </div>

          <TopicGrid category="kids" context={kidsSubject} onOpenReader={openReader} />
        </section>

        {/* STUDY HUB */}
        <section id="study-hub" className="max-w-7xl mx-auto px-8 mb-32">
          <h2 className="text-center text-5xl font-bold uppercase tracking-widest mb-4">Theoretical <span className="text-[var(--accent)]">Sciences</span></h2>
          <p className="text-center text-[#8b8b93] max-w-2xl mx-auto mb-8">Rigorous exploration of advanced sciences with 100+ chapter paths, searchable formulas, and curriculum-grade study flow.</p>

          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {['Physics', 'Chemistry', 'Biology', 'Mathematics'].map((subject) => (
              <div key={subject} className="relative group">
                <button
                  className={`subject-toggle px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-[var(--accent-dim)] hover:border-[var(--accent)] text-slate-300 font-bold uppercase tracking-widest transition-all cursor-pointer ${subject === studySubject ? 'active-subject' : ''}`}
                  onClick={() => setStudySubject(subject)}
                >
                  {subject}
                </button>
              </div>
            ))}
          </div>

          <div className="mb-12 border-l-2 border-[var(--accent)] pl-6">
            <h3 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold mb-1">Active Research Domain</h3>
            <div className="text-2xl font-bold text-white uppercase tracking-wider">{studySubject}</div>
          </div>

          <TopicGrid category="study" context={studySubject} onOpenReader={openReader} />
        </section>

        {/* COMPREHENSIVE QUIZ EVALUATION */}
        <QuizSection />

        {/* 3D INTERACTIVE MODULES */}
        <section className="max-w-7xl mx-auto px-8 space-y-24 mb-32">
          {/* COSMOS */}
          <div id="cosmos-section" className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-12 bg-white/[0.02] border border-white/5 rounded-[var(--r)] p-12 backdrop-blur-xl">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold uppercase tracking-widest leading-tight">Cosmos & <span className="text-[var(--accent)]">Astrophysics</span></h2>
              <div className="flex flex-wrap gap-2">
                {['solar', 'sun', 'blackhole', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'comet', 'asteroids', 'meteor', 'constellation', 'telescope'].map(id => (
                  <button
                    key={id}
                    className={`px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider hover:border-[var(--accent)] transition-all cursor-pointer ${cosmosState.activeId === id ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-white' : ''}`}
                    onClick={() => engineLoad3D('cosmos', id, setCosmosState)}
                  >
                    {id}
                  </button>
                ))}
              </div>
              <div className="prose prose-invert max-w-none text-slate-400 font-light leading-relaxed text-sm">
                {cosmosState.desc ? <div dangerouslySetInnerHTML={{ __html: cosmosState.desc }} /> : <p>Select a module to initialize orbital mechanics.</p>}
              </div>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative">
               <div className={`absolute inset-0 flex items-center justify-center bg-[#020408] z-10 pointer-events-none transition-opacity ${cosmosState.loading ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="flex flex-col items-center gap-4">
                   <i className="fas fa-satellite-dish fa-spin text-3xl text-[var(--accent)]"></i>
                   <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Syncing Satellite...</span>
                 </div>
               </div>
               {cosmosState.iframeSrc && <iframe src={cosmosState.iframeSrc} className="w-full h-full" frameBorder="0" allowFullScreen onLoad={() => setCosmosState(s => ({ ...s, loading: false }))} />}
            </div>
          </div>

          {/* ANATOMY */}
          <div id="anatomy-section" className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-12 bg-white/[0.02] border border-white/5 rounded-[var(--r)] p-12 backdrop-blur-xl">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold uppercase tracking-widest leading-tight">Spatial <span className="text-[var(--accent)]">Anatomy</span></h2>
              <div className="flex flex-wrap gap-2">
                {['internal', 'heart', 'brain', 'lungs', 'cardio', 'vein', 'head', 'facial', 'liver', 'urinary', 'malerepro', 'woman', 'uterus', 'fetus'].map(id => (
                  <button
                    key={id}
                    className={`px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider hover:border-[var(--accent)] transition-all cursor-pointer ${anaState.activeId === id ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-white' : ''}`}
                    onClick={() => engineLoad3D('ana', id, setAnaState)}
                  >
                    {id}
                  </button>
                ))}
              </div>
              <div className="prose prose-invert max-w-none text-slate-400 font-light leading-relaxed text-sm">
                {anaState.desc ? <div dangerouslySetInnerHTML={{ __html: anaState.desc }} /> : <p>High-fidelity systemic breakdowns awaiting initialization.</p>}
              </div>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative">
               <div className={`absolute inset-0 flex items-center justify-center bg-[#020408] z-10 pointer-events-none transition-opacity ${anaState.loading ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="flex flex-col items-center gap-4">
                   <i className="fas fa-heartbeat fa-spin text-3xl text-[var(--accent)]"></i>
                   <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Rendering Viscera...</span>
                 </div>
               </div>
               {anaState.iframeSrc && <iframe src={anaState.iframeSrc} className="w-full h-full" frameBorder="0" allowFullScreen onLoad={() => setAnaState(s => ({ ...s, loading: false }))} />}
            </div>
          </div>

          {/* HOSPITAL */}
          <div id="hospital-section" className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr] gap-12 bg-white/[0.02] border border-white/5 rounded-[var(--r)] p-12 backdrop-blur-xl">
            <div className="space-y-8">
              <h2 className="text-3xl font-bold uppercase tracking-widest leading-tight">Clinical <span className="text-[var(--accent)]">Environments</span></h2>
              <div className="flex flex-wrap gap-2">
                {['recovery', 'autopsy', 'dental', 'anesthesia', 'infusion', 'portablexray', 'xrayviewer', 'equipments', 'lighting', 'syringe', 'nurse'].map(id => (
                  <button
                    key={id}
                    className={`px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider hover:border-[var(--accent)] transition-all cursor-pointer ${hospState.activeId === id ? 'bg-[var(--accent-dim)] border-[var(--accent)] text-white' : ''}`}
                    onClick={() => engineLoad3D('hosp', id, setHospState)}
                  >
                    {id}
                  </button>
                ))}
              </div>
              <div className="prose prose-invert max-w-none text-slate-400 font-light leading-relaxed text-sm">
                {hospState.desc ? <div dangerouslySetInnerHTML={{ __html: hospState.desc }} /> : <p>Select a scenario to start clinical simulation.</p>}
              </div>
            </div>
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative">
               <div className={`absolute inset-0 flex items-center justify-center bg-[#020408] z-10 pointer-events-none transition-opacity ${hospState.loading ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="flex flex-col items-center gap-4">
                   <i className="fas fa-hospital fa-spin text-3xl text-[var(--accent)]"></i>
                   <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Sterilizing Field...</span>
                 </div>
               </div>
               {hospState.iframeSrc && <iframe src={hospState.iframeSrc} className="w-full h-full" frameBorder="0" allowFullScreen onLoad={() => setHospState(s => ({ ...s, loading: false }))} />}
            </div>
          </div>
        </section>

        <section id="diseases-section" className="max-w-7xl mx-auto px-8 mb-32">
          <h2 className="text-center text-5xl font-bold uppercase tracking-widest mb-4">Pathology <span className="text-red-500">& Disease Index</span></h2>
          <p className="text-center text-[#8b8b93] max-w-2xl mx-auto mb-12">Comprehensive repository of infectious, genetic, and chronic diseases.</p>
          <TopicGrid category="diseases" context="diseases" onOpenReader={openReader} />
        </section>

        {/* STUDY PLAN SECTION */}
        <StudyPlan />

        {/* STUDY ANALYTICS DASHBOARD */}
        <StudyAnalytics />

        {/* AI TUTOR PROMO BANNER */}
        <section className="max-w-7xl mx-auto px-8 mb-24">
          <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 bg-gradient-to-r from-cyan-950/60 via-[#070810] to-blue-950/60 p-10 sm:p-14">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-0 top-0 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2" />
            </div>
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-5 h-5 text-cyan-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">AI Tutor — Powered by Gemini</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-white mb-2">
                  Your Personal AI Teacher
                </h3>
                <p className="text-slate-400 text-sm max-w-md">
                  Get chapter-by-chapter lessons, video compilations, AI summaries and live quizzes — all adapted to your class level and subjects.
                  {classLevel && <span className="text-cyan-400 ml-1 font-bold">Tuned for {classLevel}.</span>}
                </p>
                {subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {subjects.map(s => (
                      <span key={s} className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[9px] font-black uppercase tracking-widest text-cyan-400">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                {!uid && (
                  <button
                    onClick={() => setIsProfileOpen(true)}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" /> Sign In First
                  </button>
                )}
                {uid && !hasCompletedOnboarding && (
                  <button
                    onClick={() => setIsOnboardingOpen(true)}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" /> Set Your Class
                  </button>
                )}
                <button
                  onClick={openAITutor}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl text-black font-black uppercase tracking-widest text-[10px] hover:from-cyan-400 hover:to-blue-400 shadow-xl shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                  <Brain className="w-4 h-4" /> Open AI Tutor
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ASTRA LABS SECTION */}
        <section id="astra-labs" className="max-w-7xl mx-auto px-8 mb-32">
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-6">
              <span className="w-12 h-px bg-blue-500"></span>
              <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white">Astra labs</h2>
            </div>
            <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase max-w-md">Experimental Neural Environments & Geospatial Mapping</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 group">
              <div className="relative aspect-video bg-black rounded-[48px] overflow-hidden border border-white/5 hover:border-blue-500/30 transition-all p-12 flex flex-col justify-between group">
                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                  <div>
                    <h3 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Neural Ping <br /><span className="text-blue-500">Location</span></h3>
                    <div className="flex gap-4 mt-6">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Active Latency</span>
                        <span className="text-xs font-mono text-blue-400">12ms - Stable</span>
                      </div>
                      <div className="w-px h-8 bg-white/10"></div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nodes Detected</span>
                        <span className="text-xs font-mono text-emerald-400">1,402 Active</span>
                      </div>
                    </div>
                  </div>
                  <div className="tech-logo w-16 h-16 opacity-40 group-hover:opacity-100 transition-opacity">
                    <div className="tech-logo-orbit1"></div>
                    <div className="tech-logo-orbit2"></div>
                    <div className="tech-logo-core"></div>
                  </div>
                </div>

                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Surface Ping', loc: '34.0522° N' },
                    { label: 'Deep Core', loc: '118.2437° W' },
                    { label: 'Atmospheric', loc: 'Altitude: 12km' },
                    { label: 'Orbital', loc: 'LEO Grid A4' }
                  ].map((stat, i) => (
                    <button key={i} className="p-4 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 transition-all text-left">
                      <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</div>
                      <div className="text-[10px] font-mono text-white">{stat.loc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="bg-gradient-to-br from-indigo-600/20 to-transparent border border-white/5 rounded-[48px] p-10 flex flex-col justify-between flex-1 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                   <Activity className="w-20 h-20 text-white" />
                 </div>
                 <div>
                   <h4 className="text-xl font-bold text-white uppercase tracking-widest mb-2">Simulation Pod</h4>
                   <p className="text-[10px] text-slate-500 uppercase tracking-widest">Neural synthesis module for predictive chemical reactions.</p>
                 </div>
                 <button className="mt-8 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                   Enter Simulation
                 </button>
              </div>
              <div className="bg-black/40 border border-white/5 rounded-[48px] p-10 flex items-center justify-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
                 <div className="text-center italic">
                   <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em] mb-2 animate-pulse">Neural Synchronization</p>
                   <p className="text-xl font-black text-blue-500/40 uppercase tracking-tighter">Feature Coming Soon</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* PARENT REPORT SECTION */}
      <ParentReport />

      {/* CORE COURSES — integrated in AI Tutor; anchor kept for links */}
      <div id="courses" className="hidden" aria-hidden />

      {/* PREMIUM SECTION */}
      <PremiumSection />

      {/* REVIEWS SECTION */}
      <ReviewSection />

      {/* EBOOK CHAPTER READER */}
      <ChapterReader
        isOpen={readerOpen}
        onClose={closeReader}
        query={readerTopic}
        context={readerContext}
        onNavigate={openReader}
      />

      <footer className="pt-32 pb-20 border-t border-white/5 bg-[#08080a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center p-2 shadow-2xl">
                  <Terminal className="text-[var(--accent)] w-full h-full" />
                </div>
                <h3 className="text-white font-[900] tracking-[0.4em] text-sm uppercase">Axyomis-X</h3>
              </div>
              <p className="text-slate-500 font-medium text-xs uppercase tracking-[0.2em] leading-relaxed">
                The ultimate high-order neural polymath for scientific exploration and advanced cognitive growth.
              </p>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">System Domains</h4>
              <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <a href="#kids-zone" className="hover:text-white transition-colors">Quantum Kids</a>
                <a href="#study-hub" className="hover:text-white transition-colors">Theoretical Sciences</a>
                <a href="#diseases-section" className="hover:text-white transition-colors">Pathology Index</a>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Quick Links</h4>
              <div className="flex flex-col gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                <span onClick={() => setIsMatrixOpen(true)} className="hover:text-white transition-colors cursor-pointer">Research Center</span>
                <span onClick={() => handleChatStateChange(true)} className="hover:text-white transition-colors cursor-pointer">Astra AI Support</span>
                <span onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="hover:text-white transition-colors cursor-pointer">Global Search</span>
                <a href="#quiz-evaluation" className="hover:text-white transition-colors">Quiz Synthesis</a>
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Transmission Control</h4>
              <div className="space-y-4">
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Transmit logic reports or signal feedback.</p>
                <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white hover:bg-white/10 transition-all uppercase tracking-[0.4em]">
                  Transmitter Open
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-16 border-t border-white/5 gap-10">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Astra Status: ONLINE</span>
              </div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-700">
                L-SYNC READY
              </div>
              <div className="hidden lg:flex items-center gap-6 border-l border-white/10 pl-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-black text-slate-600 uppercase">Neural Load</span>
                  <span className="text-[9px] font-mono text-blue-400">0.04%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-black text-slate-600 uppercase">Uptime</span>
                  <span className="text-[9px] font-mono text-emerald-400">99.9992%</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-black text-slate-600 uppercase">Neural Nodes</span>
                  <span className="text-[9px] font-mono text-slate-400">4,129 Active</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[7px] font-black text-slate-600 uppercase">Sync Latency</span>
                  <span className="text-[9px] font-mono text-amber-500">~2ms</span>
                </div>
              </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 text-center md:text-right">
              &copy; 2026 Axyomis-X. Founded by Sahil Kumar Karna. Final Ready Build 14.1.0
            </div>
          </div>
        </div>
      </footer>
      <GlobalPopups isChatOpen={isChatOpen} isTutorOpen={isAITutorOpen} />
      <AstraVoice isOpen={isAstraVoiceOpen} onClose={() => setIsAstraVoiceOpen(false)} />
      <Chatbot 
        onStateChange={handleChatStateChange} 
        externalOpen={isChatOpen}
        hideToggle={isAITutorOpen || isAstraVoiceOpen}
        onOpenAITutor={openAITutor}
        onOpenVoice={openAstraVoice}
      />
      <Profile isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <AITutor
        isOpen={isAITutorOpen}
        onClose={() => {
          setIsAITutorOpen(false);
          setInitialTutorMode(undefined);
        }}
        onOpenChat={openChat}
        onOpenReader={openReader}
        initialMode={initialTutorMode}
      />
      <OnboardingFlow isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      <OriginDialog 
        isOpen={isMatrixOpen} 
        onClose={() => setIsMatrixOpen(false)} 
        title="Research & Privacy Protocols"
        footerActions={
          <>
            <button 
              onClick={() => setIsMatrixOpen(false)}
              className="px-6 py-2 rounded-xl text-slate-500 font-bold uppercase tracking-widest text-[10px] hover:text-white transition-colors"
            >
              Close
            </button>
            <button 
              onClick={() => setIsMatrixOpen(false)}
              className="px-6 py-2 bg-blue-600 rounded-xl text-white font-bold uppercase tracking-widest text-[10px] hover:bg-blue-500 shadow-lg transition-all"
            >
              Acknowledge
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-blue-400 font-black uppercase tracking-widest text-[10px] mb-2">Platform Connection</h4>
            <p>Axyomis-X employs an advanced artificial intelligence system designed for academic inquiry. By using this platform, you agree to our research and privacy protocols establishing for scientific data management.</p>
          </div>
          <div>
            <h4 className="text-blue-400 font-black uppercase tracking-widest text-[10px] mb-2">Data Integrity</h4>
            <p>All research conducted within this environment is logged for your convenience. Identity verification is recommended for saving your findings to the global index.</p>
          </div>
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
            <p className="italic text-xs text-slate-500">"The boundary between observation and creation is a theoretical construct that we intend to dissolve." - Astra AI Core</p>
          </div>
          <p>Additional scrolling content to test the sticky footer behavior in this enhanced dialog component. We want to ensure that as the content expands, the footer stays pinned to the bottom of the viewport with its beautiful glassmorphism effect.</p>
          <p>More scientific jargon and protocol descriptions could go here to further populate the scrollable region. The goal is to provide a comprehensive legal or informative overlay for the explorer.</p>
        </div>
      </OriginDialog>
    </div>
  );
}
