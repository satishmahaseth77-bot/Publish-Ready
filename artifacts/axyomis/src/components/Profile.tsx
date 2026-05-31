import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, X, Camera, Save, Loader2, Mail, Fingerprint, ShieldCheck } from 'lucide-react';
import { auth, getUserProfile, updateUserProfile, UserProfile, logout } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Auth } from './Auth';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ isOpen, onClose }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');

  const fetchProfile = async (u: FirebaseUser) => {
    const p = await getUserProfile(u.uid);
    if (p) {
      setProfile(p);
      setDisplayName(p.displayName || u.displayName || '');
      setPhotoURL(p.photoURL || u.photoURL || '');
      setBio(p.bio || '');
      setGender(p.gender || 'prefer-not-to-say');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getAvatar = () => {
    if (photoURL) return photoURL;
    if (gender === 'male') return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix&backgroundColor=b6e3f4`;
    if (gender === 'female') return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Abby&backgroundColor=ffdfbf`;
    return `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Unity&backgroundColor=c0aede`;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        photoURL,
        bio,
        gender
      });
      await fetchProfile(user);
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await fetchProfile(u);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[520] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className={`relative w-full ${!user ? 'max-w-md' : 'max-w-2xl'} bg-[#0d0d10] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden`}
          >
            {/* Header */}
            <div className={`p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/5 to-transparent ${!user ? 'hidden' : ''}`}>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                  <Fingerprint className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase">Your Profile</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Manage your account info</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className={`${!user ? 'p-0' : 'p-8'} max-h-[85vh] overflow-y-auto scrollbar-none relative`}>
              {!user ? (
                <div className="relative">
                  <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 z-20 p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <Auth onSuccess={() => {}} />
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Profile Info */}
                  <div className="flex flex-col md:flex-row gap-10">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl relative">
                          <img src={getAvatar()} alt="Profile" className="w-full h-full object-cover" />
                          {editMode && (
                            <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                              <Camera className="w-8 h-8 text-white mb-2" />
                              <span className="text-[8px] font-black uppercase text-white">Upload</span>
                              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                            </label>
                          )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-blue-600 p-2 rounded-xl shadow-lg border border-white/20">
                          <ShieldCheck className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      
                        <button 
                        onClick={() => logout()}
                        className="mt-6 flex items-center gap-2 text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
                      >
                        <LogOut className="w-3 h-3" /> Sign Out
                      </button>
                    </div>

                    <div className="flex-1 space-y-6">
                      {editMode ? (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Display Name</label>
                            <input 
                              type="text" 
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all font-mono"
                              placeholder="Your name..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Profile Picture URL (Optional)</label>
                            <input 
                              type="text" 
                              value={photoURL}
                              onChange={(e) => setPhotoURL(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all font-mono text-sm"
                              placeholder="https://images.com/profile.jpg"
                            />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Gender</label>
                             <div className="grid grid-cols-2 gap-2">
                               {['male', 'female', 'other', 'prefer-not-to-say'].map((g) => (
                                 <button
                                   key={g}
                                   type="button"
                                   onClick={() => setGender(g as any)}
                                   className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${gender === g ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}
                                 >
                                   {g.replace(/-/g, ' ')}
                                 </button>
                               ))}
                             </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Bio</label>
                            <textarea 
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-blue-500/50 transition-all font-mono min-h-[100px] resize-none"
                              placeholder="About yourself..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-3xl font-bold text-white mb-2">{displayName || 'New Explorer'}</h3>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm font-mono">{profile?.email || user.email}</span>
                            </div>
                          </div>
                          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <h4 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-3">Bio</h4>
                            <p className="text-slate-300 text-sm leading-relaxed italic">
                              {bio || 'No profile bio yet.'}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                              <span className="text-[10px] text-blue-400 font-bold block uppercase mb-1">Status</span>
                              <span className="text-white text-sm font-bold uppercase">Researcher</span>
                            </div>
                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                              <span className="text-[10px] text-purple-400 font-bold block uppercase mb-1">Points</span>
                              <span className="text-white text-sm font-bold uppercase">Active Member</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* PREMIUM MODULES COMING SOON */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
                    <div className="p-8 rounded-[38px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/20 blur-3xl group-hover:bg-blue-500/30 transition-all"></div>
                      <h4 className="text-white font-[900] tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></span>
                        Report Tracker
                      </h4>
                      <p className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em] leading-relaxed mb-6">
                        Visualize your cognitive evolution through high-fidelity data nodes and neural sync reports.
                      </p>
                      <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-not-allowed">
                        Initializing Module...
                      </button>
                    </div>

                    <div className="p-8 rounded-[38px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                      <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
                      <h4 className="text-white font-[900] tracking-widest text-xs uppercase mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
                        AI Teacher (Astra v2)
                      </h4>
                      <p className="text-slate-500 text-[10px] font-medium uppercase tracking-[0.2em] leading-relaxed mb-6">
                        Real-time neural coaching for advanced scientific synthesis and personalized error correction.
                      </p>
                      <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-500 uppercase tracking-widest cursor-not-allowed">
                        Awaiting Sync...
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {user && (
              <div className="p-8 border-t border-white/5 flex gap-4 bg-black/40">
                {editMode ? (
                  <>
                    <button 
                      onClick={() => setEditMode(false)}
                      className="flex-1 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-[1.5] px-8 py-4 bg-blue-600 rounded-2xl text-white font-bold uppercase tracking-[0.2em] text-xs hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setEditMode(true)}
                    className="flex-1 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all uppercase tracking-widest font-bold text-xs"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
