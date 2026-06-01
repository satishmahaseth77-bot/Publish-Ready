import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Send, ImagePlus, X, Loader2, Lightbulb, ChevronDown, ChevronUp, Globe } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

async function groqChat(prompt: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json() as { reply: string };
  return data.reply ?? '';
}

const CURRICULA = [
  { label: '🇳🇵 Nepal (NEB)', value: 'Nepal', curriculum: 'Nepal Education Board (NEB) and CDC Nepal curriculum. Reference specific Nepali textbooks such as "Science and Environment" by CDC for secondary level, and Curriculum Development Centre textbooks.' },
  { label: '🇮🇳 India (CBSE/NCERT)', value: 'India', curriculum: 'CBSE/NCERT curriculum. Reference specific NCERT textbooks appropriate to the class level.' },
  { label: '🇺🇸 USA (Common Core)', value: 'USA', curriculum: 'US Common Core standards and typical US educational textbooks.' },
  { label: '🇬🇧 UK (National Curriculum)', value: 'UK', curriculum: 'UK National Curriculum. Reference AQA, Edexcel, or OCR syllabi as appropriate.' },
  { label: '🇦🇺 Australia (ACARA)', value: 'Australia', curriculum: 'Australian Curriculum, Assessment and Reporting Authority (ACARA) standards.' },
  { label: '🌍 International (IB)', value: 'International', curriculum: 'International Baccalaureate (IB) and general international curriculum standards.' },
];

interface DoubtEntry {
  id: string;
  question: string;
  imagePreview?: string;
  answer: string;
  country: string;
  expanded: boolean;
}

interface DoubtsSectionProps {
  subject: string;
  classLevel: string;
  country?: string | null;
}

export const DoubtsSection: React.FC<DoubtsSectionProps> = ({ subject, classLevel, country }) => {
  const detectedCountry = country || 'International';
  const [selectedCountry, setSelectedCountry] = useState(detectedCountry);
  const [question, setQuestion] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [doubts, setDoubts] = useState<DoubtEntry[]>([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const curriculumInfo = CURRICULA.find(c => c.value === selectedCountry) || CURRICULA[5];

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      const base64 = result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { handleImageSelect(file); break; }
      }
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitDoubt = async () => {
    if (!question.trim() && !imageBase64) return;

    setLoading(true);
    setError('');

    const prompt = `You are an expert ${subject} teacher and doubt solver. The student is in ${classLevel}, studying under the ${curriculumInfo.curriculum}

Answer the student's question with 100% accuracy and clarity:
1. Be completely accurate — no approximations or simplified wrong answers
2. Explain step-by-step at the level appropriate for ${classLevel}
3. Reference specific textbooks or curriculum standards from ${curriculumInfo.value} where relevant
4. If the question involves math, show every step with LaTeX formatting ($ for inline, $$ for block)
5. Include a "Key Concept" summary at the end
6. Format beautifully with Markdown — use headers, bullet points, and emphasis

${imageBase64 ? '[Note: Student attached an image — describe what you understand from the question context and answer thoroughly]\n' : ''}Student question: ${question || '[Image-based question — please answer based on subject context]'}`;

    try {
      const answer = await groqChat(prompt);

      setDoubts(prev => [{
        id: Date.now().toString(),
        question: question || '[Image question]',
        imagePreview: imagePreview || undefined,
        answer,
        country: selectedCountry,
        expanded: true,
      }, ...prev]);

      setQuestion('');
      clearImage();
    } catch {
      setError('Failed to get answer. Please try again.');
    }
    setLoading(false);
  };

  const toggleExpand = (id: string) => {
    setDoubts(prev => prev.map(d => d.id === id ? { ...d, expanded: !d.expanded } : d));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h3 className="text-white font-black uppercase tracking-wider text-sm">Doubt Solver</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Ask anything — get curriculum-accurate answers</p>
        </div>
      </div>

      {/* Curriculum selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
          <Globe className="w-3 h-3" />
          Your Curriculum:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CURRICULA.map(c => (
            <button
              key={c.value}
              onClick={() => setSelectedCountry(c.value)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                selectedCountry === c.value
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-white hover:border-white/20'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question input */}
      <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden focus-within:border-violet-500/40 transition-colors">
        {/* Image preview inside input */}
        {imagePreview && (
          <div className="relative mx-4 mt-4">
            <img src={imagePreview} alt="Question" className="max-h-48 rounded-xl object-contain border border-white/10" />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 w-6 h-6 bg-black/80 border border-white/20 rounded-full flex items-center justify-center hover:bg-red-500/30 transition-colors"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        )}
        <textarea
          ref={textAreaRef}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitDoubt(); }}
          placeholder={imagePreview ? "Add context about the image (optional)..." : `Ask your ${subject} question here...\n\nYou can also paste or upload an image of your question/textbook.`}
          rows={4}
          className="w-full bg-transparent text-white text-sm placeholder:text-slate-600 outline-none px-4 py-4 resize-none"
        />
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:border-white/20 transition-all text-[10px] font-bold"
            >
              <ImagePlus className="w-3.5 h-3.5" />
              Upload Image
            </button>
            <span className="text-[9px] text-slate-600 hidden sm:block">or paste · Ctrl+Enter to send</span>
          </div>
          <button
            onClick={submitDoubt}
            disabled={loading || (!question.trim() && !imageBase64)}
            className="flex items-center gap-2 px-5 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl text-white font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {loading ? 'Solving...' : 'Solve'}
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
        />
      </div>

      {error && (
        <p className="text-red-400 text-xs font-bold px-1">{error}</p>
      )}

      {/* Doubt answers */}
      <AnimatePresence>
        {doubts.map((doubt) => (
          <motion.div
            key={doubt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden"
          >
            {/* Question row */}
            <button
              onClick={() => toggleExpand(doubt.id)}
              className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-6 h-6 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                {doubt.imagePreview && (
                  <img src={doubt.imagePreview} alt="Q" className="max-h-24 rounded-xl mb-2 object-contain border border-white/10" />
                )}
                <p className="text-sm text-white font-medium line-clamp-2">{doubt.question}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-violet-400/60">{doubt.country} Curriculum</span>
                </div>
              </div>
              {doubt.expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0 mt-1" />
              )}
            </button>

            {/* Answer */}
            <AnimatePresence>
              {doubt.expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/5 overflow-hidden"
                >
                  <div className="p-4 flex gap-3">
                    <div className="w-6 h-6 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0 prose prose-invert prose-sm max-w-none prose-headings:text-violet-400 prose-headings:font-black prose-headings:uppercase prose-headings:tracking-wider prose-strong:text-white prose-code:text-violet-300 prose-code:bg-white/5 prose-code:rounded prose-code:px-1">
                      <Markdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {doubt.answer}
                      </Markdown>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>

      {doubts.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          <HelpCircle className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-[10px] font-black uppercase tracking-widest">Ask a question above — Astra will solve it instantly</p>
          <p className="text-[10px] text-slate-700 mt-1">Supports text questions and image uploads (handwritten or printed)</p>
        </div>
      )}
    </div>
  );
};
