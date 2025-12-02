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

export interface Follow {
  id?: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

const followsCollection = collection(db, 'follows');

export const followUser = async (userIdToFollow: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  if (user.uid === userIdToFollow) throw new Error('Cannot follow yourself');

  const existingFollow = await query(
    followsCollection,
    where('followerId', '==', user.uid),
    where('followingId', '==', userIdToFollow)
  );
  const snapshot = await getDocs(existingFollow);

  if (!snapshot.empty) {
    throw new Error('Already following this user');
  }

  await addDoc(followsCollection, {
    followerId: user.uid,
    followingId: userIdToFollow,
    createdAt: Timestamp.now()
  });

  await updateDoc(doc(db, 'userStats', userIdToFollow), {
    followersCount: increment(1)
  });

  await updateDoc(doc(db, 'userStats', user.uid), {
    followingCount: increment(1)
  });

  // Get followed user's name for activity
  try {
    const followedUserDoc = await getDoc(doc(db, 'users', userIdToFollow));
    const followedUserData = followedUserDoc.exists() ? followedUserDoc.data() : {};
    const followedUserName = followedUserData.name || 'a user';

    await createActivity({
      type: 'follow',
      targetId: userIdToFollow,
      targetType: 'user',
      content: followedUserName,
    });
  } catch (error) {
    console.error('Failed to create activity:', error);
  }

  // Create notification for the followed user
  try {
    const followerDoc = await getDoc(doc(db, 'users', user.uid));
    const followerData = followerDoc.exists() ? followerDoc.data() : {};
    const followerName = followerData.name || user.displayName || user.email?.split('@')[0] || 'Someone';
    const followerPhoto = followerData.photoURL || user.photoURL;

    await createNotification({
      userId: userIdToFollow,
      type: 'follow',
      actorId: user.uid,
      actorName: followerName,
      actorPhotoURL: followerPhoto,
      content: 'started following you',
      linkTo: `/user/${user.uid}`,
    });
    console.log('[followUser] Notification created for follow');
  } catch (error) {
    console.error('[followUser] Failed to create notification:', error);
  }
};

export const unfollowUser = async (userIdToUnfollow: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const q = query(
    followsCollection,
    where('followerId', '==', user.uid),
    where('followingId', '==', userIdToUnfollow)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('Not following this user');
  }

  await deleteDoc(doc(db, 'follows', snapshot.docs[0].id));

  await updateDoc(doc(db, 'userStats', userIdToUnfollow), {
    followersCount: increment(-1)
  });

  await updateDoc(doc(db, 'userStats', user.uid), {
    followingCount: increment(-1)
  });
};

export const isFollowing = async (userId: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const q = query(
    followsCollection,
    where('followerId', '==', user.uid),
    where('followingId', '==', userId)
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

export const getFollowers = async (userId: string) => {
  console.log('[getFollowers] Fetching followers for user:', userId);
  const q = query(followsCollection, where('followingId', '==', userId));
  const snapshot = await getDocs(q);

  console.log('[getFollowers] Found', snapshot.docs.length, 'follow documents');

  // Get the actual user data for each follower
  const followerIds = snapshot.docs.map(doc => doc.data().followerId);
  const followers = await Promise.all(
    followerIds.map(async (followerId) => {
      const userDoc = await getDoc(doc(db, 'users', followerId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    })
  );

  const validFollowers = followers.filter(f => f !== null);
  console.log('[getFollowers] Returning', validFollowers.length, 'valid followers');
  return validFollowers;
};

export const getFollowing = async (userId: string) => {
  console.log('[getFollowing] Fetching following for user:', userId);
  const q = query(followsCollection, where('followerId', '==', userId));
  const snapshot = await getDocs(q);

  console.log('[getFollowing] Found', snapshot.docs.length, 'follow documents');

  // Get the actual user data for each followed user
  const followingIds = snapshot.docs.map(doc => doc.data().followingId);
  const following = await Promise.all(
    followingIds.map(async (followingId) => {
      const userDoc = await getDoc(doc(db, 'users', followingId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    })
  );

  const validFollowing = following.filter(f => f !== null);
  console.log('[getFollowing] Returning', validFollowing.length, 'valid following');
  return validFollowing;
};
