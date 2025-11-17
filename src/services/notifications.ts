import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface Notification {
  id?: string;
  userId: string; // recipient
  type: 'like' | 'comment' | 'follow' | 'mention';
  actorId: string; // who performed the action
  actorName: string;
  actorPhotoURL?: string;
  content: string; // e.g., "liked your review" or "started following you"
  linkTo?: string; // URL to navigate to
  isRead: boolean;
  createdAt: Date;
}

const notificationsCollection = collection(db, 'notifications');

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Don't create notification if actor is the same as recipient
  if (notification.actorId === notification.userId) return;

  const newNotification = {
    ...notification,
    isRead: false,
    createdAt: Timestamp.now(),
  };

  await addDoc(notificationsCollection, newNotification);
};

export const getUserNotifications = async (userId: string, limitCount: number = 20) => {
  try {
    const q = query(
      notificationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    } as Notification));
  } catch (error: any) {
    console.error('[Notifications] Error fetching notifications:', error);
    if (error.code === 'permission-denied') {
      console.error('[Notifications] Permission denied for userId:', userId);
    }
    return [];
  }
};

export const getUnreadNotificationsCount = async (userId: string) => {
  try {
    const q = query(
      notificationsCollection,
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error: any) {
    console.error('[Notifications] Error fetching unread count:', error);
    if (error.code === 'permission-denied') {
      console.error('[Notifications] Permission denied for userId:', userId);
    }
    return 0;
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  const docRef = doc(db, 'notifications', notificationId);
  await updateDoc(docRef, {
    isRead: true
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  const q = query(
    notificationsCollection,
    where('userId', '==', userId),
    where('isRead', '==', false)
  );

  const snapshot = await getDocs(q);
  const updatePromises = snapshot.docs.map(doc =>
    updateDoc(doc.ref, { isRead: true })
  );

  await Promise.all(updatePromises);
};
