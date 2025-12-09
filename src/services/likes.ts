import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createActivity } from './activity';
import { createNotification } from './notifications';

export interface Like {
  id?: string;
  userId: string;
  raceLogId: string;
  createdAt: Date;
}

const likesCollection = collection(db, 'likes');

export const toggleLike = async (raceLogId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    likesCollection,
    where('userId', '==', user.uid),
    where('raceLogId', '==', raceLogId)
  );

  const snapshot = await getDocs(q);
  const raceLogRef = doc(db, 'raceLogs', raceLogId);

  if (snapshot.empty) {
    // LIKE: Add like document and update race log
    const newLike = {
      userId: user.uid,
      raceLogId,
      createdAt: Timestamp.now()
    };

    // Fetch race log data once
    const raceLogDoc = await getDoc(raceLogRef);
    if (!raceLogDoc.exists()) {
      throw new Error('Race log not found');
    }

    const raceData = raceLogDoc.data();
    const likedBy = raceData.likedBy || [];

    // Perform core operations in parallel
    await Promise.all([
      addDoc(likesCollection, newLike),
      updateDoc(raceLogRef, {
        likedBy: [...likedBy, user.uid],
        likesCount: increment(1)
      })
    ]);

    // Background tasks - don't await these
    const raceLogOwnerId = raceData.userId;
    if (raceLogOwnerId && raceLogOwnerId !== user.uid) {
      // Run activity and notification creation in background
      Promise.all([
        createActivity({
          type: 'like',
          targetId: raceLogId,
          targetType: 'raceLog',
          raceName: raceData.raceName,
          raceYear: raceData.raceYear,
          round: raceData.round,
          raceLocation: raceData.raceLocation,
          rating: raceData.rating,
        }).catch(err => console.error('[toggleLike] Failed to create activity:', err)),

        getDoc(doc(db, 'users', user.uid)).then(likerDoc => {
          const likerData = likerDoc.exists() ? likerDoc.data() : {};
          const likerName = likerData.username || likerData.name || user.displayName || 'Someone';
          const likerPhoto = likerData.photoURL || user.photoURL;

          console.log('[toggleLike] Creating notification for review owner:', {
            userId: raceLogOwnerId,
            actorId: user.uid,
            actorName: likerName,
            raceName: raceData.raceName
          });

          return createNotification({
            userId: raceLogOwnerId,
            type: 'like',
            actorId: user.uid,
            actorName: likerName,
            actorPhotoURL: likerPhoto,
            content: `liked your review of ${raceData.raceName || 'your race log'}`,
            linkTo: `/race/${raceLogId}`,
          });
        }).catch(err => console.error('[toggleLike] Failed to create notification:', err))
      ]).catch(err => console.error('[toggleLike] Promise.all error:', err));
    }

    return true;
  } else {
    // UNLIKE: Remove like document and update race log
    const likeDoc = snapshot.docs[0];
    const raceLogDoc = await getDoc(raceLogRef);

    if (raceLogDoc.exists()) {
      const likedBy = raceLogDoc.data().likedBy || [];

      // Perform both operations in parallel
      await Promise.all([
        deleteDoc(doc(db, 'likes', likeDoc.id)),
        updateDoc(raceLogRef, {
          likedBy: likedBy.filter((id: string) => id !== user.uid),
          likesCount: increment(-1)
        })
      ]);
    } else {
      await deleteDoc(doc(db, 'likes', likeDoc.id));
    }

    return false;
  }
};

export const getRaceLogLikes = async (raceLogId: string) => {
  const q = query(likesCollection, where('raceLogId', '==', raceLogId));
  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const hasUserLiked = async (raceLogId: string, userId: string) => {
  const q = query(
    likesCollection,
    where('userId', '==', userId),
    where('raceLogId', '==', raceLogId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};
