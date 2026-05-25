import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, getUserProfile, updateUserProfile } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export type ClassLevel =
  | 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5'
  | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10'
  | 'Grade 11' | 'Grade 12' | 'Undergraduate' | 'Postgraduate';

export type Subject = 'Science' | 'Mathematics' | 'Chemistry' | 'Physics' | 'Biology' | 'Astronomy' | 'AI & Computer Science';

export interface ParentInfo {
  name: string;
  email: string;
  whatsapp: string;
}

export interface StudentProfile {
  studentName?: string;
  dateOfBirth?: string;
  country?: string;
  curriculum?: string;
}

export interface UserContextType {
  uid: string | null;
  isPremium: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  premiumTier: 'free' | 'scholar' | 'premium' | 'elite';
  effectiveTier: 'free' | 'scholar' | 'premium' | 'elite';
  classLevel: ClassLevel | null;
  subjects: Subject[];
  parentInfo: ParentInfo | null;
  secondaryParent: ParentInfo | null;
  studentProfile: StudentProfile | null;
  displayName: string | null;
  photoURL: string | null;
  hasCompletedOnboarding: boolean;
  setClassLevel: (level: ClassLevel) => void;
  setSubjects: (subjects: Subject[]) => void;
  setParentInfo: (info: ParentInfo) => void;
  setSecondaryParent: (info: ParentInfo) => void;
  completeOnboarding: (data: {
    classLevel: ClassLevel;
    subjects: Subject[];
    parentInfo?: ParentInfo;
    secondaryParent?: ParentInfo;
    studentProfile?: StudentProfile;
  }) => Promise<void>;
  upgradeToPremium: (tier: 'scholar' | 'premium' | 'elite') => void;
  loading: boolean;
}

const TRIAL_DAYS = 30;

function calcTrialDays(trialStartMs: number): number {
  const elapsed = Math.floor((Date.now() - trialStartMs) / (1000 * 60 * 60 * 24));
  return Math.max(0, TRIAL_DAYS - elapsed);
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumTier, setPremiumTier] = useState<'free' | 'scholar' | 'premium' | 'elite'>('free');
  const [isTrialActive, setIsTrialActive] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(TRIAL_DAYS);
  const [effectiveTier, setEffectiveTier] = useState<'free' | 'scholar' | 'premium' | 'elite'>('free');
  const [classLevel, setClassLevelState] = useState<ClassLevel | null>(null);
  const [subjects, setSubjectsState] = useState<Subject[]>([]);
  const [parentInfo, setParentInfoState] = useState<ParentInfo | null>(null);
  const [secondaryParent, setSecondaryParentState] = useState<ParentInfo | null>(null);
  const [studentProfile, setStudentProfileState] = useState<StudentProfile | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        setDisplayName(user.displayName);
        setPhotoURL(user.photoURL);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setClassLevelState((profile as any).classLevel || null);
            setSubjectsState((profile as any).subjects || []);
            setParentInfoState((profile as any).parentInfo || null);
            setSecondaryParentState((profile as any).secondaryParent || null);
            setStudentProfileState((profile as any).studentProfile || null);
            setHasCompletedOnboarding(!!(profile as any).classLevel);
            const tier = (profile as any).premiumTier || 'free';
            setPremiumTier(tier);
            setIsPremium(tier !== 'free');
            if (profile.displayName) setDisplayName(profile.displayName);
            if (profile.photoURL) setPhotoURL(profile.photoURL);

            let trialMs: number | null = null;
            const rawTrial = (profile as any).trialStartDate;
            if (rawTrial) {
              trialMs = rawTrial.toDate ? rawTrial.toDate().getTime() : new Date(rawTrial).getTime();
            } else {
              trialMs = Date.now();
              updateUserProfile(user.uid, { trialStartDate: new Date() } as any).catch(() => {});
            }
            const daysLeft = calcTrialDays(trialMs ?? Date.now());
            const trialOn = daysLeft > 0;
            setTrialDaysRemaining(daysLeft);
            setIsTrialActive(trialOn);
            setEffectiveTier(trialOn ? 'elite' : tier);
          }
        } catch {
          // ignore
        }
      } else {
        setUid(null);
        setDisplayName(null);
        setPhotoURL(null);
        setClassLevelState(null);
        setSubjectsState([]);
        setParentInfoState(null);
        setSecondaryParentState(null);
        setStudentProfileState(null);
        setHasCompletedOnboarding(false);
        setPremiumTier('free');
        setIsPremium(false);
        setIsTrialActive(false);
        setTrialDaysRemaining(0);
        setEffectiveTier('free');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setClassLevel = useCallback((level: ClassLevel) => {
    setClassLevelState(level);
    if (uid) updateUserProfile(uid, { classLevel: level } as any).catch(() => {});
  }, [uid]);

  const setSubjects = useCallback((s: Subject[]) => {
    setSubjectsState(s);
    if (uid) updateUserProfile(uid, { subjects: s } as any).catch(() => {});
  }, [uid]);

  const setParentInfo = useCallback((info: ParentInfo) => {
    setParentInfoState(info);
    if (uid) updateUserProfile(uid, { parentInfo: info } as any).catch(() => {});
  }, [uid]);

  const setSecondaryParent = useCallback((info: ParentInfo) => {
    setSecondaryParentState(info);
    if (uid) updateUserProfile(uid, { secondaryParent: info } as any).catch(() => {});
  }, [uid]);

  const completeOnboarding = useCallback(async (data: {
    classLevel: ClassLevel;
    subjects: Subject[];
    parentInfo?: ParentInfo;
    secondaryParent?: ParentInfo;
    studentProfile?: StudentProfile;
  }) => {
    setClassLevelState(data.classLevel);
    setSubjectsState(data.subjects);
    if (data.parentInfo) setParentInfoState(data.parentInfo);
    if (data.secondaryParent) setSecondaryParentState(data.secondaryParent);
    if (data.studentProfile) setStudentProfileState(data.studentProfile);
    setHasCompletedOnboarding(true);
    if (uid) {
      await updateUserProfile(uid, {
        classLevel: data.classLevel,
        subjects: data.subjects,
        ...(data.parentInfo ? { parentInfo: data.parentInfo } : {}),
        ...(data.secondaryParent ? { secondaryParent: data.secondaryParent } : {}),
        ...(data.studentProfile ? { studentProfile: data.studentProfile } : {}),
      } as any);
    }
  }, [uid]);

  const upgradeToPremium = useCallback((tier: 'scholar' | 'premium' | 'elite') => {
    setPremiumTier(tier);
    setIsPremium(true);
    setEffectiveTier(isTrialActive ? 'elite' : tier);
    if (uid) updateUserProfile(uid, { premiumTier: tier } as any).catch(() => {});
  }, [uid, isTrialActive]);

  return (
    <UserContext.Provider value={{
      uid, isPremium, isTrialActive, trialDaysRemaining, premiumTier, effectiveTier,
      classLevel, subjects, parentInfo, secondaryParent, studentProfile,
      displayName, photoURL, hasCompletedOnboarding,
      setClassLevel, setSubjects, setParentInfo, setSecondaryParent, completeOnboarding, upgradeToPremium, loading,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
