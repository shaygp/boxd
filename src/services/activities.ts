import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Activity {
  id?: string;
  userId: string;
  username: string;
  userProfileImageUrl: string;
  type: 'raceLog' | 'review' | 'listCreated' | 'listUpdated' | 'like' | 'follow' | 'comment';
  targetId: string;
  targetTitle: string;
  content: string;
  metadata: Record<string, any>;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
}

const activitiesCollection = collection(db, 'activities');

export const getUserActivities = async (userId: string, limitCount: number = 20) => {
  const q = query(
    activitiesCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
};

export const getFollowingActivities = async (userIds: string[], limitCount: number = 20) => {
  if (userIds.length === 0) return [];

  const q = query(
    activitiesCollection,
    where('userId', 'in', userIds.slice(0, 10)),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity));
};
