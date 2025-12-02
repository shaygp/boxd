import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  setDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface RaceLog {
  id?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  raceYear: number;
  raceName: string;
  raceLocation: string;
  round?: number;
  countryCode?: string;
  dateWatched: Date;
  sessionType: 'race' | 'sprint' | 'qualifying' | 'highlights';
  watchMode: 'live' | 'replay' | 'tvBroadcast' | 'highlights' | 'attendedInPerson';
  rating: number;
  review: string;
  companions: string[];
  driverOfTheDay?: string;
  raceWinner?: string;
  mediaUrls: string[];
  spoilerWarning: boolean;
  visibility: 'public' | 'private' | 'friends';
  addToLists?: string[];
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
  likedBy: string[];
}

const raceLogsCollection = collection(db, 'raceLogs');

const updateUserStats = async (userId: string) => {
  // Get all user's race logs
  const userLogs = await getUserRaceLogs(userId);

  // Calculate stats
  const racesWatched = userLogs.length;
  const reviewsCount = userLogs.filter(log => log.review && log.review.length > 0).length;
  const totalHoursWatched = calculateTotalHoursWatched(userLogs);

  // Update userStats document
  const userStatsRef = doc(db, 'userStats', userId);
  await setDoc(userStatsRef, {
    racesWatched,
    reviewsCount,
    totalHoursWatched
  }, { merge: true });
};

export const createRaceLog = async (raceLog: Omit<RaceLog, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'likedBy'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    console.log('[createRaceLog] Creating new race log for user:', user.uid);
    console.log('[createRaceLog] Race data:', {
      raceName: raceLog.raceName,
      raceYear: raceLog.raceYear,
      dateWatched: raceLog.dateWatched,
      rating: raceLog.rating,
    });

    // Fetch user's profile from Firestore to get the latest photoURL and username
    let userAvatar = user.photoURL || '';
    let username = raceLog.username || user.displayName || user.email?.split('@')[0] || 'User';

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        userAvatar = userData.photoURL || user.photoURL || '';
        username = userData.name || username;
      }
    } catch (error) {
      console.error('Error fetching user profile for race log:', error);
    }

    // Convert Date to Timestamp if needed
    const dateWatchedTimestamp = raceLog.dateWatched instanceof Date
      ? Timestamp.fromDate(raceLog.dateWatched)
      : raceLog.dateWatched;

    const newLog = {
      ...raceLog,
      username,
      userAvatar,
      dateWatched: dateWatchedTimestamp,
      userId: user.uid,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      likesCount: 0,
      commentsCount: 0,
      likedBy: []
    };

    const docRef = await addDoc(raceLogsCollection, newLog);
    console.log('[createRaceLog] Successfully created race log with ID:', docRef.id);

    // Update user stats
    await updateUserStats(user.uid);

    return docRef.id;
  } catch (error) {
    console.error('[createRaceLog] Error creating race log:', error);
    console.error('UserId:', user.uid, 'Race:', raceLog.raceName);
    throw new Error('Failed to create race log: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getUserRaceLogs = async (userId: string) => {
  try {
    const q = query(
      raceLogsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to Date objects
      return {
        id: doc.id,
        ...data,
        dateWatched: data.dateWatched?.toDate ? data.dateWatched.toDate() : new Date(data.dateWatched),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as RaceLog;
    });
  } catch (error) {
    console.error('Error fetching user race logs:', error);
    console.error('UserId:', userId);
    throw new Error('Failed to fetch race logs: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getPublicRaceLogs = async (limitCount: number = 20) => {
  try {
    const q = query(
      raceLogsCollection,
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to Date objects
      return {
        id: doc.id,
        ...data,
        dateWatched: data.dateWatched?.toDate ? data.dateWatched.toDate() : new Date(data.dateWatched),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as RaceLog;
    });
  } catch (error) {
    console.error('Error fetching public race logs:', error);
    throw new Error('Failed to fetch public race logs: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getRaceLogById = async (logId: string) => {
  try {
    const docRef = doc(db, 'raceLogs', logId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      // Convert Firestore Timestamps to Date objects
      return {
        id: docSnap.id,
        ...data,
        dateWatched: data.dateWatched?.toDate ? data.dateWatched.toDate() : new Date(data.dateWatched),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as RaceLog;
    }
    return null;
  } catch (error) {
    console.error('Error fetching race log by ID:', error);
    console.error('LogId:', logId);
    throw new Error('Failed to fetch race log: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const updateRaceLog = async (logId: string, updates: Partial<RaceLog>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    console.log('[updateRaceLog] Updating log:', logId, 'Updates:', updates);
    const docRef = doc(db, 'raceLogs', logId);

    // Convert Date objects to Timestamps for Firestore
    const updatesToSave: any = { ...updates };
    if (updates.dateWatched) {
      updatesToSave.dateWatched = updates.dateWatched instanceof Date
        ? Timestamp.fromDate(updates.dateWatched)
        : updates.dateWatched;
    }

    await updateDoc(docRef, {
      ...updatesToSave,
      updatedAt: Timestamp.now()
    });

    console.log('[updateRaceLog] Successfully updated race log');
    // Update user stats
    await updateUserStats(user.uid);
  } catch (error) {
    console.error('[updateRaceLog] Error updating race log:', error);
    console.error('LogId:', logId, 'UserId:', user.uid);
    throw new Error('Failed to update race log: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const deleteRaceLog = async (logId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    console.log('[deleteRaceLog] Deleting log:', logId, 'UserId:', user.uid);
    const docRef = doc(db, 'raceLogs', logId);
    await deleteDoc(docRef);

    console.log('[deleteRaceLog] Successfully deleted race log');
    // Update user stats
    await updateUserStats(user.uid);
  } catch (error) {
    console.error('[deleteRaceLog] Error deleting race log:', error);
    console.error('LogId:', logId, 'UserId:', user.uid);
    throw new Error('Failed to delete race log: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getRaceLogsByYear = async (year: number) => {
  try {
    const q = query(
      raceLogsCollection,
      where('raceYear', '==', year),
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps to Date objects
      return {
        id: doc.id,
        ...data,
        dateWatched: data.dateWatched?.toDate ? data.dateWatched.toDate() : new Date(data.dateWatched),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as RaceLog;
    });
  } catch (error) {
    console.error('Error fetching race logs by year:', error);
    console.error('Year:', year);
    throw new Error('Failed to fetch race logs by year: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};


export const calculateTotalHoursWatched = (logs: RaceLog[]): number => {
  return logs.reduce((total, log) => {
    let hours = 0;
    switch (log.sessionType) {
      case 'race':
        hours = 2;
        break;
      case 'sprint':
        hours = 0.5;
        break;
      case 'qualifying':
        hours = 1;
        break;
      case 'highlights':
        hours = 0.25;
        break;
      default:
        // Fallback for any unhandled session types (e.g., 'sprintQualifying')
        hours = 1;
        console.warn(`[calculateTotalHoursWatched] Unknown sessionType: ${log.sessionType}, using 1 hour default`);
        break;
    }
    return total + hours;
  }, 0);
};

export const getUserProfile = async (userId: string) => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};
