import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, User, Sparkles, Plus, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, History, ChevronRight, LayoutGrid, Settings, HelpCircle, ThumbsUp, ThumbsDown, Activity, Cpu, ExternalLink, GraduationCap } from 'lucide-react';
import { fetchMultilingualVideos, VideoGroup, YouTubeVideo } from '../services/youtubeService';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import { AstraOrb, GeminiWave, GeminiGlow, type OrbState } from './AstraOrb';
import { useUser } from '../context/UserContext';

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

const Mermaid: React.FC<{ chart: string }> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const id = useId().replace(/:/g, '');

  useEffect(() => {
    const renderChart = async () => {
      try {
        setError(false);
        // Attempt to fix common AI-generated Mermaid issues:
        let processedChart = chart.trim();
        
        // Ensure consistent graph type if not specified
        if (!processedChart.startsWith('graph') && !processedChart.startsWith('flowchart')) {
          processedChart = 'graph TD\n' + processedChart;
        }

        let finalChartToRender = processedChart;

        try {
          // First attempt to render the unmodified (but graph-prefixed) chart
          const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}-test`, processedChart);
          // If successful, we don't need any complex regex fixes
          setSvg(renderedSvg);
          return;
        } catch (initialErr) {
          // If the initial render fails, we apply our heuristic fixes
          
          // Fix invalid node quoted syntaxes like A("Text") -> A["Text"]
          processedChart = processedChart.replace(/\("\s*([^"]+?)\s*"\)/g, '["$1"]');
          
          // Fix invalid edge text syntaxes like A -- "Text" --> B  ->  A -->|"Text"| B
          processedChart = processedChart.replace(/--\s*"?([^"]+?)"?\s*-->/g, '-->|"$1"|');

          finalChartToRender = processedChart;
        }

        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, finalChartToRender);
        setSvg(renderedSvg);
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        setError(true);
      }
    };
    renderChart();
  }, [chart, id]);

  if (error) {
    return (
      <div className="my-8 p-8 bg-red-500/5 border border-red-500/10 rounded-[40px] text-red-400/80 text-sm italic font-medium backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-3 font-black uppercase tracking-widest text-[9px] text-red-500">
          <X className="w-3.5 h-3.5" />
          Neural Schema Invalidation
        </div>
        Astra encountered a structural conflict in this visualization lattice.
      </div>
    );
  }

  if (!svg) return <div className="animate-pulse bg-white/5 h-64 rounded-[40px] flex items-center justify-center text-blue-400/40 text-[9px] font-black uppercase tracking-[0.4em] border border-white/5">Architecting Visual Logic...</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="mermaid-container my-10 bg-black/60 p-12 rounded-[48px] border border-white/5 overflow-x-auto shadow-[0_40px_80px_rgba(0,0,0,0.4)] backdrop-blur-3xl group"
    >
      <div 
        className="flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }} 
      />
    </motion.div>
  );
};

const GroundingSources: React.FC<{ metadata: any }> = ({ metadata }) => {
  if (!metadata?.groundingChunks) return null;

  const sources = metadata.groundingChunks
    .map((chunk: any) => chunk.web || chunk.maps)
    .filter(Boolean);

  if (sources.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60">
        <Sparkles className="w-3 h-3" />
        Neural Source Grounding
      </div>
      <div className="flex flex-wrap gap-3">
        {sources.map((source: any, i: number) => (
          <motion.a
            key={i}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs text-slate-400 hover:text-blue-400 transition-all backdrop-blur-md"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
            <span className="truncate max-w-[200px]">{source.title || 'Source Reference'}</span>
            <ChevronRight className="w-3 h-3 opacity-30" />
          </motion.a>
        ))}
      </div>
    </div>
  );
};

const YouTubeGallery: React.FC<{ videoData?: VideoGroup }> = ({ videoData }) => {
  const [lang, setLang] = useState<'english' | 'hindi' | 'nepali'>('english');
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideo | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  if (!videoData) return null;
  const hasVideos = videoData.english?.length > 0 || videoData.hindi?.length > 0 || videoData.nepali?.length > 0;
  if (!hasVideos) return null;

  const currentVideos = videoData[lang] || [];
  const currentVideoIds = currentVideos.map(v => v.id);

  return (
    <>
      <div className="mt-10 pt-10 border-t border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-red-500">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385-8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/60">Neural Media Network</div>
              <div className="text-sm text-white font-black uppercase tracking-widest mt-0.5">Categorized Lectures & Modules</div>
            </div>
          </div>

          <div className="flex gap-1.5 p-1.5 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto scrollbar-none">
            {(['english', 'hindi', 'nepali'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                disabled={!videoData[l] || videoData[l].length === 0}
                className={`capitalize px-5 py-2 rounded-xl text-xs font-black tracking-widest transition-all whitespace-nowrap ${lang === l ? 'bg-red-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'} ${(!videoData[l] || videoData[l].length === 0) ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {l} {videoData[l]?.length ? `(${videoData[l].length})` : ''}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div 
            key={lang}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {currentVideos.map((video, i) => (
              <motion.button
                key={video.id}
                onClick={() => {
                  setPlayingVideo(video);
                  setPlaybackError(null);
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-[32px] overflow-hidden transition-all shadow-xl text-left h-full"
              >
              <div className="relative aspect-video overflow-hidden bg-white/5">
                <img 
                  src={video.thumbnail} 
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 backdrop-blur-[2px]">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="absolute top-3 left-3 px-2 py-1 bg-blue-500/80 backdrop-blur-md rounded-md text-[8px] font-black text-white uppercase tracking-widest">
                  {i === 0 ? 'Core MODULE' : i < 4 ? 'Explainer' : 'Solving'}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-3">
                <h5 className="text-[12px] font-bold text-white line-clamp-2 leading-relaxed group-hover:text-blue-400 transition-colors" dangerouslySetInnerHTML={{__html: video.title}} />
                {video.description && (
                  <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed opacity-60 group-hover:opacity-80 transition-opacity">
                    {video.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{video.channelTitle}</span>
                  <ChevronRight className="w-3 h-3 text-slate-700 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
      </div>

      <AnimatePresence>
        {playingVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-2 md:p-4 bg-black/95 backdrop-blur-2xl overflow-y-auto" 
            onClick={() => setPlayingVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-7xl bg-[#0d0d10] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-[0_60px_150px_rgba(0,0,0,1)] border border-white/10 flex flex-col lg:flex-row min-h-[85vh] lg:h-[90vh] my-auto" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex-1 flex flex-col min-h-0 bg-black">
                <div className="flex items-center justify-between p-4 md:p-8 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-20 shrink-0">
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-white font-black uppercase tracking-widest text-[10px] md:text-sm leading-tight max-w-2xl truncate" dangerouslySetInnerHTML={{__html: playingVideo.title}} />
                    <div className="flex items-center gap-4 text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <span className="truncate max-w-[100px] md:max-w-none">{playingVideo.channelTitle}</span>
                      <span className="w-1 h-1 bg-slate-800 rounded-full" />
                      <span>{currentVideoIds.indexOf(playingVideo.id) + 1} / {currentVideoIds.length} Modules</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 ml-4">
                    <button 
                      disabled={currentVideoIds.indexOf(playingVideo.id) === 0}
                      onClick={() => {
                        const idx = currentVideoIds.indexOf(playingVideo.id);
                        if (idx > 0) setPlayingVideo(currentVideos[idx - 1]);
                      }}
                      className="w-9 h-9 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 transition-all"
                    >
                      <ChevronRight className="w-4 h-4 md:w-6 md:h-6 rotate-180" />
                    </button>
                    <button 
                      disabled={currentVideoIds.indexOf(playingVideo.id) === currentVideoIds.length - 1}
                      onClick={() => {
                        const idx = currentVideoIds.indexOf(playingVideo.id);
                        if (idx < currentVideoIds.length - 1) setPlayingVideo(currentVideos[idx + 1]);
                      }}
                      className="w-9 h-9 md:w-12 md:h-12 bg-white/5 hover:bg-white/10 disabled:opacity-20 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 transition-all"
                    >
                      <ChevronRight className="w-4 h-4 md:w-6 md:h-6" />
                    </button>
                    <button 
                      onClick={() => setPlayingVideo(null)} 
                      className="w-9 h-9 md:w-12 md:h-12 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 transition-all ml-1 md:ml-2"
                    >
                      <X className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </div>
                </div>

                <div className="relative aspect-video lg:flex-1 bg-black overflow-hidden">
                  {playbackError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center gap-6">
                       <Activity className="w-12 h-12 text-red-500 animate-pulse" />
                       <h4 className="text-white font-black uppercase tracking-widest text-lg">
                        {!navigator.onLine ? 'Network Disconnected' : 'Connection Disrupted'}
                       </h4>
                       <p className="text-slate-500 text-sm max-w-sm">
                        {!navigator.onLine 
                          ? 'Please check your internet connection and try again.' 
                          : playbackError || 'The media host refused the secure connection or the video is no longer available.'}
                       </p>
                       <button 
                         onClick={() => {
                           setPlaybackError(null);
                           const current = playingVideo;
                           setPlayingVideo(null);
                           setTimeout(() => setPlayingVideo(current), 50);
                         }}
                         className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                       >
                         Retry Synchronization
                       </button>
                    </div>
                  ) : (
                    <iframe 
                      key={playingVideo.id}
                      src={`https://www.youtube.com/embed/${playingVideo.id}?autoplay=1&rel=0&modestbranding=1&showinfo=0`} 
                      className="w-full h-full border-0 absolute inset-0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                      onError={() => {
                        if (!navigator.onLine) {
                          setPlaybackError("Network unavailable. Please check your signal.");
                        } else {
                          setPlaybackError("This content may be restricted in your region, private, or contains unsupported media codecs.");
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="w-full lg:w-[400px] border-l border-white/5 flex flex-col bg-white/[0.01]">
                <div className="p-8 flex-1 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-white/10">
                   <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center">
                          <Cpu className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Synaptic Insights</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-light leading-relaxed">
                        {playingVideo.description || "Synthesizing deep-layer metadata from the scientific repository..."}
                      </p>
                   </div>

                   <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                            <Plus className="w-4 h-4 text-yellow-500" />
                          </div>
                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Learning Path</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {currentVideos.filter(v => v.id !== playingVideo.id).slice(0, 10).map((v, idx) => (
                          <button 
                            key={v.id}
                            onClick={() => { setPlayingVideo(v); setPlaybackError(null); }}
                            className="w-full flex items-center gap-4 p-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl transition-all group text-left"
                          >
                             <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                               <img src={v.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <div className="flex-1 min-w-0">
                               <h6 className="text-[9px] text-white font-bold uppercase tracking-tight line-clamp-1" dangerouslySetInnerHTML={{__html: v.title}} />
                               <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1 block">Module {currentVideoIds.indexOf(v.id) + 1}</span>
                             </div>
                          </button>
                        ))}
                      </div>
                   </div>
                </div>

                <div className="p-8 border-t border-white/5">
                   <button 
                     onClick={() => window.open(`https://www.youtube.com/watch?v=${playingVideo.id}`, '_blank')}
                     className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 transition-all flex items-center justify-center gap-3 group"
                   >
                     External Sync Hub
                     <ExternalLink className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const NeuralStream: React.FC<{ content: string; isStreaming: boolean; groundingMetadata?: any; isSpeaking?: boolean }> = ({ content, isStreaming, groundingMetadata, isSpeaking }) => {
  return (
    <div className="prose prose-invert prose-lg max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-blue-400 prose-img:rounded-3xl prose-img:border prose-img:border-white/10 prose-p:leading-relaxed selection:bg-blue-500/30 relative">
      {isSpeaking && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute -inset-4 bg-green-500/5 rounded-[40px] pointer-events-none border border-green-500/10 shadow-[0_0_50px_rgba(34,197,94,0.05)] z-0 overflow-hidden"
        >
          <motion.div 
            animate={{ y: ['-10%', '110%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent blur-[1px] will-change-transform"
          />
        </motion.div>
      )}
      <div className="relative z-10">
        <Markdown 
          remarkPlugins={[remarkGfm, remarkMath]} 
          rehypePlugins={[rehypeKatex]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match && match[1] === 'mermaid') {
                return <Mermaid chart={String(children).replace(/\n$/, '')} />;
              }
              return <code className={className} {...props}>{children}</code>;
            }
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  );
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  feedback?: 'up' | 'down';
  groundingMetadata?: any;
  videoData?: VideoGroup;
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
};

const RobotIcon = ({ glow = false, variant = 'button' }: { glow?: boolean; variant?: 'chat' | 'sidebar' | 'welcome' | 'button' }) => {
  const is3D = variant === 'welcome' || variant === 'sidebar';

  if (is3D) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-2">
        <div className={`w-full h-full rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-500/20 transition-all duration-700 shadow-[0_0_30px_rgba(59,130,246,0.1)]`}>
          <Sparkles className={`w-1/2 h-1/2 text-blue-400 ${glow ? 'animate-pulse scale-110' : ''}`} />
          {glow && (
            <motion.div 
              animate={{ opacity: [0.1, 0.4, 0.1], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 bg-blue-400/5 blur-xl" 
            />
          )}
        </div>
      </div>
    );
  }

  // Refined professional static robot icon (Astra-style SVG)
  return (
    <div className="relative w-full h-full flex items-center justify-center p-1">
      <AnimatePresence>
        {glow && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.4 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"
          />
        )}
      </AnimatePresence>
      <svg viewBox="0 0 40 40" className="w-full h-full relative z-10 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">
        <defs>
          <linearGradient id="astraGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
        </defs>
        <motion.g
          animate={glow ? { 
            y: [0, 0.5, 0],
            rotate: [0, 0.4, -0.4, 0],
          } : {}}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          {/* Main Head Shell */}
          <path d="M20 5C12 5 7 10 7 18C7 26 12 32 20 32C28 32 33 26 33 18C33 10 28 5 20 5Z" fill="#050505" stroke="url(#astraGrad)" strokeWidth="0.8" />
          {/* Face Plate */}
          <path d="M12 15C12 12 15 10 20 10C25 10 28 12 28 15V22C28 26 24 28 20 28C16 28 12 26 12 22V15Z" fill="#000" stroke="white/10" strokeWidth="0.5" />
          {/* Eye Visors */}
          <motion.ellipse 
            cx="17" cy="18" rx="2.5" ry="1.5" 
            initial={{ opacity: 1, scaleY: 1 }}
            animate={{ 
              opacity: glow ? [0.4, 1, 0.4] : 1, 
              scaleY: [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1] 
            }} 
            transition={{ 
              duration: 7, 
              repeat: Infinity, 
              times: [0, 0.3, 0.35, 0.37, 0.39, 0.7, 0.75, 0.77, 0.79, 0.81, 0.83, 1] 
            }}
            fill="url(#eyeGlow)" 
          />
          <motion.ellipse 
            cx="23" cy="18" rx="2.5" ry="1.5" 
            initial={{ opacity: 1, scaleY: 1 }}
            animate={{ 
              opacity: glow ? [0.4, 1, 0.4] : 1, 
              scaleY: [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1] 
            }} 
            transition={{ 
              duration: 7, 
              repeat: Infinity, 
              times: [0, 0.3, 0.35, 0.37, 0.39, 0.7, 0.75, 0.77, 0.79, 0.81, 0.83, 1] 
            }}
            fill="url(#eyeGlow)" 
          />
          {/* Detail Lines */}
          <path d="M15 8L10 6M25 8L30 6" stroke="white/20" strokeWidth="0.5" strokeLinecap="round" />
          <circle cx="20" cy="5" r="1" fill="#3b82f6" opacity="0.8" />
        </motion.g>
      </svg>
    </div>
  );
};

const TeacherViewport = () => (
  <div className="relative w-full aspect-square md:aspect-auto md:h-[440px] bg-black/40 rounded-[32px] overflow-hidden border border-white/10 group shadow-2xl">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />
    <div className="absolute inset-0">
      <iframe 
        title="Astra Lumen II, a rigged companion android" 
        frameBorder="0" 
        allowFullScreen 
        className="w-full h-full absolute top-2 scale-[0.7] grayscale-[0.5] group-hover:grayscale-0 transition-all duration-1000 pointer-events-none"
        allow="autoplay; fullscreen; xr-spatial-tracking" 
        src="https://sketchfab.com/models/84761f55aa17493d9b226bb1f7101428/embed?autostart=1&preload=1&transparent=1&ui_hint=0&ui_infos=0&ui_stop=0&ui_watermark=0&orbit=0&camera=0"
      />
    </div>
    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
      <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />
        <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.2em]">Astra is Online</span>
      </div>
    </div>
  </div>
);

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

interface ChatbotProps {
  onStateChange?: (isOpen: boolean) => void;
  externalOpen?: boolean;
  hideToggle?: boolean;
  onOpenAITutor?: () => void;
  onOpenVoice?: () => void;
}

export const Chatbot: React.FC<ChatbotProps> = ({ onStateChange, externalOpen, hideToggle, onOpenAITutor, onOpenVoice }) => {
  const { effectiveTier } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  const [isConversationMode, setIsConversationMode] = useState(false);
  const [conversationTimeLeft, setConversationTimeLeft] = useState(30 * 60);
  const conversationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleConversationMode = (enabled: boolean) => {
    if (enabled) {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      setIsConversationMode(true);
      setConversationTimeLeft(30 * 60);
      generateVoiceRef.current(
        "Hi, I'm Astra — your premium voice tutor built by SAHIL KARNA for Axyomis-X. I'm ready for a voice conversation. Just speak when you're ready.",
        false,
        () => scheduleConversationListeningRef.current(600)
      );
    } else {
      setIsConversationMode(false);
      stopCurrentAudio();
      if (listeningRestartTimerRef.current) {
        clearTimeout(listeningRestartTimerRef.current);
        listeningRestartTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      if (conversationTimerRef.current) {
        clearInterval(conversationTimerRef.current);
        conversationTimerRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (isConversationMode) {
      conversationTimerRef.current = setInterval(() => {
        setConversationTimeLeft(prev => {
          if (prev <= 1) {
            toggleConversationMode(false);
            const limitMsg: Message = {
              id: generateId(),
              role: 'assistant',
              content: "### ⏲️ Temporal Limit Reached\nOur neural voice link has reached its 30-minute safety threshold. We can continue via text, or you can re-initialize the voice uplink.",
            };
            setMessages(prevMsgs => [...prevMsgs, limitMsg]);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (conversationTimerRef.current) {
        clearInterval(conversationTimerRef.current);
        conversationTimerRef.current = null;
      }
    }
    return () => {
      if (conversationTimerRef.current) clearInterval(conversationTimerRef.current);
    };
  }, [isConversationMode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== isOpen) {
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);

  useEffect(() => {
    if (!externalOpen && isConversationMode) {
      toggleConversationMode(false);
    }
  }, [externalOpen]);
  const bootCycleRef = useRef(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    typeof window === 'undefined' ? true : !window.matchMedia('(max-width: 767px)').matches
  );
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(false);
  const [showBootSequence, setShowBootSequence] = useState(false);
  const [bootText, setBootText] = useState("");
  
  // Voice Settings State
  const [voicePersona, setVoicePersona] = useState('Aoede'); 
  const [speakingRate, setSpeakingRate] = useState(1.0);
  const [speakingPitch, setSpeakingPitch] = useState(1.0);

  const [isListening, setIsListening] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState<string>('Initializing');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const [isAstraSpeaking, setIsAstraSpeaking] = useState(false);

  const isConversationModeRef = useRef(false);
  const isAstraSpeakingRef = useRef(false);
  const isAnalyzingRef = useRef(false);
  const isLoadingRef = useRef(false);
  const isListeningRef = useRef(false);
  const handleSendRef = useRef<(manualInput?: string) => void>(() => {});
  const generateVoiceRef = useRef<(text: string, robotic?: boolean, onEnded?: () => void) => void>(() => {});
  const scheduleConversationListeningRef = useRef<(delayMs?: number) => void>(() => {});
  const listeningRestartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const preferredVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => { isConversationModeRef.current = isConversationMode; }, [isConversationMode]);
  useEffect(() => { isAstraSpeakingRef.current = isAstraSpeaking; }, [isAstraSpeaking]);
  useEffect(() => { isAnalyzingRef.current = isAnalyzing; }, [isAnalyzing]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      preferredVoiceRef.current =
        voices.find(v => v.name.toLowerCase().includes('samantha')) ||
        voices.find(v => v.name.toLowerCase().includes('google uk english female')) ||
        voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        null;
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // Web Speech API TTS ref
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Audio Feedback Logic - Engineered for Luxury
  const playUISound = (type: 'listen_start' | 'listen_stop' | 'thinking' | 'answer_start' | 'complete') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      masterGain.gain.setValueAtTime(0, now);

      if (type === 'listen_start') {
        // Soft chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.15);
        osc2.frequency.setValueAtTime(1318.51, now);
        osc1.type = 'sine';
        osc2.type = 'sine';
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.08, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.connect(g); osc2.connect(g); g.connect(ctx.destination);
        osc1.start(now); osc2.start(now);
        osc1.stop(now + 0.4); osc2.stop(now + 0.4);
      } else if (type === 'listen_stop') {
        // Satisfying thud
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.12, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.3);
      } else if (type === 'thinking') {
        // Pulsing hum // triangle
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, now);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.03, now + 0.2);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(g); g.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.5);
      } else if (type === 'answer_start') {
        // High-end digital notification (crystal bell)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const g = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(1046.50, now); // C6
        osc2.frequency.setValueAtTime(1318.51, now); // E6
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.08, now + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc1.connect(g); osc2.connect(g); g.connect(ctx.destination);
        osc1.start(now); osc2.start(now);
        osc1.stop(now + 0.6); osc2.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Audio feedback failed', e);
    }
  };

  const playThinkingSound = () => playUISound('thinking');
  const playAnswerSound = () => playUISound('answer_start'); 
  const playCompleteSound = () => playUISound('complete');
  const playInputSound = () => playUISound('listen_start');

  const inputRef = useRef('');

  const scheduleConversationListening = (delayMs = 400) => {
    if (listeningRestartTimerRef.current) clearTimeout(listeningRestartTimerRef.current);
    listeningRestartTimerRef.current = setTimeout(() => {
      if (!isConversationModeRef.current) return;
      if (isAstraSpeakingRef.current || isAnalyzingRef.current || isLoadingRef.current || isListeningRef.current) return;
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Could not restart mic', e);
      }
    }, delayMs);
  };
  scheduleConversationListeningRef.current = scheduleConversationListening;

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        playUISound('listen_start');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        inputRef.current = transcript;
      };
      recognition.onend = () => {
        setIsListening(false);
        isListeningRef.current = false;
        playUISound('listen_stop');
        if (!isConversationModeRef.current) return;

        const transcript = inputRef.current.trim();
        if (transcript) {
          const send = handleSendRef.current;
          inputRef.current = '';
          setInput('');
          send(transcript);
          return;
        }

        if (!isAstraSpeakingRef.current && !isAnalyzingRef.current && !isLoadingRef.current) {
          scheduleConversationListeningRef.current(800);
        }
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        isListeningRef.current = false;
        if (event.error === 'not-allowed') {
          const errorMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: "### ⚠️ Mic Access Denied\nMicrophone access was denied. Please ensure you have granted permission in your browser settings. If you're in the AI Studio preview, you may need to open the application in a new tab to bypass iframe permission constraints."
          };
          setMessages(prev => [...prev, errorMsg]);
        } else if (event.error === 'network') {
          const errorMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: "### ⚠️ System Disruption\nA network error occurred while processing your voice query. Please verify your connection and try again."
          };
          setMessages(prev => [...prev, errorMsg]);
        } else if (isConversationModeRef.current && ['no-speech', 'aborted', 'audio-capture'].includes(event.error)) {
          scheduleConversationListeningRef.current(1000);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    try {
      if (isListening) {
        recognitionRef.current?.stop();
      } else {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        recognitionRef.current?.start();
      }
    } catch (e) {
      console.error('Speech recognition toggle failed', e);
      // Attempt recovery on next tick
      setTimeout(() => setIsListening(false), 100);
    }
  };

  const stopCurrentAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Source might have already finished
      }
      audioSourceRef.current = null;
    }
    setIsAstraSpeaking(false);
  };


  // Web Speech API TTS — free, works on Android WebView + all browsers
  const generateVoice = (text: string, _isRobotic: boolean = false, onEnded?: () => void) => {
    if ((!isVoiceOutputEnabled && !isConversationModeRef.current) || !window.speechSynthesis) {
      if (onEnded) onEnded();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[#*`\[\]]/g, '').replace(/\[YT_SEARCH:.*?\]/gs, '').substring(0, 800);
      if (!cleanText.trim()) {
        setIsAstraSpeaking(false);
        isAstraSpeakingRef.current = false;
        if (onEnded) onEnded();
        return;
      }
      const utt = new SpeechSynthesisUtterance(cleanText);
      utt.rate = speakingRate;
      utt.pitch = speakingPitch;
      utt.volume = 1;
      if (preferredVoiceRef.current) utt.voice = preferredVoiceRef.current;
      utt.onstart = () => {
        setIsAstraSpeaking(true);
        isAstraSpeakingRef.current = true;
      };
      utt.onend = () => {
        setIsAstraSpeaking(false);
        isAstraSpeakingRef.current = false;
        if (onEnded) onEnded();
      };
      utt.onerror = () => {
        setIsAstraSpeaking(false);
        isAstraSpeakingRef.current = false;
        if (onEnded) onEnded();
      };
      speechSynthRef.current = utt;
      window.speechSynthesis.speak(utt);
    } catch {
      setIsAstraSpeaking(false);
      isAstraSpeakingRef.current = false;
      if (onEnded) onEnded();
    }
  };
  generateVoiceRef.current = generateVoice;

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lyra_academic_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save specific session to history
  useEffect(() => {
    if (messages.length > 0 && activeSessionId) {
      setSessions(prev => {
        const existing = prev.find(s => s.id === activeSessionId);
        let updated: ChatSession[];
        
        if (existing) {
          updated = prev.map(s => s.id === activeSessionId ? { ...s, messages, timestamp: Date.now() } : s);
        } else {
          // Generate title from first user message
          const firstUserMsg = messages.find(m => m.role === 'user')?.content || 'New Academic Session';
          const title = firstUserMsg.length > 30 ? firstUserMsg.substring(0, 30) + '...' : firstUserMsg;
          
          updated = [{
            id: activeSessionId,
            title,
            messages,
            timestamp: Date.now()
          }, ...prev];
        }
        
        localStorage.setItem('lyra_academic_history', JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, activeSessionId]);

  const startNewSession = () => {
    setMessages([]);
    setActiveSessionId(null);
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveSessionId(session.id);
    // Close the drawer on mobile after picking a session
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setIsSidebarOpen(false);
    }
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('lyra_academic_history', JSON.stringify(updated));
    if (activeSessionId === id) {
      startNewSession();
    }
  };

const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    if (isOpen) {
      const bootPhrase = "HELLO I AM ASTRA THE ROBO SPEED ONE TERAHEARTZ MEMORY ONE ZETABYTE";

      setShowBootSequence(true);
      setBootText(bootPhrase);
      
      // Safety timeout to hide boot sequence
      const tSafety = setTimeout(() => {
         setShowBootSequence(false);
         scrollToBottom('smooth');
      }, 2800);

      return () => { 
        clearTimeout(tSafety);
        stopCurrentAudio();
      };
    }
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    const chatContainer = document.getElementById('chat-scroll-container');
    if (!chatContainer) return;

    let isScrolling = false;

    const isNearBottom = () => {
      const threshold = 180;
      return chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < threshold;
    };

    const performScroll = () => {
      if (!isScrolling && (isNearBottom() || isAnalyzing)) {
        isScrolling = true;
        chatContainer.scrollTo({
          top: chatContainer.scrollHeight,
          behavior: isAnalyzing ? 'auto' : 'smooth'
        });
        requestAnimationFrame(() => { isScrolling = false; });
      }
    };

    const mutationObserver = new MutationObserver(performScroll);
    mutationObserver.observe(chatContainer, { childList: true, subtree: true, characterData: true });

    return () => {
      mutationObserver.disconnect();
    };
  }, [messages.length, isAnalyzing]); // Stable dependency on length instead of full array

  const handleSend = async (manualInput?: string) => {
    const finalInput = manualInput || input;
    if (!finalInput.trim() || isLoading) return;

    // Initialize session ID if it's the first message
    if (!activeSessionId) {
      setActiveSessionId(generateId());
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: finalInput
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    isLoadingRef.current = true;
    setIsAnalyzing(true);
    isAnalyzingRef.current = true;
    setAnalysisPhase('Initializing Neural Core');

    try {
      setHasInteracted(true);
      const inVoiceMode = isConversationModeRef.current;
      // Free tier gets a small processing delay — skip in voice mode for responsiveness
      if (effectiveTier === 'free' && !inVoiceMode) {
        await new Promise(resolve => setTimeout(resolve, 1800));
      }
      // Phase 1: Local Pre-processing animations
      playThinkingSound();
      await new Promise(resolve => setTimeout(resolve, inVoiceMode ? 200 : 800));
      setAnalysisPhase('Accessing Neural Archives');
      await new Promise(resolve => setTimeout(resolve, inVoiceMode ? 300 : 1000));
      setAnalysisPhase('Calibrating Analogies');
      
      const loadingInterval = setInterval(() => {
        const extraPhases = [
          'Cross-Referencing CDC Protocols',
          'Optimizing Semantic Density',
          'Verifying Logical Integrity',
          'Synthesizing Mentor Insights'
        ];
        setAnalysisPhase(prev => {
          const currentIndex = extraPhases.indexOf(prev);
          return extraPhases[(currentIndex + 1) % extraPhases.length];
        });
      }, 2500);

      // Call Groq via the secure API proxy
      const groqMessages = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMessage.content }
      ];

      const groqRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: groqMessages }),
      });

      clearInterval(loadingInterval);
      setAnalysisPhase('Compiling Result');

      if (!groqRes.ok) {
        const errData = await groqRes.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `HTTP ${groqRes.status}`);
      }

      const groqData = await groqRes.json() as { engine: string; reply: string };
      const fullContent = groqData.reply || '';

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: fullContent.replace(/\[YT_SEARCH:.*?\]/gs, ''),
        isStreaming: false
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      playAnswerSound();

      // Voice only auto-plays in conversation mode (or when explicitly enabled by user)
      if (inVoiceMode || isVoiceOutputEnabled) {
        generateVoice(fullContent.replace(/\[YT_SEARCH:.*?\]/gs, ''), false, () => {
          if (isConversationModeRef.current) {
            scheduleConversationListeningRef.current(500);
          }
        });
      }

      let videoTopic = '';
      let videoLevel = '';
      const ytMatch = fullContent.match(/\[YT_SEARCH:\s*(\{.*?\})\s*\]/);
      if (ytMatch && ytMatch[1]) {
        try {
          const parsed = JSON.parse(ytMatch[1]);
          videoTopic = parsed.topic;
          videoLevel = parsed.level;
        } catch(e) {}
      }

      const finalDisplayContent = fullContent.replace(/\[YT_SEARCH:.*?\]/gs, '').trim();
      markStreamingComplete(assistantMessage.id, finalDisplayContent);
      
      // Skip video fetch during voice conversation for faster turn-around
      if (inVoiceMode) {
        return;
      }

      // Fetch related videos based on content topic - IMPROVED Extraction
      try {
        if (!videoTopic) {
          // 0. Clean the content to remove code blocks for topic extraction
          const cleanContent = finalDisplayContent.replace(/```[\s\S]*?```/g, '').trim();

          // 1. Look for the first markdown heading
          const headingMatch = cleanContent.match(/^#+\s+(.+)$/m);
          videoTopic = headingMatch ? headingMatch[1] : '';

          // 2. Fallback
          if (videoTopic.length < 3) {
            const firstLine = cleanContent.split('\n').find(l => l.trim().length > 0) || '';
            videoTopic = firstLine.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
          }

          // 3. Last Fallback: User's original query if AI response is too generic
          if (videoTopic.length < 3 || videoTopic.toLowerCase().includes('certainly') || videoTopic.toLowerCase().includes('here is')) {
            videoTopic = userMessage.content.substring(0, 80);
          }
        }

        const relatedVideos = await fetchMultilingualVideos(videoTopic, videoLevel);
        setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { ...m, videoData: relatedVideos } : m));
      } catch (e) {
        console.warn('Video fetch failed', e);
      }

  } catch (error: any) {
      console.error("Chatbot Error:", error);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      
      let errorMessage = "Sorry, something went wrong. Please try again.";
      
      const errStr = JSON.stringify(error) + (error?.message || '');
      if (errStr.includes('429') || error?.status === 429 || errStr.includes('rate_limit') || errStr.includes('quota')) {
        errorMessage = "ASTRA is momentarily overloaded (rate limit reached). Please wait a few seconds and try again.";
      } else if (errStr.includes('401') || errStr.includes('403') || errStr.includes('API_KEY')) {
        errorMessage = "AI service authentication error. Please contact support.";
      } else if (errStr.includes('404') || error?.status === 404) {
        errorMessage = "The AI service is temporarily unavailable. Please try again in a moment.";
      }

      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: errorMessage }]);
      if (isConversationModeRef.current) {
        generateVoice(errorMessage, false, () => scheduleConversationListeningRef.current(600));
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };
  handleSendRef.current = handleSend;

  const markStreamingComplete = (id: string, content: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content, isStreaming: false } : m));
    playCompleteSound();
  };

  const handleFeedback = (messageId: string, type: 'up' | 'down') => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, feedback: m.feedback === type ? undefined : type } : m
    ));
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            className="fixed inset-0 z-[420] bg-black/60 flex flex-col md:flex-row overflow-hidden font-sans selection:bg-blue-500/20 h-[100dvh]"
          >
            {/* Mobile sidebar backdrop */}
            {isSidebarOpen && (
              <div
                onClick={() => setIsSidebarOpen(false)}
                className="md:hidden fixed inset-0 z-[10] bg-black/60 backdrop-blur-sm"
              />
            )}
            {/* Sidebar (drawer on mobile, in-flow on desktop) */}
            <motion.div
              initial={false}
              animate={{
                width: isSidebarOpen ? 340 : 0,
                opacity: isSidebarOpen ? 1 : 0,
                x: isSidebarOpen ? 0 : -20
              }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-col h-full bg-[#050505]/95 border-r border-white/5 relative overflow-hidden backdrop-blur-xl fixed md:relative inset-y-0 left-0 z-[20] md:z-auto`}
            >
              <div className="w-[340px] h-full flex flex-col p-10 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent">
                <div className="flex items-center gap-5 mb-14">
                  <div className="w-14 h-14 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-center p-3 relative group shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/10 blur-2xl opacity-100" />
                    <Sparkles className="w-full h-full text-blue-400 relative z-10" />
                  </div>
                  <div>
                    <h2 className="text-white font-[900] tracking-[0.4em] text-sm uppercase">Astra</h2>
                    <p className="text-[10px] text-blue-500 font-black tracking-[0.4em] uppercase mt-1">Intelligence Core 2.0</p>
                  </div>
                </div>
                
                  <div className="mb-10 px-2">
                    <div className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      AI Connection Synchronized
                    </div>
                  </div>
                
                <button 
                  onClick={startNewSession} 
                  className="flex items-center gap-5 w-full bg-white/[0.03] hover:bg-white/[0.08] text-white/90 hover:text-white px-6 py-5 rounded-[24px] transition-all mb-12 group border border-white/5 shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
                >
                  <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform text-blue-500" />
                  <span className="text-base font-black tracking-wide">Synthesize Session</span>
                </button>

                <div className="flex-1 space-y-10 overflow-y-auto scrollbar-none">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.4em] text-slate-700 font-black px-4 mb-8">Interaction History</div>
                    <div className="space-y-3">
                      {sessions.length === 0 ? (
                        <div className="px-4 py-8 text-center border border-dashed border-white/5 rounded-2xl">
                          <p className="text-[10px] text-slate-800 uppercase tracking-widest font-black">No logs found</p>
                        </div>
                      ) : (
                        sessions.map((session) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={session.id} 
                            onClick={() => loadSession(session)}
                            onKeyDown={(e) => e.key === 'Enter' && loadSession(session)}
                            role="button"
                            tabIndex={0}
                            className={`flex items-center gap-5 w-full px-5 py-4 rounded-2xl text-sm transition-all group border cursor-pointer outline-none ${
                              activeSessionId === session.id 
                                ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                                : 'hover:bg-white/[0.04] text-slate-500 hover:text-slate-100 border-transparent hover:border-white/5'
                            }`}
                          >
                            <History className={`w-4 h-4 shrink-0 transition-opacity ${activeSessionId === session.id ? 'opacity-100 text-blue-500' : 'opacity-40 group-hover:opacity-100'}`} />
                            <div className="flex-1 text-left min-w-0">
                              <div className="truncate font-bold tracking-wide">{session.title}</div>
                              <div className="text-[9px] opacity-40 uppercase tracking-[0.1em] mt-0.5">
                                {new Date(session.timestamp).toLocaleDateString()}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => deleteSession(e, session.id)}
                              className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                            >
                              <X className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 space-y-2">
                  <button className="flex items-center gap-5 w-full hover:bg-white/[0.04] text-slate-500 hover:text-slate-100 px-5 py-4 rounded-2xl text-sm transition-all group">
                    <LayoutGrid className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
                    <span className="font-black tracking-widest uppercase text-[10px]">Topic Map</span>
                  </button>
                  <button 
                    onClick={() => setIsGuideOpen(true)}
                    className="flex items-center gap-5 w-full hover:bg-white/[0.04] text-slate-500 hover:text-slate-100 px-5 py-4 rounded-2xl text-sm transition-all group"
                  >
                    <HelpCircle className="w-5 h-5 group-hover:text-blue-500 transition-colors" />
                    <span className="font-black tracking-widest uppercase text-[10px]">Documentation</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full bg-[#050505] relative">
              <AnimatePresence>
                {showBootSequence && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black"
                  >
                    <div className="flex flex-col items-center">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="w-24 h-24 rounded-full border-b-4 border-t-4 border-[var(--accent)] mb-8 opacity-80"
                      />
                      <motion.p
                        key={bootText}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-white font-mono text-xl tracking-[0.2em] uppercase max-w-lg text-center"
                      >
                        {bootText}
                      </motion.p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Top Navigation */}
              <div className="w-full h-20 flex items-center justify-between px-8 border-b border-white/[0.03] bg-black/20 backdrop-blur-3xl z-40">
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2.5 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                  >
                    <motion.div initial={{ rotate: 180 }} animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
                      <ChevronRight className="w-6 h-6" />
                    </motion.div>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center p-1">
                      <Sparkles className="w-full h-full text-blue-400" />
                    </div>
                    <span className="text-white font-[900] tracking-[0.4em] text-[10px] uppercase opacity-90">Astra Lumen II</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenAITutor && (
                    <button
                      onClick={() => {
                        window.speechSynthesis?.cancel();
                        toggleConversationMode(false);
                        setIsOpen(false);
                        onStateChangeRef.current?.(false);
                        onOpenAITutor();
                      }}
                      className="p-3 hover:bg-cyan-500/10 rounded-xl transition-all text-slate-500 hover:text-cyan-400 border border-transparent hover:border-cyan-500/20"
                      title="Open AI Tutor"
                    >
                      <GraduationCap className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => setIsVoiceOutputEnabled(!isVoiceOutputEnabled)}
                    className={`p-3 rounded-xl transition-all ${isVoiceOutputEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-slate-500 hover:text-white bg-white/5'}`}
                    title={isVoiceOutputEnabled ? "Disable Voice Output" : "Enable Voice Output"}
                  >
                    {isVoiceOutputEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-3 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => { window.speechSynthesis?.cancel(); setIsOpen(false); onStateChangeRef.current?.(false); }}
                    className="p-2.5 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white flex items-center gap-1.5"
                    title="Close chat"
                  >
                    <X className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Close</span>
                  </button>
                </div>
              </div>

              {/* Interaction View — centered chat */}
              <div className="flex-1 w-full flex flex-col items-center overflow-y-auto scrollbar-none px-6 py-12 h-0 relative scroll-smooth" id="chat-scroll-container">
                <div className="w-full max-w-3xl space-y-12">
                  {messages.length === 0 ? (
                    <motion.div 
                      key="welcome"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="py-20 text-center space-y-12"
                    >
                      <div className="space-y-4">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none bg-gradient-to-b from-white to-white/20 bg-clip-text text-transparent">
                          Scientific <br /> Intelligence.
                        </h1>
                        <p className="text-slate-500 font-medium tracking-widest text-[9px] uppercase max-w-md mx-auto opacity-60">
                          Astra is Online & Ready to Help
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-8">
                        {[
                          "Explain Quantum Entanglement",
                          "Synthesize CRISPR methodology",
                          "Map the vector space of LLMs",
                          "Relativistic time dilation laws"
                        ].map((prompt, i) => (
                          <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.5 }}
                            onClick={() => setInput(prompt)}
                            className="text-left px-6 py-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 text-slate-400 hover:text-white transition-all text-sm font-medium"
                          >
                            {prompt}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-12 pb-40">
                      {messages.map((m, idx) => (
                        <motion.div 
                          key={m.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                          className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                        >
                          <div className={`max-w-[85%] ${m.role === 'user' ? 'bg-white/[0.05] px-6 py-4 rounded-3xl border border-white/5' : 'w-full'}`}>
                            {m.role === 'assistant' ? (
                              <div className="flex gap-6">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center p-1.5 shrink-0 mt-1 relative">
                                  {m.role === 'assistant' && idx === messages.length - 1 && isAstraSpeaking && (
                                    <motion.div 
                                      animate={{ rotate: 360 }}
                                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                      className="absolute -inset-1 rounded-lg border-2 border-green-500/40 border-t-transparent"
                                    />
                                  )}
                                  <RobotIcon glow={m.isStreaming || (idx === messages.length - 1 && isAstraSpeaking)} variant="chat" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <NeuralStream 
                                    content={m.content} 
                                    isStreaming={!!m.isStreaming} 
                                    groundingMetadata={m.groundingMetadata}
                                    isSpeaking={idx === messages.length - 1 && isAstraSpeaking}
                                  />
                                  {!m.isStreaming && <GroundingSources metadata={m.groundingMetadata} />}
                                  {!m.isStreaming && m.videoData && <YouTubeGallery videoData={m.videoData} />}
                                </div>
                              </div>
                            ) : (
                              <div className="text-white font-medium text-lg leading-snug">{m.content}</div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                      
                      {isAnalyzing && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-6">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center p-1.5 shrink-0 animate-pulse">
                            <RobotIcon glow variant="chat" />
                          </div>
                          <div className="space-y-4 pt-1">
                            <div className="flex items-center gap-3 text-[10px] font-black text-blue-500 tracking-[0.3em] uppercase opacity-60">
                              <Sparkles className="w-3 h-3 animate-spin-slow" />
                              <span>{analysisPhase}</span>
                            </div>
                            <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                animate={{ x: ['-100%', '200%'] }} 
                                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                className="w-1/2 h-full bg-blue-400 opacity-40 shadow-[0_0_10px_rgba(96,165,250,0.5)]" 
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </div>


              {/* Input Area - Minimal Gemini Style */}
              <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 pt-3 flex-shrink-0"
                style={{ paddingBottom: 'max(20px, calc(12px + env(safe-area-inset-bottom)))' }}
              >
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative group"
                >
                  <div className="bg-[#111] border border-white/10 focus-within:border-white/20 rounded-[32px] transition-all flex items-end p-2 pr-4 shadow-2xl">
                    <textarea 
                      rows={1}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder="Ask Astra..."
                      className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 py-5 px-6 resize-none min-h-[64px] max-h-48 scrollbar-none text-lg"
                    />
                    <div className="flex items-center gap-2 pb-2">
                       {/* Voice Input Toggle */}
                       <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        type="button" 
                        onClick={toggleListening}
                        className={`p-3 transition-all rounded-xl ${isListening ? 'text-red-500 bg-red-500/10' : 'text-slate-500 hover:text-white'}`}
                        title={isListening ? "Stop Listening" : "Voice Input"}
                      >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </motion.button>

                       <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(59,130,246,0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        type="button" 
                        onClick={() => {
                          if (onOpenVoice) {
                            setIsOpen(false);
                            onStateChangeRef.current?.(false);
                            onOpenVoice();
                          }
                        }}
                        className="p-3.5 rounded-2xl border transition-all shadow-xl relative group/mic text-blue-400 bg-blue-500/5 border-blue-500/10 hover:bg-blue-500/15"
                        title="Open Talk with Astra (Voice)"
                      >
                        <div className="absolute inset-0 blur-xl opacity-0 group-hover/mic:opacity-100 transition-opacity bg-blue-500/10" />
                        <Volume2 className="w-6 h-6 relative z-10" />
                      </motion.button>
                      <button 
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`p-3 rounded-full transition-all ${
                          input.trim() && !isLoading 
                            ? 'bg-blue-600 text-white shadow-lg' 
                            : 'text-slate-700'
                        }`}
                      >
                        <Send className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </form>
                <div className="text-center mt-4">
                  <p className="text-[10px] text-slate-700 font-[900] uppercase tracking-[0.3em] opacity-40">
                    Astra AI Assistant v3.0 | Founded by SAHIL KARNA | Online
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[250] flex items-center justify-center p-6 md:p-12 pointer-events-none"
            >
              <div className="w-full max-w-2xl bg-[#050505] border border-white/10 rounded-[48px] shadow-[0_60px_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col pointer-events-auto backdrop-blur-3xl">
                <div className="h-24 px-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                      <Settings className="w-6 h-6" />
                    </div>
                    <h3 className="text-white font-black tracking-[0.2em] uppercase text-lg">AI Configuration</h3>
                  </div>
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 scrollbar-none space-y-12">
                  {/* Neural Interaction Mode */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-white font-black tracking-widest uppercase text-sm mb-1">Talk with Astra</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
                          Full-screen voice mode with Gemini-style visuals — free 30 min sessions.
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          setIsSettingsOpen(false);
                          setIsOpen(false);
                          onStateChangeRef.current?.(false);
                          onOpenVoice?.();
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-[10px] font-black uppercase tracking-widest shrink-0"
                      >
                        Open Voice
                      </button>
                    </div>
                  </div>

                  {/* Persona Selection */}
                  <div>
                    <h4 className="text-blue-500 font-black tracking-widest uppercase text-xs mb-6">Scientific Persona</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { id: 'Aoede', name: 'Intelligence', desc: 'Multilingual Scientific' },
                        { id: 'Kore', name: 'Nova', desc: 'Melodic Investigator' },
                        { id: 'Charon', name: 'Sage', desc: 'Hindi/Nepali/Spanish Support' },
                        { id: 'Puck', name: 'Echo', desc: 'Energetic Theorist' }
                      ].map((persona) => (
                        <button
                          key={persona.id}
                          onClick={() => setVoicePersona(persona.id)}
                          className={`flex flex-col p-6 rounded-3xl border transition-all text-left group ${
                            voicePersona === persona.id 
                              ? 'bg-blue-600/10 border-blue-500/40 text-white' 
                              : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          <span className={`font-black uppercase tracking-widest text-sm mb-1 ${voicePersona === persona.id ? 'text-blue-400' : 'group-hover:text-white'}`}>
                            {persona.name}
                          </span>
                          <span className="text-[10px] opacity-60 uppercase tracking-widest">{persona.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speech Parameters */}
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-blue-500 font-black tracking-widest uppercase text-xs">Transmission Rate</h4>
                        <span className="text-white font-mono text-sm">{speakingRate}x</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={speakingRate}
                        onChange={(e) => setSpeakingRate(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        <span>Largo</span>
                        <span>Presto</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-blue-500 font-black tracking-widest uppercase text-xs">Phonic Resonance</h4>
                        <span className="text-white font-mono text-sm">{speakingPitch}</span>
                      </div>
                      <input 
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.05"
                        value={speakingPitch}
                        onChange={(e) => setSpeakingPitch(parseFloat(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between mt-2 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        <span>Gravitas</span>
                        <span>Ether</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <p className="text-[10px] text-slate-700 leading-relaxed uppercase tracking-widest text-center">
                      Voice parameters are applied in real-time during the next AI transmission.
                    </p>
                  </div>
                </div>
                
                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-center">
                  <button 
                    onClick={() => setIsSettingsOpen(false)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest uppercase text-xs px-10 py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
                  >
                    Apply Config
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isGuideOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12 pointer-events-none"
          >
              <div className="w-full max-w-4xl max-h-[85vh] bg-[#050505] border border-white/10 rounded-[48px] shadow-[0_60px_120px_rgba(0,0,0,1)] overflow-hidden flex flex-col pointer-events-auto backdrop-blur-3xl">
                <div className="h-24 px-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-white font-black tracking-[0.2em] uppercase text-lg">Astra Documentation v1.0</h3>
                  </div>
                  <button 
                    onClick={() => setIsGuideOpen(false)}
                    className="p-3 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 scrollbar-none">
                  <div className="prose prose-invert prose-lg max-w-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-blue-500 font-black tracking-widest uppercase text-xs mb-4">01. Astra Polymath</h4>
                        <p className="text-slate-300 leading-relaxed font-medium">
                          Astra is a **Sophisticated Neural Mentor** architected for advanced academic inquiry. She balances **high-order scientific synthesis** with humanized, motivating interaction to ensure deep theoretical understanding.
                        </p>
                        
                        <h4 className="text-blue-500 font-black tracking-widest uppercase text-xs mt-10 mb-4">02. Theoretical Matrix</h4>
                        <ul className="space-y-4 list-none p-0">
                          <li className="flex gap-4">
                            <div className="w-6 h-6 bg-white/5 rounded flex items-center justify-center shrink-0 text-blue-400 font-black text-[10px]">A</div>
                            <span className="text-sm text-slate-400"><strong className="text-white">Synthesist:</strong> Deep technical breakdown with high-level conceptual bridges.</span>
                          </li>
                          <li className="flex gap-4">
                            <div className="w-6 h-6 bg-white/5 rounded flex items-center justify-center shrink-0 text-blue-400 font-black text-[10px]">B</div>
                            <span className="text-sm text-slate-400"><strong className="text-white">Empiricist:</strong> Focuses on empirical data, rigorous proof, and chemical precision.</span>
                          </li>
                          <li className="flex gap-4">
                            <div className="w-6 h-6 bg-white/5 rounded flex items-center justify-center shrink-0 text-blue-400 font-black text-[10px]">C</div>
                            <span className="text-sm text-slate-400"><strong className="text-white">Visionary:</strong> Projects current scientific consensus into future horizons.</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-blue-500 font-black tracking-widest uppercase text-xs mb-4">03. Protocol Standards</h4>
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6">
                          <div>
                            <div className="text-white font-bold mb-2 flex items-center gap-3">
                              <Plus className="w-4 h-4 text-blue-500" />
                              Technical Prompting
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Request specific scientific domains or theoretical frameworks. Use commands like "Synthesize the logic of..." or "Map the vector space of...".
                            </p>
                          </div>
                          <div>
                            <div className="text-white font-bold mb-2 flex items-center gap-3">
                              <History className="w-4 h-4 text-blue-500" />
                              Neural Revision
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Leverage interaction logs to cross-reference previous theoretical breakthroughs.
                            </p>
                          </div>
                          <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center gap-3 text-[10px] font-black text-blue-500 tracking-widest uppercase">
                              <Sparkles className="w-3 h-3" />
                              High-Intelligence Tip
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400 italic">
                              "Inquire about a multidisciplinary bridge if a concept feels isolated. Scientific Intelligence will architect a neural link."
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-center">
                  <button 
                    onClick={() => setIsGuideOpen(false)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-black tracking-widest uppercase text-xs px-10 py-4 rounded-2xl transition-all shadow-[0_10px_30px_rgba(59,130,246,0.3)]"
                  >
                    Synchronize Data & Close
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, rotate: 8 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          try {
            const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
            if (Ctx && !audioContextRef.current) {
              audioContextRef.current = new Ctx();
            }
            if (audioContextRef.current?.state === 'suspended') {
              audioContextRef.current.resume().catch(() => {});
            }
          } catch {}
          const next = !isOpen;
          setIsOpen(next);
          onStateChangeRef.current?.(next);
        }}
        style={{ display: hideToggle ? 'none' : undefined, bottom: 'max(40px, calc(16px + env(safe-area-inset-bottom)))', right: 'max(40px, env(safe-area-inset-right))' }}
        className="fixed z-[350] w-16 h-16 sm:w-20 sm:h-20 rounded-[28px] sm:rounded-[36px] bg-black border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] flex items-center justify-center transition-all group overflow-hidden"
        id="toggle-astra"
      >
        <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/20 transition-all opacity-0 group-hover:opacity-100 duration-500" />
        <div className="w-20 h-20 p-1">
          <RobotIcon glow={isAnalyzing} variant="button" />
        </div>
        <div className="absolute top-5 right-5 w-4 h-4 bg-blue-500 rounded-full border-[4px] border-black group-hover:scale-150 transition-transform shadow-[0_0_20px_rgba(59,130,246,1)]" />
      </motion.button>
    </>
  );
};
