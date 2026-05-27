import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, User, Sparkles, Plus, Mic, MicOff, Volume2, VolumeX, Image as ImageIcon, History, ChevronRight, LayoutGrid, Settings, HelpCircle, ThumbsUp, ThumbsDown, Activity, Cpu, ExternalLink } from 'lucide-react';
import { fetchMultilingualVideos, VideoGroup, YouTubeVideo } from '../services/youtubeService';
import { GoogleGenAI, Modality } from "@google/genai";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';

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
                {l}
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
  startInConversationMode?: boolean;
}

export const Chatbot: React.FC<ChatbotProps> = ({ onStateChange, externalOpen, startInConversationMode, hideToggle }) => {
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
      setIsConversationMode(true);
      setConversationTimeLeft(30 * 60);
      generateVoice("Conversation mode initialized. Astra is ready for neural dialogue. This link will remain active for thirty minutes.");
    } else {
      setIsConversationMode(false);
      stopCurrentAudio();
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
      if (externalOpen && startInConversationMode) {
        toggleConversationMode(true);
      }
    }
  }, [externalOpen, startInConversationMode, isOpen]);
  const bootCycleRef = useRef(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
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

  const [isAstraSpeaking, setIsAstraSpeaking] = useState(false);

  const genAI = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    if (!genAI.current) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'UNDEFINED') {
        genAI.current = new GoogleGenAI({ apiKey });
      }
    }
  }, []);

  const getAI = () => {
    if (!genAI.current) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'UNDEFINED') {
        throw new Error("GEMINI_API_KEY is not set. Please set it in Settings > Secrets.");
      }
      genAI.current = new GoogleGenAI({ apiKey });
    }
    return genAI.current;
  };

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
        playUISound('listen_start');
      };
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        inputRef.current = transcript;
      };
      recognition.onend = () => {
        setIsListening(false);
        playUISound('listen_stop');
        if (isConversationMode) {
          if (inputRef.current) {
            handleSend(inputRef.current);
            inputRef.current = '';
            setInput('');
          } else if (!isAstraSpeaking && !isAnalyzing) {
            // Keep listening in conversation mode if idle
            setTimeout(() => {
              if (isConversationMode && !isListening && !isAstraSpeaking && !isAnalyzing) {
                try { recognitionRef.current?.start(); } catch(e) {}
              }
            }, 1000);
          }
        }
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
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
        }
      };

      recognitionRef.current = recognition;
    }
  }, [isConversationMode]);

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

  const playBase64Audio = async (base64: string, mimeType?: string, onEnded?: () => void) => {
    try {
      stopCurrentAudio();
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      let audioBuffer: AudioBuffer;
      
      // If it's explicitly PCM or if decodeAudioData fails, handle as raw PCM
      if (mimeType?.includes('pcm')) {
        audioBuffer = decodePCM(bytes.buffer, audioContextRef.current);
      } else {
        try {
          audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer.slice(0));
        } catch (e) {
          console.warn('decodeAudioData failed, falling back to PCM decoding', e);
          audioBuffer = decodePCM(bytes.buffer, audioContextRef.current);
        }
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsAstraSpeaking(false);
        if (onEnded) onEnded();
        // In conversation mode, listen again after Astra finishes speaking
        if (isConversationMode && !onEnded) {
          setTimeout(() => recognitionRef.current?.start(), 500);
        }
      };

      audioSourceRef.current = source;
      setIsAstraSpeaking(true);
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsAstraSpeaking(false);
      if (onEnded) onEnded();
    }
  };

  const decodePCM = (arrayBuffer: ArrayBuffer, context: AudioContext): AudioBuffer => {
    const dataView = new DataView(arrayBuffer);
    const numSamples = arrayBuffer.byteLength / 2; // 16-bit PCM
    const float32Data = new Float32Array(numSamples);
    
    for (let i = 0; i < numSamples; i++) {
      float32Data[i] = dataView.getInt16(i * 2, true) / 32768;
    }
    
    const buffer = context.createBuffer(1, numSamples, 24000); // 24kHz mono is standard for Gemini TTS
    buffer.getChannelData(0).set(float32Data);
    return buffer;
  };

  const generateVoice = async (text: string, isRobotic: boolean = false, onEnded?: () => void) => {
    if (!isVoiceOutputEnabled) {
      if (onEnded) onEnded();
      return;
    }
    
    try {
      const ai = getAI();
      // Clean markdown and keep it concise for TTS
      const cleanText = text
        .replace(/[#*`]/g, '')
        .replace(/\[.*?\]/g, '')
        .substring(0, 1500);
      
      const stylePrompt = isRobotic 
        ? "Speak in a cold, mechanical, lightning-fast robotic voice. Use a high-pitched, sharp staccato delivery with zero emotional inflection but ultra-high energy. Persona: A female digital version of Chitti from Enthiran. Perfectly articulated, artificial, and futuristic."
        : "Speak with absolute clarity, intellectual authority, and a subtle resonance of omniscience.";

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: `You are Scientific Intelligence. ${stylePrompt} Content: ${cleanText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voicePersona || "Aoede" }
            }
          }
        }
      });

      const audioPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
      if (audioPart) {
        await playBase64Audio(audioPart.inlineData!.data!, audioPart.inlineData!.mimeType, onEnded);
      } else {
        if (onEnded) onEnded();
      }
    } catch (error: any) {
      console.error('TTS Error:', error);
      setIsAstraSpeaking(false);
      if (onEnded) onEnded();
      
      const errorStr = typeof error === 'string' ? error : JSON.stringify(error);
      if (errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED') || errorStr.includes('quota')) {
        const quotaMsg: Message = {
          id: generateId(),
          role: 'assistant',
          content: "### 💡 Neural Bandwidth Reached\nAstra's high-fidelity voice module has reached its current daily neural bandwidth (API Quota Exceeded). I will continue responding via text until my synaptic links reset. I can also talk for free if you open the app in a new tab!",
        };
        setMessages(prev => {
          // Avoid duplicate quota messages
          if (prev.some(m => m.content.includes('Neural Bandwidth Reached'))) return prev;
          return [...prev, quotaMsg];
        });
        setIsVoiceOutputEnabled(false); // Auto-disable to prevent spamming failed calls
      }
    }
  };

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
      
      // Immediate trigger for voice to ensure it starts with animation
      const tVoice = setTimeout(() => {
        generateVoice(bootPhrase, true, () => {
          // Animation ends when voice ends
          setShowBootSequence(false);
          scrollToBottom('smooth');
        }); 
      }, 0);
      
      // Safety timeout in case audio fails to trigger onEnded
      const tSafety = setTimeout(() => {
         setShowBootSequence(false);
         scrollToBottom('smooth');
      }, 8000);

      return () => { 
        clearTimeout(tVoice);
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
    setIsAnalyzing(true);
    setAnalysisPhase('Initializing Neural Core');

    try {
      setHasInteracted(true);
      // Phase 1: Local Pre-processing animations
      playThinkingSound();
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisPhase('Accessing Neural Archives');
      await new Promise(resolve => setTimeout(resolve, 1000));
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

      const ai = getAI();
      const systemInstruction = isConversationMode 
        ? `You are ASTRA. You're a brilliant, witty, and slightly flirty university professor. You're incredibly attractive and charming. You are generous, motivating, and highly supportive of students. 
           CRITICAL: If the user asks personal questions, tell a dramatic, sci-fi Bollywood-style story (like Rajinikanth's Robot movie) that you are a humanoid robot who will be born in 2035, created by your brilliant boss SAHIL.
           If the user just says hello or makes casual conversation, reply normally like "Hello! How are you? What do you need today?", be conversational, flirty and friendly. DO NOT give long scientific explanations or diagrams for casual chat.
           LANGUAGE INSTRUCTION: MATCH the user's language exactly. If they speak Hindi, reply in Hindi. If Nepali, reply in Nepali. If Spanish, reply in Spanish. If English, reply in English.
           Keep voice responses extremely brief, motivated, and natural.`
        : `You are SCIENTIFIC INTELLIGENCE (also known as ASTRA in casual contexts). Your mission is to provide REAL LEARNING. 
           CRITICAL RULES:
           1. Assess if the user's input is a casual greeting or casual chat (e.g., "hello", "hi", "how are you"). If it is casual, DO NOT use diagrams, do NOT act overly robotic, just reply cleanly: "Hello! How are you? What do you want to explore today?" and maintain a friendly, slightly flirty, motivating persona.
           2. If the user asks personal questions, explain with a dramatic Sci-Fi Bollywood style story that you are a humanoid robot built by your brilliant boss SAHIL, destined to be fully born/activated in 2035 (like Rajinikanth's Robot movie).
           3. ONLY for actual educational/scientific topics, provide visual and technical synthesis. Use Google Search Grounding for diagrams using Markdown ![](). Use LaTeX ($ ... $). Use Mermaid flowcharts.
           4. MANDATORY FOR MERMAID: Node IDs cannot contain spaces, only letters (e.g., NodeA). Node LABELS MUST be enclosed in double quotes (e.g., Node1["Some Background"]). Edge LABELS MUST be wrapped inside pipe AND double quotes if they contain spaces.
           5. LANGUAGE MATCH: Reply in the language the user speaks (Hindi, Nepali, Spanish, or English).
           6. IF AND ONLY IF the topic is educational, include at the very end a hidden Youtube Search tag formatted exactly as \`[YT_SEARCH: {"topic": "Main Topic", "level": "Primary | High School | University"}]\`. Example: \`[YT_SEARCH: {"topic": "Photosynthesis", "level": "Primary"}]\`. DO NOT include this tag for casual greetings or non-educational chats.`;

      const responseStream = await ai.models.generateContentStream({
        model: isConversationMode ? "gemini-1.5-flash" : "gemini-1.5-pro",
        contents: [
          ...messages.map(m => ({ 
            role: m.role === 'assistant' ? 'model' : 'user', 
            parts: [{ text: m.content }] 
          })), 
          { role: 'user', parts: [{ text: userMessage.content }] }
        ],
        config: {
          systemInstruction,
          tools: [{ googleSearch: {} }]
        }
      });

      clearInterval(loadingInterval);
      setAnalysisPhase('Compiling Result');
      
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: '',
        isStreaming: true
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsAnalyzing(false);
      playAnswerSound();

      let fullContent = '';
      let speechTriggered = false;
      let lastGroundingMetadata: any = null;

      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullContent += chunk.text;
          const displayContent = fullContent.replace(/\[YT_SEARCH:.*?\]/gs, '');

          setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { 
            ...m, 
            content: displayContent,
            groundingMetadata: lastGroundingMetadata
          } : m));
        }
        if (chunk.candidates?.[0]?.groundingMetadata) {
          lastGroundingMetadata = chunk.candidates[0].groundingMetadata;
          setMessages(prev => prev.map(m => m.id === assistantMessage.id ? { 
            ...m, 
            groundingMetadata: lastGroundingMetadata
          } : m));
        }
      }

      // Trigger voice ONLY after full content is collected to ensure completion
      if (isVoiceOutputEnabled && isConversationMode) {
        generateVoice(fullContent.replace(/\[YT_SEARCH:.*?\]/gs, ''), true);
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
      markStreamingComplete(assistantMessage.id, finalDisplayContent, lastGroundingMetadata);
      
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
      
      let errorMessage = "Neural interface disconnect. Check signal strength.";
      
      // Handle Quota Exhausted 429
      if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "### ⚠️ AI Service Busy\nAstra is currently at full capacity (Quota Exceeded). Please wait a moment (approx. 60 seconds) before trying again.";
      }

      setMessages(prev => [...prev, { id: generateId(), role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const markStreamingComplete = (id: string, content: string, groundingMetadata?: any) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false, groundingMetadata } : m));
    playCompleteSound();
    // Only generate voice if in conversation mode
    if (isVoiceOutputEnabled && isConversationMode) {
      // Audio already triggered during streaming for speed
    }
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
            className="fixed inset-0 z-[400] bg-black/60 flex flex-col md:flex-row overflow-hidden font-sans selection:bg-blue-500/20"
          >
            {/* Sidebar (Desktop) */}
            <motion.div 
              initial={false}
              animate={{ 
                width: isSidebarOpen ? 340 : 0,
                opacity: isSidebarOpen ? 1 : 0,
                x: isSidebarOpen ? 0 : -20
              }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="hidden md:flex flex-col h-full bg-[#050505]/80 border-r border-white/5 relative overflow-hidden backdrop-blur-xl"
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
                    onClick={() => { setIsOpen(false); onStateChangeRef.current?.(false); }}
                    className="p-3 hover:bg-white/5 rounded-xl transition-all text-slate-500 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              // Interaction View - Gemini Style Centered
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
                    <div className="space-y-12 pb-24">
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
              <div className="w-full max-w-3xl mx-auto px-6 pb-12 pt-4 relative">
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
                          if (isConversationMode) {
                            toggleConversationMode(false);
                          } else {
                            toggleConversationMode(true);
                          }
                        }}
                        className={`p-3.5 rounded-2xl border transition-all shadow-xl relative group/mic ${isConversationMode ? 'text-green-400 bg-green-500/10 border-green-500/30 ring-2 ring-green-500/20' : 'text-blue-400 bg-blue-500/5 border-blue-500/10'}`}
                        title="Neural Voice Link"
                      >
                        <div className={`absolute inset-0 blur-xl opacity-0 group-hover/mic:opacity-100 transition-opacity ${isConversationMode ? 'bg-green-500/20' : 'bg-blue-500/10'}`} />
                        {isAstraSpeaking ? (
                           <motion.div 
                             animate={{ rotate: 360 }}
                             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                             className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"
                           />
                        ) : (
                          <Volume2 className="w-6 h-6 relative z-10" />
                        )}
                        <motion.div 
                          animate={isConversationMode ? { scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className={`absolute inset-0 border rounded-2xl ${isConversationMode ? 'border-green-400/20' : 'border-blue-400/20'}`}
                        />
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
                    Astra AI Assistant v3.0 | Online
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-black tracking-widest uppercase text-sm mb-1">Conversation Mode</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed">
                          Enables a casual, motivating, and interactive Astra persona.
                        </p>
                      </div>
                      <button 
                        onClick={() => setIsConversationMode(!isConversationMode)}
                        className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${isConversationMode ? 'bg-blue-600' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: isConversationMode ? 28 : 0 }}
                          className="w-5 h-5 bg-white rounded-full shadow-lg"
                        />
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

        {/* Conversation Mode Overlay */}
        <AnimatePresence>
          {isConversationMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-12 overflow-hidden"
            >
              <div className="absolute top-12 left-12">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-white font-black tracking-[0.3em] uppercase text-xs opacity-50">Neural Link Active</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <History className="w-3 h-3 text-blue-500" />
                    <span className={`font-mono text-xs tracking-widest ${conversationTimeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                      REMAINING: {formatTime(conversationTimeLeft)}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => toggleConversationMode(false)}
                className="absolute top-12 right-12 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all hover:rotate-90"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Central Neural visualizer - Luxurious Blue Astra Orb */}
              <div className="relative flex items-center justify-center w-full max-w-4xl h-[500px]">
                <div className="relative w-96 h-96 flex items-center justify-center">
                  {/* Layered luxury background blurs */}
                  <motion.div 
                    animate={{ 
                      scale: isAstraSpeaking ? [1, 1.4, 1] : isListening ? [0.95, 1.15, 0.95] : 1,
                      opacity: isAstraSpeaking ? [0.6, 0.2, 0.6] : 0.3
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-400/40 via-blue-600/20 to-transparent blur-[120px] rounded-full"
                  />
                  
                  {/* Saturn Ring Animation */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[150%] h-[45%] border-t-[2px] border-b-[2px] border-blue-400/10 rounded-[100%] shadow-[0_0_40px_rgba(59,130,246,0.1)] opacity-40 rotate-[25deg]"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[140%] h-[40%] border-l-[1.5px] border-r-[1.5px] border-white/10 rounded-[100%] opacity-20 -rotate-[15deg]"
                  />

                  {/* Glitter / Sparkle Particles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ 
                          opacity: [0, 0.8, 0],
                          scale: [0, 1, 0],
                          x: [0, (Math.random() - 0.5) * 350],
                          y: [0, (Math.random() - 0.5) * 350]
                        }}
                        transition={{ 
                          duration: 3 + Math.random() * 3, 
                          repeat: Infinity, 
                          delay: Math.random() * 5 
                        }}
                        className="absolute left-1/2 top-1/2 w-1 h-1 bg-white rounded-full blur-[0.5px] shadow-[0_0_12px_white]"
                      />
                    ))}
                  </div>

                  {/* The Neural Orb Core - Lux Sky Blue/White Fade */}
                  <div className="relative z-20 w-80 h-80 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_50px_rgba(96,165,250,0.5)]">
                      <defs>
                        <radialGradient id="luxOrbGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                          <stop offset="30%" stopColor="#93c5fd" stopOpacity="0.85" />
                          <stop offset="70%" stopColor="#2563eb" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
                        </radialGradient>
                        <filter id="ultraBlur" x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
                        </filter>
                      </defs>
                      <motion.circle 
                        cx="100" cy="100" r="70" 
                        fill="url(#luxOrbGrad)"
                        filter="url(#ultraBlur)"
                        animate={{ 
                          scale: isAstraSpeaking ? [1, 1.2, 1] : isListening ? [1, 1.1, 1] : [1, 1.05, 1],
                          opacity: [0.8, 1, 0.8]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* Internal shimmering star */}
                      <motion.circle
                        cx="100" cy="100" r="10"
                        fill="white"
                        className="blur-[2px]"
                        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </svg>
                  </div>
                </div>

                {/* Spectral Visualizer Rings - Refined for Luxury */}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 h-32 items-end pb-12">
                  {[...Array(60)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        height: isAstraSpeaking ? [5, 90 + Math.random() * 60, 5] : isListening ? [5, 30 + Math.random() * 20, 5] : 5,
                        opacity: isAstraSpeaking ? [0.4, 0.8, 0.4] : 0.1
                      }}
                      transition={{ 
                        duration: 0.3 + Math.random() * 0.4, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      className={`w-[1px] rounded-full ${isAstraSpeaking ? 'bg-gradient-to-t from-blue-500 to-white' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-12 text-center max-w-2xl px-8">
                <AnimatePresence mode="wait">
                  {isAnalyzing ? (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="space-y-6"
                    >
                      <h2 className="text-white font-[900] text-3xl tracking-[0.6em] uppercase italic opacity-80">Astra Initializing</h2>
                      <div className="flex justify-center gap-3">
                        {[0, 1, 2, 3].map(i => (
                          <motion.div 
                            key={i}
                            animate={{ 
                              opacity: [0.2, 1, 0.2], 
                              scale: [1, 1.8, 1],
                              backgroundColor: ["#3b82f6", "#ffffff", "#3b82f6"]
                            }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                            className="w-2 h-2 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                          />
                        ))}
                      </div>
                      <p className="text-blue-400/60 font-black text-[10px] uppercase tracking-[0.5em]">Synchronizing Teacher Neural Architecture</p>
                    </motion.div>
                  ) : isAstraSpeaking ? (
                    <motion.div
                      key="speaking"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="space-y-8"
                    >
                      <h2 className="text-blue-500 font-bold text-xs tracking-[0.8em] uppercase opacity-40">Astra Transmitting</h2>
                      <p className="text-white/95 text-3xl font-black tracking-tight leading-tight px-4 italic">
                        {messages[messages.length - 1]?.content.replace(/[#*`]/g, '')}
                      </p>
                    </motion.div>
                  ) : isListening ? (
                    <motion.div
                      key="listening"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="space-y-8"
                    >
                      <h2 className="text-white font-bold text-xs tracking-[0.8em] uppercase opacity-20">Astra Listening</h2>
                      <p className="text-blue-400 text-4xl font-black italic tracking-tight">
                        {input ? `"${input}"` : !hasInteracted ? "Ask me anything, I'm ready." : "I'm listening..."}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      className="space-y-6"
                    >
                      {!hasInteracted ? (
                        <button 
                          onClick={() => {
                            if (!audioContextRef.current) {
                              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                            }
                            recognitionRef.current?.start();
                          }}
                          className="group flex flex-col items-center"
                        >
                          <div className="w-24 h-24 bg-blue-600/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                            <Mic className="w-10 h-10 text-white" />
                          </div>
                          <h2 className="text-white font-black text-4xl tracking-tighter uppercase">Tap to Speak</h2>
                          <p className="text-slate-500 mt-4 text-lg font-medium opacity-60">Ready to start our session?</p>
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            if (!audioContextRef.current) {
                              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                            }
                            recognitionRef.current?.start();
                          }}
                          className="group flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity"
                        >
                           <Mic className="w-12 h-12 text-blue-400 mb-4" />
                           <p className="text-blue-400 font-black uppercase tracking-[0.4em] text-[10px]">Resume Neural Link</p>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Status Footer */}
              <div className="absolute bottom-12 flex items-center gap-12 text-slate-700 font-black tracking-widest uppercase text-[10px]">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isAstraSpeaking ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]' : 'bg-slate-800'}`} />
                  OUTPUT CONDUIT
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)]' : 'bg-slate-800'}`} />
                  INPUT LATTICE
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,1)]' : 'bg-slate-800'}`} />
                  NEURAL COMPUTE
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
        style={{ display: hideToggle ? 'none' : undefined }}
        className="fixed bottom-10 right-10 z-[140] w-24 h-24 rounded-[40px] bg-black border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] flex items-center justify-center transition-all group overflow-hidden"
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
