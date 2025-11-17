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

      try {
        await createActivity({
          type: 'like',
          targetId: raceLogId,
          targetType: 'raceLog',
        });
      } catch (error) {
        console.error('Failed to create activity:', error);
      }

      // Create notification for the race log owner
      try {
        const raceLogOwnerId = raceLogDoc.data().userId;
        if (raceLogOwnerId && raceLogOwnerId !== user.uid) {
          const likerDoc = await getDoc(doc(db, 'users', user.uid));
          const likerData = likerDoc.exists() ? likerDoc.data() : {};
          const likerName = likerData.name || user.displayName || user.email?.split('@')[0] || 'Someone';
          const likerPhoto = likerData.photoURL || user.photoURL;
          const raceName = raceLogDoc.data().raceName || 'your race log';

          await createNotification({
            userId: raceLogOwnerId,
            type: 'like',
            actorId: user.uid,
            actorName: likerName,
            actorPhotoURL: likerPhoto,
            content: `liked your review of ${raceName}`,
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
