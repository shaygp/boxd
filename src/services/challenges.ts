import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createNotification } from './notifications';

export interface Challenge {
  id?: string;
  challengerId: string;
  challengerName: string;
  challengerAvatar?: string;
  challengedId: string;
  challengedName: string;
  challengedAvatar?: string;
  raceYear: number;
  raceRound: number;
  raceName: string;
  raceLocation: string;
  raceDate: Date;
  challengerPrediction: string; // Driver name
  challengedPrediction?: string; // Driver name (null until accepted)
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  winner?: string; // Actual race winner (set after race)
  winnerId?: string; // User ID of challenge winner
  points: number; // Points awarded for correct prediction (default: 10)
  createdAt: Date;
  acceptedAt?: Date;
  completedAt?: Date;
}

const challengesCollection = collection(db, 'challenges');

/**
 * Create a new challenge
 */
export const createChallenge = async (
  challengedUserId: string,
  challengedUserName: string,
  challengedUserAvatar: string | undefined,
  raceYear: number,
  raceRound: number,
  raceName: string,
  raceLocation: string,
  raceDate: Date,
  prediction: string
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Get current user info
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();

  const challenge: Omit<Challenge, 'id'> = {
    challengerId: user.uid,
    challengerName: userData?.username || userData?.name || 'User',
    challengerAvatar: userData?.photoURL,
    challengedId: challengedUserId,
    challengedName: challengedUserName,
    challengedAvatar: challengedUserAvatar,
    raceYear,
    raceRound,
    raceName,
    raceLocation,
    raceDate,
    challengerPrediction: prediction,
    status: 'pending',
    points: 10, // Default points
    createdAt: Timestamp.now() as any,
  };

  const docRef = await addDoc(challengesCollection, challenge);

  // Create notification for challenged user
  await createNotification({
    userId: challengedUserId,
    type: 'challenge',
    actorId: user.uid,
    actorName: challenge.challengerName,
    actorPhotoURL: challenge.challengerAvatar,
    content: `challenged you to predict the winner of ${raceName}`,
    linkTo: `/profile`,
  });

  return docRef.id;
};

/**
 * Accept a challenge and make a prediction
 */
export const acceptChallenge = async (
  challengeId: string,
  prediction: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const challengeRef = doc(challengesCollection, challengeId);
  const challengeDoc = await getDoc(challengeRef);

  if (!challengeDoc.exists()) {
    throw new Error('Challenge not found');
  }

  const challenge = challengeDoc.data() as Challenge;

  if (challenge.challengedId !== user.uid) {
    throw new Error('You are not authorized to accept this challenge');
  }

  if (challenge.status !== 'pending') {
    throw new Error('Challenge has already been responded to');
  }

  await updateDoc(challengeRef, {
    challengedPrediction: prediction,
    status: 'accepted',
    acceptedAt: Timestamp.now(),
  });

  // Notify challenger
  await createNotification({
    userId: challenge.challengerId,
    type: 'challenge_accepted',
    actorId: user.uid,
    actorName: challenge.challengedName,
    actorPhotoURL: challenge.challengedAvatar,
    content: `accepted your challenge for ${challenge.raceName}`,
    linkTo: `/profile`,
  });
};

/**
 * Decline a challenge
 */
export const declineChallenge = async (challengeId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const challengeRef = doc(challengesCollection, challengeId);
  const challengeDoc = await getDoc(challengeRef);

  if (!challengeDoc.exists()) {
    throw new Error('Challenge not found');
  }

  const challenge = challengeDoc.data() as Challenge;

  if (challenge.challengedId !== user.uid) {
    throw new Error('You are not authorized to decline this challenge');
  }

  await updateDoc(challengeRef, {
    status: 'declined',
  });

  // Notify challenger
  await createNotification({
    userId: challenge.challengerId,
    type: 'challenge_declined',
    actorId: user.uid,
    actorName: challenge.challengedName,
    actorPhotoURL: challenge.challengedAvatar,
    content: `declined your challenge for ${challenge.raceName}`,
    linkTo: `/profile`,
  });
};

/**
 * Get challenges for a user (sent or received)
 */
export const getUserChallenges = async (userId: string): Promise<Challenge[]> => {
  // Get challenges where user is challenger
  const sentQuery = query(
    challengesCollection,
    where('challengerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  // Get challenges where user is challenged
  const receivedQuery = query(
    challengesCollection,
    where('challengedId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const [sentSnapshot, receivedSnapshot] = await Promise.all([
    getDocs(sentQuery),
    getDocs(receivedQuery),
  ]);

  const challenges: Challenge[] = [];

  sentSnapshot.forEach((doc) => {
    challenges.push({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      acceptedAt: doc.data().acceptedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      raceDate: doc.data().raceDate?.toDate(),
    } as Challenge);
  });

  receivedSnapshot.forEach((doc) => {
    challenges.push({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      acceptedAt: doc.data().acceptedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
      raceDate: doc.data().raceDate?.toDate(),
    } as Challenge);
  });

  // Sort by date
  challenges.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return challenges;
};

/**
 * Get pending challenges for current user
 */
export const getPendingChallenges = async (): Promise<Challenge[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    challengesCollection,
    where('challengedId', '==', user.uid),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const challenges: Challenge[] = [];

  snapshot.forEach((doc) => {
    challenges.push({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      raceDate: doc.data().raceDate?.toDate(),
    } as Challenge);
  });

  return challenges;
};

/**
 * Resolve a challenge after race is completed
 * This should be called by an admin or automated system after race results are in
 */
export const resolveChallenge = async (
  challengeId: string,
  actualWinner: string
): Promise<void> => {
  const challengeRef = doc(challengesCollection, challengeId);
  const challengeDoc = await getDoc(challengeRef);

  if (!challengeDoc.exists()) {
    throw new Error('Challenge not found');
  }

  const challenge = challengeDoc.data() as Challenge;

  if (challenge.status !== 'accepted') {
    throw new Error('Challenge must be accepted to be resolved');
  }

  let winnerId: string | undefined;

  // Determine winner
  if (challenge.challengerPrediction === actualWinner) {
    winnerId = challenge.challengerId;
  } else if (challenge.challengedPrediction === actualWinner) {
    winnerId = challenge.challengedId;
  }
  // If neither predicted correctly, no winner

  await updateDoc(challengeRef, {
    status: 'completed',
    winner: actualWinner,
    winnerId: winnerId || null,
    completedAt: Timestamp.now(),
  });

  // Award points to winner
  if (winnerId) {
    const userStatsRef = doc(db, 'userStats', winnerId);
    const userStatsDoc = await getDoc(userStatsRef);

    if (userStatsDoc.exists()) {
      const currentPoints = userStatsDoc.data()?.challengePoints || 0;
      await updateDoc(userStatsRef, {
        challengePoints: currentPoints + challenge.points,
        challengesWon: (userStatsDoc.data()?.challengesWon || 0) + 1,
      });
    } else {
      // Create stats doc if it doesn't exist
      await updateDoc(userStatsRef, {
        challengePoints: challenge.points,
        challengesWon: 1,
      });
    }
  }

  // Update loser's stats
  const loserId = winnerId === challenge.challengerId
    ? challenge.challengedId
    : (winnerId === challenge.challengedId ? challenge.challengerId : null);

  if (loserId) {
    const loserStatsRef = doc(db, 'userStats', loserId);
    const loserStatsDoc = await getDoc(loserStatsRef);

    if (loserStatsDoc.exists()) {
      await updateDoc(loserStatsRef, {
        challengesLost: (loserStatsDoc.data()?.challengesLost || 0) + 1,
      });
    }
  }

  // Notify both users
  const winnerName = winnerId === challenge.challengerId
    ? challenge.challengerName
    : challenge.challengedName;

  if (winnerId) {
    // Notify winner
    await createNotification({
      userId: winnerId,
      type: 'challenge_won',
      actorId: winnerId,
      actorName: winnerName,
      content: `You won the challenge for ${challenge.raceName} and earned ${challenge.points} points! 🏆`,
      linkTo: `/profile`,
    });

    // Notify loser
    const loserId = winnerId === challenge.challengerId
      ? challenge.challengedId
      : challenge.challengerId;

    await createNotification({
      userId: loserId,
      type: 'challenge_lost',
      actorId: winnerId,
      actorName: winnerName,
      content: `${winnerName} won the challenge for ${challenge.raceName}`,
      linkTo: `/profile`,
    });
  }
};

/**
 * Delete a challenge (only if pending and you're the challenger)
 */
export const deleteChallenge = async (challengeId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const challengeRef = doc(challengesCollection, challengeId);
  const challengeDoc = await getDoc(challengeRef);

  if (!challengeDoc.exists()) {
    throw new Error('Challenge not found');
  }

  const challenge = challengeDoc.data() as Challenge;

  if (challenge.challengerId !== user.uid) {
    throw new Error('Only the challenger can delete this challenge');
  }

  if (challenge.status !== 'pending') {
    throw new Error('Can only delete pending challenges');
  }

  await deleteDoc(challengeRef);
};
