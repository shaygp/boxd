import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getFollowing } from './follows';

export interface Activity {
  id?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  type: 'log' | 'review' | 'like' | 'list' | 'follow';
  targetId: string;
  targetType: 'raceLog' | 'list' | 'user';
  content?: string;
  createdAt: Date;
  // Optional race metadata for enhanced display
  raceName?: string;
  raceYear?: number;
  round?: number;
  raceLocation?: string;
  rating?: number;
  posterUrl?: string;
}

const activitiesCollection = collection(db, 'activities');

export const createActivity = async (activity: Omit<Activity, 'id' | 'createdAt' | 'userId' | 'username' | 'userAvatar'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Fetch user's profile from Firestore to get the latest photoURL
  let userAvatar = user.photoURL || '';
  let username = user.displayName || user.email?.split('@')[0] || 'User';

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userAvatar = userData.photoURL || user.photoURL || '';
      username = userData.name || username;
    }
  } catch (error) {
    console.error('Error fetching user profile for activity:', error);
  }

  const newActivity = {
    ...activity,
    userId: user.uid,
    username,
    userAvatar,
    createdAt: Timestamp.now()
  };

  const docRef = await addDoc(activitiesCollection, newActivity);
  return docRef.id;
};

export const getUserActivity = async (userId: string, limitCount: number = 20) => {
  const q = query(
    activitiesCollection,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);

  // Fetch user profile once for this user
  let userAvatar = '';
  let username = 'User';

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userAvatar = userData.photoURL || '';
      username = userData.name || username;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }

  return snapshot.docs.map(docSnapshot => {
    const data = docSnapshot.data();
    return {
      id: docSnapshot.id,
      ...data,
      username: data.username || username,
      userAvatar: data.userAvatar || userAvatar,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    } as Activity;
  });
};

export const getFollowingActivity = async (limitCount: number = 50) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const following = await getFollowing(user.uid);
  const followingIds = following.map(f => f.followingId).filter(id => id !== undefined && id !== null);

  if (followingIds.length === 0) {
    return [];
  }

  // Firestore 'in' queries are limited to 10 items, so we need to batch queries
  const batchSize = 10;
  const batches: Activity[][] = [];

  for (let i = 0; i < followingIds.length; i += batchSize) {
    const batch = followingIds.slice(i, i + batchSize).filter(id => id !== undefined && id !== null);

    // Skip empty batches
    if (batch.length === 0) continue;

    const q = query(
      activitiesCollection,
      where('userId', 'in', batch),
      orderBy('createdAt', 'desc'),
      limit(100) // Fetch more from each batch to ensure we get recent activities
    );

    const snapshot = await getDocs(q);

    // Fetch user profiles for activities missing userAvatar
    const activities = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let userAvatar = data.userAvatar || '';
        let username = data.username || 'User';

        // If userAvatar is missing or empty, fetch from users collection
        if (!userAvatar && data.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userAvatar = userData.photoURL || '';
              username = userData.name || username;
            }
          } catch (error) {
            console.error('Error fetching user profile for activity:', error);
          }
        }

        return {
          id: docSnapshot.id,
          ...data,
          username,
          userAvatar,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Activity;
      })
    );

    batches.push(activities);
  }

  // Combine all batches and sort by createdAt
  const allActivities = batches.flat();
  allActivities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Return only the requested limit
  return allActivities.slice(0, limitCount);
};

export const getGlobalActivity = async (limitCount: number = 50) => {
  try {
    console.log('[activity.ts] Fetching global activities with limit:', limitCount);
    const q = query(
      activitiesCollection,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    console.log('[activity.ts] Query returned', snapshot.docs.length, 'documents');

    // Fetch user profiles for activities missing userAvatar
    const activities = await Promise.all(
      snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        let userAvatar = data.userAvatar || '';
        let username = data.username || 'User';

        // If userAvatar is missing or empty, fetch from users collection
        if (!userAvatar && data.userId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', data.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userAvatar = userData.photoURL || '';
              username = userData.name || username;
            }
          } catch (error) {
            console.error('[activity.ts] Error fetching user profile for activity:', error);
          }
        }

        return {
          id: docSnapshot.id,
          ...data,
          username,
          userAvatar,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Activity;
      })
    );

    console.log('[activity.ts] Returning', activities.length, 'activities');
    return activities;
  } catch (error: any) {
    console.error('[activity.ts] Error in getGlobalActivity:', error);
    console.error('[activity.ts] Error message:', error.message);
    console.error('[activity.ts] Error code:', error.code);

    // If it's an index error, provide helpful message
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.error('[activity.ts] ⚠️ FIRESTORE INDEX REQUIRED');
      console.error('[activity.ts] Please create the index by clicking the link in the error above');
    }

    // Return empty array instead of throwing to prevent app from breaking
    return [];
  }
};
