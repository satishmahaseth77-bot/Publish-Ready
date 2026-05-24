import { db } from './firebase';
import {
  collection, addDoc, query, where, getDocs,
  Timestamp, orderBy, limit, setDoc, doc, getDoc, deleteDoc
} from 'firebase/firestore';

export interface ActivityEntry {
  id?: string;
  uid: string;
  type: 'quiz' | 'chapter' | 'study_session' | 'video';
  subject?: string;
  topic?: string;
  score?: number;
  maxScore?: number;
  duration?: number;
  timestamp: Timestamp;
}

export interface Review {
  uid: string;
  displayName: string;
  photoURL: string | null;
  rating: number;
  text: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const logActivity = async (
  uid: string,
  entry: Omit<ActivityEntry, 'uid' | 'timestamp' | 'id'>
): Promise<void> => {
  try {
    await addDoc(collection(db, 'users', uid, 'activity'), {
      ...entry,
      uid,
      timestamp: Timestamp.now(),
    });
  } catch {
    // silent fail
  }
};

export const getTodayActivity = async (uid: string): Promise<ActivityEntry[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  try {
    const q = query(
      collection(db, 'users', uid, 'activity'),
      where('timestamp', '>=', Timestamp.fromDate(today)),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityEntry));
  } catch {
    return [];
  }
};

export const getWeekActivity = async (uid: string): Promise<ActivityEntry[]> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  try {
    const q = query(
      collection(db, 'users', uid, 'activity'),
      where('timestamp', '>=', Timestamp.fromDate(weekAgo)),
      orderBy('timestamp', 'desc'),
      limit(300)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityEntry));
  } catch {
    return [];
  }
};

export const getAllReviews = async (): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, 'reviews'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Review);
  } catch {
    return [];
  }
};

export const getUserReview = async (uid: string): Promise<Review | null> => {
  try {
    const snap = await getDoc(doc(db, 'reviews', uid));
    return snap.exists() ? (snap.data() as Review) : null;
  } catch {
    return null;
  }
};

export const submitReview = async (
  uid: string,
  data: Pick<Review, 'displayName' | 'photoURL' | 'rating' | 'text'>
): Promise<void> => {
  const now = Timestamp.now();
  const existing = await getUserReview(uid);
  await setDoc(doc(db, 'reviews', uid), {
    uid,
    ...data,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
};

export const deleteReview = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'reviews', uid));
};
