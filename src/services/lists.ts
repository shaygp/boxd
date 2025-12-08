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
  Timestamp,
  increment
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface RaceListItem {
  raceYear: number;
  raceName: string;
  raceLocation: string;
  countryCode?: string;
  order: number;
  note: string;
}

export interface RaceList {
  id?: string;
  userId: string;
  username: string;
  userProfileImageUrl: string;
  listImageUrl?: string;
  title: string;
  description: string;
  races: RaceListItem[];
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
}

const listsCollection = collection(db, 'lists');

export const createList = async (list: Omit<RaceList, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount'>) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('[createList] User not authenticated');
    throw new Error('User not authenticated');
  }

  console.log('[createList] Creating list for user:', user.uid);
  console.log('[createList] List data:', list);

  const newList = {
    ...list,
    userId: user.uid,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    likesCount: 0,
    commentsCount: 0
  };

  console.log('[createList] newList with timestamps:', newList);

  try {
    const docRef = await addDoc(listsCollection, newList);
    console.log('[createList] List created successfully with ID:', docRef.id);

    await updateDoc(doc(db, 'userStats', user.uid), {
      listsCount: increment(1)
    });
    console.log('[createList] User stats updated');

    return docRef.id;
  } catch (error) {
    console.error('[createList] Error creating list:', error);
    throw error;
  }
};

export const getUserLists = async (userId: string) => {
  console.log('[getUserLists] Fetching lists for user:', userId);

  try {
    const q = query(
      listsCollection,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    console.log('[getUserLists] Found', snapshot.docs.length, 'lists');

    const lists = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('[getUserLists] List data:', { id: doc.id, ...data });
      return { id: doc.id, ...data } as RaceList;
    });

    return lists;
  } catch (error) {
    console.error('[getUserLists] Error fetching lists:', error);
    throw error;
  }
};

export const getPublicLists = async () => {
  const q = query(
    listsCollection,
    where('isPublic', '==', true),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RaceList));
};

export const getListById = async (listId: string) => {
  const docRef = doc(db, 'lists', listId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as RaceList;
  }
  return null;
};

export const updateList = async (listId: string, updates: Partial<RaceList>) => {
  const docRef = doc(db, 'lists', listId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Timestamp.now()
  });
};

export const deleteList = async (listId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const docRef = doc(db, 'lists', listId);
  await deleteDoc(docRef);

  await updateDoc(doc(db, 'userStats', user.uid), {
    listsCount: increment(-1)
  });
};

export const addRaceToList = async (listId: string, race: RaceListItem) => {
  const listDoc = await getListById(listId);
  if (!listDoc) throw new Error('List not found');

  const updatedRaces = [...(listDoc.races || []), { ...race, order: listDoc.races?.length || 0 }];
  await updateList(listId, { races: updatedRaces });
};

export const removeRaceFromList = async (listId: string, raceIndex: number) => {
  const listDoc = await getListById(listId);
  if (!listDoc) throw new Error('List not found');

  const updatedRaces = listDoc.races?.filter((_, idx) => idx !== raceIndex) || [];
  await updateList(listId, { races: updatedRaces });
};

export const likeList = async (listId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const likeRef = doc(db, 'listLikes', `${user.uid}_${listId}`);
  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    throw new Error('Already liked');
  }

  await addDoc(collection(db, 'listLikes'), {
    userId: user.uid,
    listId,
    createdAt: Timestamp.now()
  });

  await updateDoc(doc(db, 'lists', listId), {
    likesCount: increment(1)
  });
};

export const unlikeList = async (listId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    collection(db, 'listLikes'),
    where('userId', '==', user.uid),
    where('listId', '==', listId)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Not liked');
  }

  await deleteDoc(snapshot.docs[0].ref);

  await updateDoc(doc(db, 'lists', listId), {
    likesCount: increment(-1)
  });
};

export const isListLiked = async (listId: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const q = query(
    collection(db, 'listLikes'),
    where('userId', '==', user.uid),
    where('listId', '==', listId)
  );
  const snapshot = await getDocs(q);

  return !snapshot.empty;
};
