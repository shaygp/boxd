import { db, auth } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';

const challengesCollection = collection(db, 'grillTheGridChallenges');
const attemptsCollection = collection(db, 'grillTheGridAttempts');
const leaderboardCollection = collection(db, 'grillTheGridLeaderboard');

export type ChallengeType = 'az' | 'order' | 'first-corners' | 'higher-lower' | 'quick-fire';

export interface GrillChallenge {
  id?: string;
  name: string;
  type: ChallengeType;
  description: string;
  timeLimit: number; // seconds
  questions: ChallengeQuestion[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  totalAttempts: number;
  createdAt: Date;
}

export interface ChallengeQuestion {
  id: string;
  prompt: string;
  correctAnswer: string | string[]; // string for single, array for multiple
  hints?: string[];
  imageUrl?: string; // For first-corners, spot-mistake
  order?: number;
}

export interface UserAttempt {
  id?: string;
  challengeId: string;
  challengeName: string;
  challengeType: ChallengeType;
  userId: string;
  userName: string;
  userAvatar?: string;
  answers: {
    questionId: string;
    userAnswer: string;
    isCorrect: boolean;
  }[];
  score: number; // Number of correct answers
  totalQuestions: number;
  timeUsed: number; // seconds
  completedAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userAvatar?: string;
  challengeId: string;
  score: number;
  timeUsed: number;
  completedAt: Date;
  rank?: number;
}

/**
 * Get all active Grill the Grid challenges
 */
export const getActiveChallenges = async (): Promise<GrillChallenge[]> => {
  const now = new Date();
  const q = query(
    challengesCollection,
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  const challenges = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    startDate: doc.data().startDate?.toDate(),
    endDate: doc.data().endDate?.toDate(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as GrillChallenge[];

  // Filter out expired challenges (if endDate exists and is past)
  return challenges.filter(c => !c.endDate || c.endDate > now);
};

/**
 * Get a specific challenge by ID
 */
export const getChallenge = async (challengeId: string): Promise<GrillChallenge | null> => {
  const docRef = doc(challengesCollection, challengeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
    startDate: docSnap.data().startDate?.toDate(),
    endDate: docSnap.data().endDate?.toDate(),
    createdAt: docSnap.data().createdAt?.toDate(),
  } as GrillChallenge;
};

/**
 * Check if user has already attempted a challenge
 */
export const hasUserAttempted = async (
  userId: string,
  challengeId: string
): Promise<boolean> => {
  const q = query(
    attemptsCollection,
    where('userId', '==', userId),
    where('challengeId', '==', challengeId),
    firestoreLimit(1)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Submit a user's attempt at a challenge
 */
export const submitAttempt = async (
  challengeId: string,
  answers: { questionId: string; userAnswer: string }[],
  timeUsed: number
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Check if user has already attempted this challenge
  const alreadyAttempted = await hasUserAttempted(user.uid, challengeId);
  if (alreadyAttempted) {
    throw new Error('You have already completed this challenge');
  }

  // Get challenge to validate answers
  const challenge = await getChallenge(challengeId);
  if (!challenge) throw new Error('Challenge not found');

  // Get user profile
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();

  // Score the attempt
  const scoredAnswers = answers.map(answer => {
    const question = challenge.questions.find(q => q.id === answer.questionId);
    if (!question) return { ...answer, isCorrect: false };

    // Check if answer is correct (case-insensitive, trimmed)
    const userAns = answer.userAnswer.trim().toLowerCase();
    const correctAns = Array.isArray(question.correctAnswer)
      ? question.correctAnswer.map(a => a.toLowerCase())
      : [question.correctAnswer.toLowerCase()];

    const isCorrect = correctAns.some(ans => ans === userAns);

    return {
      ...answer,
      isCorrect,
    };
  });

  const score = scoredAnswers.filter(a => a.isCorrect).length;

  const attempt: Omit<UserAttempt, 'id'> = {
    challengeId,
    challengeName: challenge.name,
    challengeType: challenge.type,
    userId: user.uid,
    userName: userData?.username || userData?.name || 'User',
    userAvatar: userData?.photoURL,
    answers: scoredAnswers,
    score,
    totalQuestions: challenge.questions.length,
    timeUsed,
    completedAt: new Date(),
  };

  const docRef = await addDoc(attemptsCollection, {
    ...attempt,
    completedAt: Timestamp.now(),
  });

  // Update challenge total attempts
  await updateDoc(doc(challengesCollection, challengeId), {
    totalAttempts: (challenge.totalAttempts || 0) + 1,
  });

  // Add to leaderboard
  await addDoc(leaderboardCollection, {
    userId: user.uid,
    userName: attempt.userName,
    userAvatar: attempt.userAvatar,
    challengeId,
    score,
    timeUsed,
    completedAt: Timestamp.now(),
  });

  return docRef.id;
};

/**
 * Get user's attempts for a specific challenge
 */
export const getUserAttempts = async (
  userId: string,
  challengeId?: string
): Promise<UserAttempt[]> => {
  let q;
  if (challengeId) {
    q = query(
      attemptsCollection,
      where('userId', '==', userId),
      where('challengeId', '==', challengeId),
      orderBy('completedAt', 'desc')
    );
  } else {
    q = query(
      attemptsCollection,
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    completedAt: doc.data().completedAt?.toDate(),
  })) as UserAttempt[];
};

/**
 * Get leaderboard for a specific challenge
 * Only shows each user once (their best attempt)
 */
export const getChallengeLeaderboard = async (
  challengeId: string,
  limit: number = 20
): Promise<LeaderboardEntry[]> => {
  // Get all leaderboard entries for this challenge
  const q = query(
    leaderboardCollection,
    where('challengeId', '==', challengeId),
    orderBy('score', 'desc'),
    orderBy('timeUsed', 'asc')
  );

  const snapshot = await getDocs(q);
  const allEntries = snapshot.docs.map(doc => ({
    ...doc.data(),
    completedAt: doc.data().completedAt?.toDate(),
  })) as LeaderboardEntry[];

  // Filter to keep only the best entry per user
  const userBestScores = new Map<string, LeaderboardEntry>();

  for (const entry of allEntries) {
    const existing = userBestScores.get(entry.userId);

    if (!existing) {
      userBestScores.set(entry.userId, entry);
    } else {
      // Keep the better score (higher score, or same score but faster time)
      if (
        entry.score > existing.score ||
        (entry.score === existing.score && entry.timeUsed < existing.timeUsed)
      ) {
        userBestScores.set(entry.userId, entry);
      }
    }
  }

  // Convert back to array and sort
  const uniqueEntries = Array.from(userBestScores.values()).sort((a, b) => {
    // Sort by score descending, then by time ascending
    if (a.score !== b.score) {
      return b.score - a.score;
    }
    return a.timeUsed - b.timeUsed;
  });

  // Take only the requested limit and add ranks
  return uniqueEntries.slice(0, limit).map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
};

/**
 * Get user's best score for a challenge
 */
export const getUserBestScore = async (
  userId: string,
  challengeId: string
): Promise<LeaderboardEntry | null> => {
  const q = query(
    leaderboardCollection,
    where('userId', '==', userId),
    where('challengeId', '==', challengeId),
    orderBy('score', 'desc'),
    orderBy('timeUsed', 'asc'),
    firestoreLimit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return {
    ...snapshot.docs[0].data(),
    completedAt: snapshot.docs[0].data().completedAt?.toDate(),
  } as LeaderboardEntry;
};
