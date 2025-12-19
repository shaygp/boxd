import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface Report {
  id?: string;
  reportedBy: string;
  reportedUser: string;
  reportedContent?: string; // ID of the content (review, comment, etc.)
  contentType?: 'review' | 'comment' | 'profile' | 'other';
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

const reportsCollection = collection(db, 'reports');

export const reportUser = async (
  reportedUserId: string,
  reason: string,
  description?: string
) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const report: Omit<Report, 'id' | 'createdAt'> = {
    reportedBy: user.uid,
    reportedUser: reportedUserId,
    contentType: 'profile',
    reason,
    description,
    status: 'pending',
  };

  const docRef = await addDoc(reportsCollection, {
    ...report,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};

export const reportContent = async (
  reportedUserId: string,
  contentId: string,
  contentType: 'review' | 'comment' | 'other',
  reason: string,
  description?: string
) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const report: Omit<Report, 'id' | 'createdAt'> = {
    reportedBy: user.uid,
    reportedUser: reportedUserId,
    reportedContent: contentId,
    contentType,
    reason,
    description,
    status: 'pending',
  };

  const docRef = await addDoc(reportsCollection, {
    ...report,
    createdAt: Timestamp.now(),
  });

  return docRef.id;
};

export const blockUser = async (blockedUserId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Add to blocked users in userStats
  const userStatsRef = doc(db, 'userStats', user.uid);
  await updateDoc(userStatsRef, {
    blockedUsers: arrayUnion(blockedUserId),
  });

  return true;
};

export const unblockUser = async (blockedUserId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Remove from blocked users
  const userStatsRef = doc(db, 'userStats', user.uid);
  const userStats = await getDoc(userStatsRef);

  if (userStats.exists()) {
    const data = userStats.data();
    const blockedUsers = (data.blockedUsers || []).filter(
      (id: string) => id !== blockedUserId
    );

    await updateDoc(userStatsRef, {
      blockedUsers,
    });
  }

  return true;
};

export const getBlockedUsers = async (): Promise<string[]> => {
  const user = auth.currentUser;
  if (!user) return ['5vQUKZJb49aAQ1XtixFefb6nznq1']; // Always block this user globally

  const userStatsRef = doc(db, 'userStats', user.uid);
  const userStats = await getDoc(userStatsRef);

  // Always include the globally blocked user
  const globallyBlockedUsers = ['5vQUKZJb49aAQ1XtixFefb6nznq1'];

  if (userStats.exists()) {
    const data = userStats.data();
    const userBlockedList = data.blockedUsers || [];

    // Combine user's blocked list with globally blocked users (no duplicates)
    return [...new Set([...globallyBlockedUsers, ...userBlockedList])];
  }

  return globallyBlockedUsers;
};

export const isUserBlocked = async (userId: string): Promise<boolean> => {
  const blockedUsers = await getBlockedUsers();
  return blockedUsers.includes(userId);
};
