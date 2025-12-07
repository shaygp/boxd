import {
  collection,
  addDoc,
  query,
  orderBy,
  limit as firestoreLimit,
  onSnapshot,
  Timestamp,
  where,
  getDocs,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export interface ChatMessage {
  id?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  message: string;
  createdAt: Date;
  raceName: string;
  raceYear: number;
  supportingDriver?: 'verstappen' | 'norris' | 'piastri';
}

const chatMessagesCollection = collection(db, 'liveChat');

export const sendChatMessage = async (
  message: string,
  raceName: string,
  raceYear: number,
  supportingDriver?: 'verstappen' | 'norris' | 'piastri'
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Check rate limit - 1 message per minute
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const recentMessagesQuery = query(
    chatMessagesCollection,
    where('userId', '==', user.uid),
    where('raceName', '==', raceName),
    where('raceYear', '==', raceYear),
    where('createdAt', '>', Timestamp.fromDate(oneMinuteAgo))
  );

  const recentMessages = await getDocs(recentMessagesQuery);
  if (!recentMessages.empty) {
    const lastMessage = recentMessages.docs[0].data();
    const lastMessageTime = lastMessage.createdAt.toDate();
    const secondsRemaining = Math.ceil((60 - (Date.now() - lastMessageTime.getTime()) / 1000));
    throw new Error(`Please wait ${secondsRemaining} seconds before sending another message`);
  }

  // Get user data
  const userDocRef = doc(db, 'users', user.uid);
  const userDocSnap = await getDoc(userDocRef);

  let username = user.displayName || 'User';
  let userAvatar = user.photoURL;

  if (userDocSnap.exists()) {
    const userData = userDocSnap.data();
    username = userData.name || userData.username || username;
    userAvatar = userData.photoURL || userAvatar;
  }

  const chatMessage: any = {
    userId: user.uid,
    username,
    message: message.trim(),
    raceName,
    raceYear,
    createdAt: serverTimestamp(),
  };

  // Only include optional fields if they have values
  if (userAvatar) {
    chatMessage.userAvatar = userAvatar;
  }

  if (supportingDriver) {
    chatMessage.supportingDriver = supportingDriver;
  }

  const docRef = await addDoc(chatMessagesCollection, chatMessage);
  return docRef.id;
};

export const subscribeToChat = (
  raceName: string,
  raceYear: number,
  limit: number,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    chatMessagesCollection,
    where('raceName', '==', raceName),
    where('raceYear', '==', raceYear),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      } as ChatMessage;
    });

    // Reverse to show oldest first
    callback(messages.reverse());
  });
};
