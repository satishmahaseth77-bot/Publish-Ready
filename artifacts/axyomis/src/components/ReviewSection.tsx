import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Send, Trash2, Edit3, MessageSquare, TrendingUp, Users } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getAllReviews, getUserReview, submitReview, deleteReview, type Review } from '../services/activityService';

function StarRating({ value, onChange, readOnly = false, size = 'md' }: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hover, setHover] = useState(0);
  const s = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(i)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => onChange?.(i)}
          className={`transition-all ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
        >
          <Star className={`${s} transition-colors ${i <= (hover || value) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export const ReviewSection: React.FC = () => {
  const { uid, displayName, photoURL } = useUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map(r => ({
    stars: r,
    count: reviews.filter(rev => rev.rating === r).length,
    pct: reviews.length ? (reviews.filter(rev => rev.rating === r).length / reviews.length) * 100 : 0,
  }));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const all = await getAllReviews();
      setReviews(all);
      if (uid) {
        const mine = await getUserReview(uid);
        if (mine) {
          setMyReview(mine);
          setRating(mine.rating);
          setText(mine.text);
        }
      }
      setLoading(false);
    };
    load();
  }, [uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !text.trim() || rating < 1) return;
    setSaving(true);
    try {
      await submitReview(uid, {
        displayName: displayName || 'Anonymous',
        photoURL,
        rating,
        text: text.trim(),
      });
      const all = await getAllReviews();
      setReviews(all);
      const mine = await getUserReview(uid);
      setMyReview(mine);
      setIsWriting(false);
    } catch {}
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!uid) return;
    await deleteReview(uid);
    setMyReview(null);
    setRating(5);
    setText('');
    const all = await getAllReviews();
    setReviews(all);
  };

  const timeAgo = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate?.() ?? new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <section id="reviews" className="max-w-7xl mx-auto px-4 sm:px-8 mb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <span className="w-12 h-px bg-amber-500" />
        <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white">Student Reviews</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-amber-400">
            {reviews.length} ratings
          </span>
        </div>
      </div>
      <p className="text-slate-500 text-[10px] uppercase tracking-widest font-medium max-w-md mb-10">
        Real feedback from real learners · every review is verified
      </p>

      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Aggregate score */}
          <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/[0.02] border border-white/5">
            <div className="text-7xl font-black text-white mb-2">
              {avgRating > 0 ? avgRating.toFixed(1) : '–'}
            </div>
            <StarRating value={Math.round(avgRating)} readOnly size="lg" />
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-3 font-bold">
              {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
            </p>
            <div className="flex items-center gap-2 mt-4">
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[10px] text-slate-500">
                {reviews.filter(r => r.rating >= 4).length} recommend this platform
              </span>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="col-span-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-center gap-3">
            {ratingCounts.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 w-4">{stars}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 flex-shrink-0" />
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-400 rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: (5 - stars) * 0.1 }}
                  />
                </div>
                <span className="text-[10px] text-slate-600 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>

          {/* Write a review CTA */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/20 flex flex-col justify-between">
            <div>
              <MessageSquare className="w-6 h-6 text-amber-400 mb-3" />
              <h3 className="text-white font-black uppercase tracking-wider text-sm mb-2">
                {myReview ? 'Your Review' : 'Share Your Experience'}
              </h3>
              {myReview ? (
                <div>
                  <StarRating value={myReview.rating} readOnly size="sm" />
                  <p className="text-slate-400 text-[11px] mt-2 italic line-clamp-3">"{myReview.text}"</p>
                </div>
              ) : (
                <p className="text-slate-500 text-xs">
                  {uid ? 'Help other students by sharing what you think.' : 'Sign in to leave a review.'}
                </p>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              {uid ? (
                <>
                  <button
                    onClick={() => setIsWriting(true)}
                    className="flex-1 py-2.5 bg-amber-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    {myReview ? 'Edit' : 'Write Review'}
                  </button>
                  {myReview && (
                    <button
                      onClick={handleDelete}
                      className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-500 hover:text-red-400 hover:border-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Sign in to review</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Write review modal */}
      <AnimatePresence>
        {isWriting && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsWriting(false)} />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#08090e] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none" />
              <h3 className="text-white font-black uppercase tracking-wider text-base mb-1 relative z-10">
                {myReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <p className="text-slate-500 text-xs mb-6 relative z-10">Your honest feedback helps other students choose the right plan.</p>
              <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Rating</label>
                  <div className="flex items-center gap-4">
                    <StarRating value={rating} onChange={setRating} size="lg" />
                    <span className="text-amber-400 font-black text-sm">{RATING_LABELS[rating]}</span>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Your Review</label>
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="What do you like most? How has it helped your studies?"
                    rows={4}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none placeholder:text-slate-600 resize-none focus:border-amber-500/30 transition-colors"
                    maxLength={500}
                  />
                  <p className="text-[9px] text-slate-600 text-right mt-1">{text.length}/500</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsWriting(false)}
                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || !text.trim() || rating < 1}
                    className="flex-1 py-3 bg-amber-500 rounded-2xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /> Submit Review</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reviews list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-slate-600">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-[10px] uppercase tracking-widest font-bold">No reviews yet. Be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((r, i) => (
            <motion.div
              key={r.uid}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`p-5 rounded-2xl border transition-colors ${r.uid === uid ? 'bg-amber-500/5 border-amber-500/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-slate-800 flex-shrink-0">
                  {r.photoURL ? (
                    <img src={r.photoURL} alt={r.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.uid}`} alt={r.displayName} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold text-white truncate">
                    {r.displayName}
                    {r.uid === uid && <span className="ml-1 text-amber-400 text-[9px]">(you)</span>}
                  </div>
                  <div className="text-[9px] text-slate-600">{timeAgo(r.updatedAt || r.createdAt)}</div>
                </div>
                <StarRating value={r.rating} readOnly size="sm" />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">"{r.text}"</p>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};
