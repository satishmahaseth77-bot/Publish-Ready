import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, X, ChevronLeft, ChevronRight, ExternalLink, Play,
  Layers, Sparkles, Info, Quote, Lightbulb, Brain, Clock,
  ArrowRight, Bookmark, Share2, FileText, ListChecks
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useUser } from '../context/UserContext';
import { DATA_SETS } from '../constants';
import { loadChapter, type BookChapter } from '../services/chapterCache';


// Mermaid is large; load dynamically when diagrams are rendered to keep initial
// bundle sizes small.
let _mermaidReady = false;
const ensureMermaid = async () => {
  if (_mermaidReady) return (await import('mermaid'))?.default || (await import('mermaid'));
  const mod = await import('mermaid');
  const mermaid = mod?.default || mod;
  try {
    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
  } catch (e) {}
  _mermaidReady = true;
  return mermaid;
};

let mermaidRenderCounter = 0;

const MermaidDiagram: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const renderId = useRef(`chapter-mmd-${++mermaidRenderCounter}`);

  useEffect(() => {
    if (!chart?.trim()) return;
    let code = chart.trim();
    if (!code.startsWith('graph') && !code.startsWith('flowchart')) code = 'flowchart TD\n' + code;
    setError(false);
    (async () => {
      try {
        const mermaid = await ensureMermaid();
        const r = await mermaid.render(renderId.current, code);
        setSvg(r.svg);
      } catch (e) {
        try {
          const mermaid = await ensureMermaid();
          const fixed = code.replace(/\("\s*([^"']+?)\s*"\)/g, '["$1"]');
          const r2 = await mermaid.render(`${renderId.current}-retry`, fixed);
          setSvg(r2.svg);
        } catch (e2) {
          setError(true);
        }
      }
    })();
  }, [chart]);

  if (error) return null;
  if (!svg) return <div className="my-8 h-32 rounded-3xl bg-white/5 animate-pulse border border-white/5" />;
  return (
    <div className="my-10 p-6 sm:p-8 bg-black/40 rounded-3xl border border-white/5 overflow-x-auto">
      <div className="flex justify-center min-w-[280px]" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
};

interface ChapterData {
  title: string;
  extract: string;
  imgSrc?: string;
  pageId?: string;
  wikiUrl?: string;
  context?: string;
}

interface RelatedTopic {
  title: string;
  imgSrc?: string;
  icon: string;
}

interface ChapterReaderProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  context?: string;
  onNavigate?: (topic: string, context?: string) => void;
}

const fetchWiki = async (topic: string, context = ''): Promise<ChapterData | null> => {
  try {
    const WIKI_MAP: Record<string, string> = {
      "Life": "Life (biology)", "Plant reproduction": "Plant reproduction",
      "Living Things": "Life", "Solar System": "Solar System",
      "Water cycle": "Water cycle", "Atmosphere of Earth": "Atmosphere of Earth",
      "Photosynthesis": "Photosynthesis", "Apple": "Apple",
      "Orange": "Orange (fruit)", "Lemon": "Lemon", "Lime": "Lime (fruit)",
      "Pea": "Pea", "Kiwi": "Kiwifruit", "Kiwifruit": "Kiwifruit",
      "Work": "Work (physics)", "Energy": "Energy",
      "Power": "Power (physics)", "Mercury": "Mercury (element)",
      "Lead": "Lead", "Mole": "Mole (unit)", "Cell": "Cell (biology)",
      "Mammal": "Mammal", "Bird": "Bird", "Reptile": "Reptile",
      "Amphibian": "Amphibian", "Fish": "Fish", "Insect": "Insect",
      "Classical mechanics": "Classical mechanics",
      "Newton's laws of motion": "Newton's laws of motion",
      "Gravity": "Gravity", "Flux": "Flux",
      "Acid\u2013base reaction": "Acid\u2013base reaction", "Redox": "Redox",
      "Cell cycle": "Cell cycle", "Mitosis": "Mitosis",
      "Meiosis": "Meiosis", "DNA": "DNA", "RNA": "RNA",
      "Kinematics": "Kinematics", "Dynamics": "Dynamics",
      "Statics": "Statics", "Thermodynamics": "Thermodynamics",
      "Optics": "Optics", "Magnetism": "Magnetism",
      "Electricity": "Electricity", "Atomic physics": "Atomic physics"
    };
    const q = WIKI_MAP[topic] || topic;
    let pageId: string | null = null;
    let title: string = q;

    if (WIKI_MAP[topic]) {
      const directRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(q)}&format=json&origin=*`);
      const directData = await directRes.json();
      const pages = directData.query.pages;
      const firstId = Object.keys(pages)[0];
      if (firstId !== "-1") { pageId = firstId; title = pages[pageId].title; }
    }

    if (!pageId) {
      const searchQuery = context ? `${q} ${context}` : q;
      const res = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`);
      const d = await res.json();
      if (!d.query?.search?.length) return null;
      pageId = d.query.search[0].pageid;
      title = d.query.search[0].title;
    }

    const detail = await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|pageimages|images|info&inprop=url&pageids=${pageId}&exintro=0&explaintext=1&exchars=15000&pithumbsize=1200&origin=*`);
    const detData = await detail.json();
    const pageData = detData.query.pages[pageId as string | number];

    let imgSrc = pageData.thumbnail?.source || null;
    const wikiUrl = pageData.fullurl || `https://en.wikipedia.org/?curid=${pageId}`;

    // fallback image search
    if (!imgSrc) {
      try {
        const imgRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=images&imlimit=10&format=json&origin=*`);
        const imgData = await imgRes.json();
        const imgPages = imgData.query.pages;
        const imgPageId = Object.keys(imgPages)[0];
        const images = imgPages[imgPageId].images || [];
        const badWords = ['logo','icon','stub','symbol','flag','map','ambox','wikiquote','padlock','search','edit','speaker','increase','decrease','question','disambig','portal','commons','category','folder'];
        for (const img of images) {
          const lower = img.title.toLowerCase();
          if (!lower.endsWith('.jpg') && !lower.endsWith('.jpeg') && !lower.endsWith('.png')) continue;
          if (badWords.some(w => lower.includes(w))) continue;
          const urlRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`);
          const urlData = await urlRes.json();
          const urlPages = urlData.query.pages;
          const upId = Object.keys(urlPages)[0];
          const info = urlPages[upId].imageinfo?.[0];
          if (info?.thumburl && !info.thumburl.includes('1px')) { imgSrc = info.thumburl; break; }
        }
      } catch {}
    }

    return {
      title,
      extract: pageData.extract || "",
      imgSrc: imgSrc || undefined,
      pageId: String(pageId),
      wikiUrl,
      context
    };
  } catch (e) {
    console.error("Wiki Fetch Error:", e);
    return null;
  }
};

const getRelatedTopics = (topic: string, context = ''): string[] => {
  const all = (context && DATA_SETS[context]) ? DATA_SETS[context] : Object.values(DATA_SETS).flat();
  const idx = all.indexOf(topic);
  if (idx < 0) return all.slice(0, 5);
  const neighbors = all.slice(Math.max(0, idx - 2), idx).concat(all.slice(idx + 1, idx + 3));
  return neighbors.slice(0, 5);
};

const getSubjectIcon = (subject: string): string => {
  const icons: Record<string, string> = {
    Physics: 'fa-atom', Chemistry: 'fa-flask', Biology: 'fa-dna',
    Mathematics: 'fa-square-root-alt', Nature: 'fa-leaf',
    Fruits: 'fa-apple-alt', Vegetables: 'fa-carrot', Hygiene: 'fa-hand-sparkles',
    diseases: 'fa-virus-slash'
  };
  return icons[subject] || 'fa-microscope';
};

const FORMULA_MAP: Record<string, string> = {
  "Newton's laws of motion": "$$ F = m \\cdot a $$",
  "Gravity": "$$ F = G \\frac{m_1 m_2}{r^2} $$",
  "Thermodynamics": "$$ \\Delta U = Q - W $$",
  "Entropy": "$$ S = k_B \\ln \\Omega $$",
  "Maxwell's equations": "$$ \\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0} \\quad \\text{and} \\quad \\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t} $$",
  "Schr\u00f6dinger equation": "$$ i\\hbar \\frac{\\partial}{\\partial t}\\Psi(\\mathbf{r},t) = \\hat{H}\\Psi(\\mathbf{r},t) $$",
  "Theory of relativity": "$$ E = mc^2 $$",
  "Ideal gas law": "$$ PV = nRT $$",
  "Acid\u2013base reaction": "$$ \\text{pH} = -\\log_{10}[\\text{H}^+] $$",
  "Photosynthesis": "$$ 6\\text{CO}_2 + 6\\text{H}_2\\text{O} + \\text{light} \\rightarrow \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2 $$",
  "Pythagorean theorem": "$$ a^2 + b^2 = c^2 $$",
  "Calculus": "$$ \\int_a^b f(x) dx = F(b) - F(a) $$"
};
const SUBTOPICS_MAP: Record<string, string[]> = {
  'Modern Physics': ['Photoelectric effect', 'Millikan oil drop experiment', 'Semiconductor physics', 'Particle-wave duality', 'Nuclear structure'],
  'Quantum mechanics': ['Schrödinger equation', 'Heisenberg uncertainty', 'Quantum numbers', 'Atomic orbitals', 'Quantum tunneling'],
  'Electromagnetism': ['Coulomb’s law', 'Electric fields', 'Magnetic induction', 'Maxwell’s equations', 'AC circuits'],
  'Thermodynamics': ['First law of thermodynamics', 'Second law of thermodynamics', 'Entropy', 'Heat engines', 'Carnot cycle'],
  'Optics': ['Reflection', 'Refraction', 'Lens optics', 'Interference', 'Diffraction'],
  'Atomic structure': ['Bohr model', 'Electron configuration', 'Orbital shapes', 'Spectral lines', 'Ionization energy'],
  'Nuclear physics': ['Radioactivity', 'Half-life', 'Alpha decay', 'Beta decay', 'Nuclear fusion'],
};
// ─── EBOOK CHAPTER READER ───────────────────────────────────────────────

export const ChapterReader: React.FC<ChapterReaderProps> = ({ isOpen, onClose, query, context, onNavigate }) => {
  const { classLevel, studentAge, studentProfile } = useUser();
  const [data, setData] = useState<ChapterData | null>(null);
  const [book, setBook] = useState<BookChapter | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadPhase, setLoadPhase] = useState('Loading chapter...');
  const [related, setRelated] = useState<RelatedTopic[]>([]);
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [readTime, setReadTime] = useState('3 min');

  const mdComponents = {
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-2xl font-bold text-white mt-16 mb-6 pb-3 border-b border-white/10 tracking-tight">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-xl font-semibold text-white mt-10 mb-4 tracking-tight">{children}</h3>,
    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-5 leading-[1.85] text-slate-300">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="space-y-2 my-6 ml-4">{children}</ul>,
    li: ({ children }: { children?: React.ReactNode }) => <li className="flex items-start gap-3"><span className="w-1 h-1 rounded-full bg-blue-500 mt-2.5 shrink-0" /><span>{children}</span></li>,
    a: ({ children, href }: { children?: React.ReactNode; href?: string }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-4">{children}</a>,
  };

  useEffect(() => {
    if (!isOpen || !query) return;
    setLoading(true);
    setData(null);
    setBook(null);
    setRelated([]);
    setLoadPhase('Checking cache...');

    const subject = context || 'Science';
    const grade = classLevel || 'Grade 10';
    const curriculum = studentProfile?.curriculum || 'International';
    const country = studentProfile?.country || '';

    setLoadPhase(`Loading ${curriculum}-aligned chapter...`);

    loadChapter(query, subject, grade, studentAge, curriculum, country)
      .then((chapter) => {
        setBook(chapter);
        const wordCount = [chapter.introduction, chapter.context, chapter.explanation, chapter.examples, chapter.conclusion].join(' ').split(/\s+/).length;
        setReadTime(`${Math.max(4, Math.ceil(wordCount / 180))} min read`);
        setRelated((chapter.relatedTopics?.length ? chapter.relatedTopics : getRelatedTopics(query, context)).map(t => ({ title: t, icon: getSubjectIcon(subject) })));
        setLoading(false);
      })
      .catch(() => {
        setLoadPhase('Loading from Wikipedia...');
        fetchWiki(query, context).then(d => {
          setData(d);
          if (d?.extract) {
            const words = d.extract.replace(/<[^>]+>/g, '').split(/\s+/).length;
            setReadTime(`${Math.max(2, Math.ceil(words / 200))} min read`);
          }
          setLoading(false);
        });
        const relatedTitles = getRelatedTopics(query, context);
        setRelated(relatedTitles.map(t => ({ title: t, icon: getSubjectIcon(context || 'Science') })));
      });
  }, [isOpen, query, context, classLevel, studentAge, studentProfile]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const sections = React.useMemo(() => {
    if (book) {
      return [
        { id: 'introduction', title: 'Introduction' },
        { id: 'context', title: 'Context' },
        { id: 'explanation', title: 'Explanation' },
        ...(book.formulas ? [{ id: 'formulas', title: 'Formulas' }] : []),
        { id: 'examples', title: 'Examples' },
        ...(book.diagramMermaid ? [{ id: 'diagram', title: 'Diagram' }] : []),
        { id: 'summary', title: 'Summary' },
        { id: 'conclusion', title: 'Conclusion' },
      ];
    }
    if (!data?.extract) return [];
    return data.extract
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && p.length < 100)
      .slice(1, 9)
      .map((title, i) => ({ id: `section-${i}`, title, level: 3 }));
  }, [data, book]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setSidebarOpen(false);
  };

  const hasFormula = query && FORMULA_MAP[query];
  const activeTitle = book?.title || data?.title || query;
  const subtopics = SUBTOPICS_MAP[activeTitle] || [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[480] bg-[#070708] overflow-hidden flex"
        >
          {/* ── Sidebar TOC ── */}
          <AnimatePresence>
            {(sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.aside
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className={`${sidebarOpen ? 'absolute' : 'hidden lg:flex'} lg:relative left-0 top-0 bottom-0 w-[280px] bg-[#0a0a0c] border-r border-white/[0.04] flex-col z-20`}
              >
                <div className="p-6 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Chapter Index</span>
                  </div>
                  <h3 className="text-white font-bold text-sm leading-tight line-clamp-2">{book?.title || data?.title || query}</h3>
                  {(context || book?.subject) && (
                    <span className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400">
                      <i className={`fas ${getSubjectIcon(context || book?.subject || 'Science')} text-[9px]`} />
                      {context || book?.subject}
                      {book?.classLevel && ` · ${book.classLevel}`}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-none">
                  <button
                    onClick={() => scrollToSection('overview')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeSection === 'overview' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'}`}
                  >
                    Overview
                  </button>
                  {sections.map(s => (
                    <button
                      key={s.id}
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${activeSection === s.id ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'}`}
                    >
                      {s.title}
                    </button>
                  ))}
                  {!book && hasFormula && (
                    <button
                      onClick={() => scrollToSection('formula')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeSection === 'formula' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'}`}
                    >
                      <i className="fas fa-square-root-alt mr-2 text-[10px]" />
                      Key Formula
                    </button>
                  )}
                  <button
                    onClick={() => scrollToSection('sources')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${activeSection === 'sources' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'text-slate-400 hover:bg-white/[0.03] hover:text-white'}`}
                  >
                    <Quote className="w-3 h-3 inline mr-2" />
                    Sources & Citations
                  </button>
                </div>

                <div className="mt-6 p-4 rounded-3xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 mb-3">AI Study Search</div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim()) { onNavigate?.(searchQuery.trim(), book?.subject || context || 'Science'); setSearchQuery(''); } }}
                      placeholder="Ask Astra while studying"
                      className="w-full rounded-3xl border border-white/10 bg-black/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      onClick={() => {
                        if (!searchQuery.trim()) return;
                        onNavigate?.(searchQuery.trim(), book?.subject || context || 'Science');
                        setSearchQuery('');
                      }}
                      className="w-full rounded-3xl bg-blue-500/80 hover:bg-blue-400 transition-all text-sm font-black uppercase tracking-[0.2em] py-3 text-black"
                    >
                      Search Astra
                    </button>
                  </div>
                </div>

                {/* Mobile sidebar close */}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden absolute top-4 right-4 p-2 bg-white/5 rounded-xl text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ── Main Content ── */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top bar */}
            <div className="h-16 flex items-center justify-between px-4 sm:px-8 border-b border-white/[0.04] bg-[#0a0a0c]/80 backdrop-blur-xl z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-white/5 rounded-xl transition-all">
                  <Layers className="w-4 h-4 text-slate-400" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Back to Library</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {data?.wikiUrl && (
                  <a
                    href={data.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
                    title="Open on Wikipedia"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {book?.wikiUrl && (
                  <a href={book.wikiUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all" title="Wikipedia source">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto scrollbar-thin"
              onScroll={() => {
                // Detect active section on scroll
                if (!contentRef.current) return;
                const container = contentRef.current;
                const allIds = ['overview', ...sections.map(s => s.id), ...(hasFormula ? ['formula'] : []), 'sources'];
                for (let i = allIds.length - 1; i >= 0; i--) {
                  const el = document.getElementById(allIds[i]);
                  if (el && el.offsetTop <= container.scrollTop + 120) {
                    setActiveSection(allIds[i]);
                    break;
                  }
                }
              }}
            >
              <div className="max-w-3xl mx-auto px-6 sm:px-12 py-12 sm:py-16">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                    <div className="space-y-2 text-center">
                      <p className="text-white font-bold text-sm tracking-widest uppercase">{book ? 'Generating Textbook Chapter' : 'Loading Chapter'}</p>
                      <p className="text-slate-600 text-[10px] font-mono uppercase tracking-widest">{loadPhase}</p>
                    </div>
                  </div>
                ) : !data && !book ? (
                  <div className="text-center py-32">
                    <Info className="w-10 h-10 text-slate-700 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm">No data found for this topic.</p>
                  </div>
                ) : book ? (
                  <>
                    <div id="overview" className="mb-16">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                          <i className={`fas ${getSubjectIcon(book.subject)} mr-1.5`} />
                          {book.subject} · {book.classLevel}{book.curriculum ? ` · ${book.curriculum}` : ''}
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                          <Clock className="w-3 h-3" />{readTime}
                        </span>
                      </div>
                      <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">{book.title}</h1>
                      {book.images?.[0] && (
                        <div className="mt-8 rounded-2xl overflow-hidden border border-white/5">
                          <img src={book.images[0].url} alt={book.images[0].caption} className="w-full max-h-[380px] object-cover" />
                          <p className="text-[9px] text-slate-600 font-mono uppercase tracking-widest p-3 bg-black/40">{book.images[0].caption} · {book.images[0].license || 'Wikimedia Commons'}</p>
                        </div>
                      )}
                    </div>

                    {[
                      { id: 'introduction', title: 'Introduction', body: book.introduction },
                      { id: 'context', title: 'Context', body: book.context },
                      { id: 'explanation', title: 'Explanation', body: book.explanation },
                      { id: 'formulas', title: 'Formulas & Equations', body: book.formulas },
                      { id: 'examples', title: 'Worked Examples', body: book.examples },
                    ].filter(s => s.body?.trim()).map((section) => (
                      <section key={section.id} id={section.id} className="mb-14 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-white/10">{section.title}</h2>
                        <div className="text-slate-300 leading-[1.85] text-[15px]">
                          <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={mdComponents}>{section.body}</Markdown>
                        </div>
                      </section>
                    ))}

                    {book.diagramMermaid && (
                      <section id="diagram" className="mb-14 scroll-mt-24">
                        <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-white/10">Concept Flow</h2>
                        <MermaidDiagram chart={book.diagramMermaid} />
                      </section>
                    )}

                    {book.images && book.images.length > 1 && (
                      <section className="mb-14 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {book.images.slice(1).map((img, i) => (
                          <figure key={i} className="rounded-xl overflow-hidden border border-white/5">
                            <img src={img.url} alt={img.caption} className="w-full h-40 object-cover" />
                            <figcaption className="text-[9px] text-slate-600 font-mono p-2 uppercase tracking-widest">{img.caption}</figcaption>
                          </figure>
                        ))}
                      </section>
                    )}

                    {subtopics.length > 0 && (
                      <section id="subtopics" className="mb-14 scroll-mt-24 p-8 rounded-3xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <h2 className="text-2xl font-bold text-white">Chapter Subtopics</h2>
                          <span className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Deep dive guide</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {subtopics.map((topic) => (
                            <button
                              key={topic}
                              onClick={() => onNavigate?.(topic, book.subject)}
                              className="text-left p-4 rounded-3xl bg-slate-950/70 border border-white/10 hover:border-blue-500/20 hover:bg-slate-900 transition-all"
                            >
                              <div className="text-sm font-bold text-white">{topic}</div>
                              <p className="text-[11px] text-slate-400 mt-2">Tap to load the focused topic from this chapter.</p>
                            </button>
                          ))}
                        </div>
                      </section>
                    )}

                    <section id="summary" className="mb-14 scroll-mt-24 p-8 rounded-3xl bg-blue-500/[0.04] border border-blue-500/10">
                      <div className="flex items-center gap-2 mb-4 text-blue-400">
                        <ListChecks className="w-4 h-4" />
                        <h2 className="text-lg font-black uppercase tracking-widest text-[10px]">Chapter Summary</h2>
                      </div>
                      <ul className="space-y-3">
                        {(book.summary || []).map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section id="conclusion" className="mb-14 scroll-mt-24">
                      <h2 className="text-2xl font-bold text-white mb-6 pb-3 border-b border-white/10">Conclusion</h2>
                      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={mdComponents}>{book.conclusion}</Markdown>
                    </section>

                    {related.length > 0 && (
                      <div className="mt-12">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Related Chapters</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {related.map((r) => (
                            <button key={r.title} onClick={() => onNavigate?.(r.title, book.subject)} className="text-left p-4 rounded-xl border border-white/5 hover:border-white/15 bg-white/[0.02] text-sm text-slate-300 hover:text-white transition-all">
                              {r.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : data ? (
                  <>
                    {/* ── Chapter Header ── */}
                    <div id="overview" className="mb-16">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div className="flex items-center gap-3 mb-6">
                          {context && (
                            <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                              <i className={`fas ${getSubjectIcon(context)} mr-1.5`} />
                              {context}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {readTime}
                          </span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6">
                          {data.title}
                        </h1>

                        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl font-light">
                          A comprehensive exploration of <span className="text-white font-medium">{data.title}</span> —
                          from foundational principles to advanced applications, with visual aids and verified academic sources.
                        </p>

                        {/* Hero image */}
                        {data.imgSrc && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="mt-10 relative rounded-2xl overflow-hidden border border-white/[0.05] group"
                          >
                            <img
                              src={data.imgSrc}
                              alt={data.title}
                              className="w-full object-cover max-h-[420px] group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#070708] via-transparent to-transparent opacity-60" />
                            <div className="absolute bottom-4 left-4 right-4">
                              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                                <i className="fas fa-image mr-1.5" />
                                Figure 1 — Primary visual reference from Wikipedia Commons
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </div>

                    {/* ── Chapter Body ── */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="prose prose-invert prose-lg max-w-none"
                    >
                      <div className="text-slate-300 leading-[1.85] text-[15px] font-light tracking-wide space-y-6">
                        <Markdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            h2: ({ children }) => <h2 id={`section-${Math.random().toString(36).slice(2,8)}`} className="text-2xl font-bold text-white mt-16 mb-6 pb-3 border-b border-white/10 tracking-tight">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xl font-semibold text-white mt-10 mb-4 tracking-tight">{children}</h3>,
                            p: ({ children }) => <p className="mb-5 leading-[1.85] text-slate-300">{children}</p>,
                            ul: ({ children }) => <ul className="space-y-2 my-6 ml-4">{children}</ul>,
                            li: ({ children }) => <li className="flex items-start gap-3"><span className="w-1 h-1 rounded-full bg-blue-500 mt-2.5 shrink-0" /><span>{children}</span></li>,
                            a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-500/30 transition-colors">{children}</a>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-blue-500/40 pl-5 py-2 my-8 bg-blue-500/[0.03] rounded-r-xl">
                                <div className="flex items-center gap-2 mb-2 text-blue-400/60">
                                  <Lightbulb className="w-3.5 h-3.5" />
                                  <span className="text-[9px] font-black uppercase tracking-widest">Key Insight</span>
                                </div>
                                {children}
                              </blockquote>
                            ),
                            img: ({ src, alt }) => (
                              <figure className="my-10">
                                <div className="rounded-xl overflow-hidden border border-white/[0.05]">
                                  <img src={src} alt={alt || ''} className="w-full object-cover" />
                                </div>
                                <figcaption className="mt-3 text-[10px] text-slate-600 font-mono uppercase tracking-widest text-center">
                                  {alt || 'Figure — Visual reference'}
                                </figcaption>
                              </figure>
                            ),
                          }}
                        >
                          {data.extract.split(/\n\n+/).filter(Boolean).join('\n\n')}
                        </Markdown>
                      </div>
                    </motion.div>

                    {/* ── Formula Section ── */}
                    {hasFormula && (
                      <motion.div
                        id="formula"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 p-8 sm:p-10 bg-gradient-to-br from-blue-500/[0.04] to-purple-500/[0.04] border border-blue-500/10 rounded-3xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                          <i className="fas fa-square-root-alt text-5xl text-blue-500" />
                        </div>
                        <div className="flex items-center gap-3 mb-6">
                          <Brain className="w-5 h-5 text-blue-400" />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Governing Mathematical Framework</h3>
                        </div>
                        <div className="bg-black/40 rounded-2xl p-6 sm:p-8 border border-white/[0.03] text-center overflow-x-auto">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {FORMULA_MAP[query] || ''}
                          </Markdown>
                        </div>
                        <p className="mt-4 text-[10px] text-slate-600 font-mono uppercase tracking-widest text-right">
                          Encrypted Node: {Math.random().toString(16).slice(2, 8).toUpperCase()}
                        </p>
                      </motion.div>
                    )}

                    {/* ── Sources & Citations ── */}
                    <motion.div
                      id="sources"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="mt-20 pt-10 border-t border-white/[0.05]"
                    >
                      <div className="flex items-center gap-3 mb-8">
                        <Quote className="w-4 h-4 text-slate-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Verified Academic Sources</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:border-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors">
                              {data.title} — Wikipedia, The Free Encyclopedia
                            </p>
                            <p className="text-slate-600 text-[11px] mt-1">
                              Primary source for chapter content, images, and structural data.
                              Content licensed under CC BY-SA 4.0.
                            </p>
                            {data.wikiUrl && (
                              <a href={data.wikiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
                                <ExternalLink className="w-3 h-3" />
                                View Original Article
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.04] hover:border-white/10 transition-colors group">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium group-hover:text-emerald-300 transition-colors">
                              Wikimedia Commons — Image Repository
                            </p>
                            <p className="text-slate-600 text-[11px] mt-1">
                              All diagrams and photographs sourced from the Wikimedia Commons
                              open media library. Verified for educational use.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* ── Related Chapters ── */}
                    <div className="mt-20">
                      <div className="flex items-center gap-3 mb-8">
                        <Layers className="w-4 h-4 text-slate-500" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Continue Your Journey</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {related.map((r, i) => (
                          <motion.button
                            key={r.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            onClick={() => onNavigate?.(r.title, context)}
                            className="group text-left p-4 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-white/10 rounded-2xl transition-all flex items-center gap-4"
                          >
                            <div className="w-16 h-16 rounded-xl bg-black/50 border border-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                              {r.imgSrc ? (
                                <img src={r.imgSrc} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              ) : (
                                <i className={`fas ${r.icon} text-blue-500/40 text-lg`} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-white text-sm font-medium truncate group-hover:text-blue-300 transition-colors">{r.title}</p>
                              <p className="text-[10px] text-slate-600 mt-1 font-mono uppercase tracking-widest">Next Chapter</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-700 group-hover:text-blue-400 ml-auto shrink-0 transition-colors" />
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Bottom spacing */}
                    <div className="h-24" />
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
