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
    const newLike = {
      userId: user.uid,
      raceLogId,
      createdAt: Timestamp.now()
    };
    await addDoc(likesCollection, newLike);

    const raceLogDoc = await getDoc(raceLogRef);
    if (raceLogDoc.exists()) {
      const likedBy = raceLogDoc.data().likedBy || [];
      await updateDoc(raceLogRef, {
        likedBy: [...likedBy, user.uid],
        likesCount: increment(1)
      });

      // Extract race metadata
      const raceData = raceLogDoc.data();
      const raceName = raceData.raceName;
      const raceYear = raceData.raceYear;
      const round = raceData.round;
      const raceLocation = raceData.raceLocation;
      const rating = raceData.rating;
      const raceLogOwnerId = raceData.userId;

      // Only create activity if user is liking someone else's race log (not their own)
      if (raceLogOwnerId !== user.uid) {
        try {
          await createActivity({
            type: 'like',
            targetId: raceLogId,
            targetType: 'raceLog',
            raceName,
            raceYear,
            round,
            raceLocation,
            rating,
          });
        } catch (error) {
          console.error('Failed to create activity:', error);
        }
      }

      // Create notification for the race log owner
      try {
        const raceLogOwnerId = raceData.userId;
        if (raceLogOwnerId && raceLogOwnerId !== user.uid) {
          const likerDoc = await getDoc(doc(db, 'users', user.uid));
          const likerData = likerDoc.exists() ? likerDoc.data() : {};
          const likerName = likerData.name || user.displayName || user.email?.split('@')[0] || 'Someone';
          const likerPhoto = likerData.photoURL || user.photoURL;

          await createNotification({
            userId: raceLogOwnerId,
            type: 'like',
            actorId: user.uid,
            actorName: likerName,
            actorPhotoURL: likerPhoto,
            content: `liked your review of ${raceName || 'your race log'}`,
            linkTo: `/race/${raceLogId}`,
          });
          console.log('[toggleLike] Notification created for like');
        }
      } catch (error) {
        console.error('[toggleLike] Failed to create notification:', error);
      }
    }

    return true;
  } else {
    const likeDoc = snapshot.docs[0];
    await deleteDoc(doc(db, 'likes', likeDoc.id));

    const raceLogDoc = await getDoc(raceLogRef);
    if (raceLogDoc.exists()) {
      const likedBy = raceLogDoc.data().likedBy || [];
      await updateDoc(raceLogRef, {
        likedBy: likedBy.filter((id: string) => id !== user.uid),
        likesCount: increment(-1)
      });
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
