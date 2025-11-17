import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface WatchlistItem {
  id?: string;
  userId: string;
  raceYear: number;
  raceName: string;
  raceLocation: string;
  raceDate: Date | Timestamp;
  countryCode?: string;
  notes: string;
  reminderEnabled: boolean;
  createdAt: Date | Timestamp;
}

const watchlistCollection = collection(db, 'watchlist');

export const addToWatchlist = async (item: Omit<WatchlistItem, 'id' | 'createdAt'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  console.log('[Watchlist] Adding item to watchlist:', {
    raceName: item.raceName,
    raceYear: item.raceYear,
    raceDate: item.raceDate,
    raceDateType: item.raceDate?.constructor?.name
  });

  const newItem = {
    ...item,
    userId: user.uid,
    raceDate: item.raceDate instanceof Date ? Timestamp.fromDate(item.raceDate) : item.raceDate,
    createdAt: Timestamp.now()
  };

  console.log('[Watchlist] Converted item for Firestore:', {
    ...newItem,
    raceDateType: newItem.raceDate?.constructor?.name
  });

  const docRef = await addDoc(watchlistCollection, newItem);
  console.log('[Watchlist] Item added with ID:', docRef.id);
  return docRef.id;
};

export const getUserWatchlist = async (userId: string) => {
  try {
    console.log('[Watchlist] Fetching watchlist for userId:', userId);
    const q = query(
      watchlistCollection,
      where('userId', '==', userId),
      orderBy('raceDate', 'asc')
    );
    const snapshot = await getDocs(q);
    console.log('[Watchlist] Found', snapshot.docs.length, 'items');

    const items = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('[Watchlist] Item:', doc.id, {
        raceName: data.raceName,
        raceYear: data.raceYear,
        raceDate: data.raceDate,
        raceDateType: data.raceDate?.constructor?.name
      });
      return { id: doc.id, ...data } as WatchlistItem;
    });

    return items;
  } catch (error) {
    console.error('[Watchlist] Error fetching watchlist:', error);
    throw error;
  }
};

export const removeFromWatchlist = async (itemId: string) => {
  const docRef = doc(db, 'watchlist', itemId);
  await deleteDoc(docRef);
};
