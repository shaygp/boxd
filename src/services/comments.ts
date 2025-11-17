import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createNotification } from './notifications';

export interface Comment {
  id?: string;
  raceLogId: string;
  userId: string;
  username: string;
  userAvatar?: string;
  content: string;
  createdAt: Date;
  likesCount: number;
  likedBy: string[];
}

const commentsCollection = collection(db, 'comments');

export const addComment = async (raceLogId: string, content: string) => {
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
    console.error('Error fetching user profile for comment:', error);
  }

  const newComment = {
    raceLogId,
    userId: user.uid,
    username,
    userAvatar,
    content,
    createdAt: Timestamp.now(),
    likesCount: 0,
    likedBy: []
  };

  const docRef = await addDoc(commentsCollection, newComment);

  await updateDoc(doc(db, 'raceLogs', raceLogId), {
    commentsCount: increment(1)
  });

  // Create notification for the race log owner
  try {
    const raceLogDoc = await getDoc(doc(db, 'raceLogs', raceLogId));
    if (raceLogDoc.exists()) {
      const raceLogOwnerId = raceLogDoc.data().userId;
      if (raceLogOwnerId && raceLogOwnerId !== user.uid) {
        const raceName = raceLogDoc.data().raceName || 'your race log';

        await createNotification({
          userId: raceLogOwnerId,
          type: 'comment',
          actorId: user.uid,
          actorName: username,
          actorPhotoURL: userAvatar,
          content: `commented on your review of ${raceName}`,
          linkTo: `/race/${raceLogId}`,
        });
        console.log('[addComment] Notification created for comment');
      }
    }
  } catch (error) {
    console.error('[addComment] Failed to create notification:', error);
  }

  return docRef.id;
};

export const deleteComment = async (commentId: string, raceLogId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  await deleteDoc(doc(db, 'comments', commentId));

  await updateDoc(doc(db, 'raceLogs', raceLogId), {
    commentsCount: increment(-1)
  });
};

export const getComments = async (raceLogId: string) => {
  const q = query(
    commentsCollection,
    where('raceLogId', '==', raceLogId),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
};

export const toggleCommentLike = async (commentId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const commentRef = doc(db, 'comments', commentId);
  const commentDoc = await getDocs(query(commentsCollection, where('__name__', '==', commentId)));

  if (commentDoc.empty) throw new Error('Comment not found');

  const comment = commentDoc.docs[0].data() as Comment;
  const likedBy = comment.likedBy || [];
  const isLiked = likedBy.includes(user.uid);

  if (isLiked) {
    await updateDoc(commentRef, {
      likedBy: likedBy.filter(id => id !== user.uid),
      likesCount: increment(-1)
    });
    return false;
  } else {
    await updateDoc(commentRef, {
      likedBy: [...likedBy, user.uid],
      likesCount: increment(1)
    });
    return true;
  }
};
