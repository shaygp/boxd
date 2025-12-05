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
  limit,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createActivity } from './activity';

export interface Prediction {
  id?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  raceName: string;
  raceYear: number;
  round?: number;
  predictedWinner: string;
  createdAt: Date;
  updatedAt: Date;
}

const predictionsCollection = collection(db, 'predictions');

export const createOrUpdatePrediction = async (
  raceName: string,
  raceYear: number,
  predictedWinner: string,
  round?: number
) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    // Fetch user's profile
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const username = userData.username || userData.name || user.displayName || 'User';
    const userAvatar = userData.photoURL || user.photoURL || '';

    // Check if user already has a prediction for this race
    const q = query(
      predictionsCollection,
      where('userId', '==', user.uid),
      where('raceName', '==', raceName),
      where('raceYear', '==', raceYear)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // Create new prediction
      const newPrediction = {
        userId: user.uid,
        username,
        userAvatar,
        raceName,
        raceYear,
        round,
        predictedWinner,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(predictionsCollection, newPrediction);

      // Create activity
      await createActivity({
        type: 'prediction',
        targetId: docRef.id,
        targetType: 'prediction',
        raceName,
        raceYear,
        round,
        content: `predicted ${predictedWinner} will win ${raceName}`,
      });

      return docRef.id;
    } else {
      // Update existing prediction
      const existingDoc = snapshot.docs[0];
      await updateDoc(existingDoc.ref, {
        predictedWinner,
        updatedAt: Timestamp.now(),
      });

      // Create activity for update
      await createActivity({
        type: 'prediction',
        targetId: existingDoc.id,
        targetType: 'prediction',
        raceName,
        raceYear,
        round,
        content: `changed prediction to ${predictedWinner} for ${raceName}`,
      });

      return existingDoc.id;
    }
  } catch (error) {
    console.error('[createOrUpdatePrediction] Error:', error);
    throw new Error('Failed to save prediction: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
};

export const getUserPrediction = async (
  userId: string,
  raceName: string,
  raceYear: number
): Promise<Prediction | null> => {
  try {
    const q = query(
      predictionsCollection,
      where('userId', '==', userId),
      where('raceName', '==', raceName),
      where('raceYear', '==', raceYear)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    return {
      id: snapshot.docs[0].id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    } as Prediction;
  } catch (error) {
    console.error('[getUserPrediction] Error:', error);
    return null;
  }
};

export const getAllPredictionsForRace = async (
  raceName: string,
  raceYear: number
): Promise<Prediction[]> => {
  try {
    const q = query(
      predictionsCollection,
      where('raceName', '==', raceName),
      where('raceYear', '==', raceYear),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Prediction;
    });
  } catch (error) {
    console.error('[getAllPredictionsForRace] Error:', error);
    return [];
  }
};

export const getUserPredictions = async (userId: string): Promise<Prediction[]> => {
  try {
    const q = query(
      predictionsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      } as Prediction;
    });
  } catch (error) {
    console.error('[getUserPredictions] Error:', error);
    return [];
  }
};

export const getPredictionStats = async (
  raceName: string,
  raceYear: number
): Promise<{ driver: string; count: number }[]> => {
  try {
    const predictions = await getAllPredictionsForRace(raceName, raceYear);
    const stats: { [driver: string]: number } = {};

    predictions.forEach(pred => {
      stats[pred.predictedWinner] = (stats[pred.predictedWinner] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([driver, count]) => ({ driver, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('[getPredictionStats] Error:', error);
    return [];
  }
};
