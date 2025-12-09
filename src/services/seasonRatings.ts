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
  setDoc,
  limit
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { createActivity } from './activity';

export interface SeasonRating {
  id?: string;
  userId: string;
  username: string;
  userAvatar?: string;
  year: number;
  rating: number; // 1-5 stars
  review?: string;
  favoriteRace?: string; // Name of favorite race from the season
  favoriteDriver?: string;
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  commentsCount: number;
}

const seasonRatingsCollection = collection(db, 'seasonRatings');

/**
 * Create or update a season rating
 */
export const createOrUpdateSeasonRating = async (
  year: number,
  rating: number,
  review?: string,
  favoriteRace?: string,
  favoriteDriver?: string
) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('[createOrUpdateSeasonRating] User not authenticated');
    throw new Error('User not authenticated');
  }

  console.log('[createOrUpdateSeasonRating] Creating/updating season rating:', { year, rating, review });

  // Fetch user's profile from Firestore
  let userAvatar = user.photoURL || '';
  let username = user.displayName || 'User';

  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      userAvatar = userData.photoURL || user.photoURL || '';
      username = userData.username || userData.name || user.displayName || 'User';
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }

  // Check if user already has a rating for this season
  const existingRating = await getUserSeasonRating(user.uid, year);

  const ratingData = {
    userId: user.uid,
    username,
    userAvatar,
    year,
    rating,
    review: review || '',
    favoriteRace: favoriteRace || '',
    favoriteDriver: favoriteDriver || '',
    updatedAt: Timestamp.now()
  };

  try {
    if (existingRating?.id) {
      // Update existing rating
      const docRef = doc(db, 'seasonRatings', existingRating.id);
      await updateDoc(docRef, ratingData);
      console.log('[createOrUpdateSeasonRating] Season rating updated successfully');

      // Create activity for updated season rating (only if rating changed significantly)
      if (existingRating.rating !== rating) {
        createActivity({
          type: 'review',
          targetId: existingRating.id,
          targetType: 'seasonRating',
          content: review || '',
          raceYear: year,
          rating,
        }).catch(err => console.error('Failed to create activity:', err));
      }

      return existingRating.id;
    } else {
      // Create new rating
      const newRating = {
        ...ratingData,
        createdAt: Timestamp.now(),
        likesCount: 0,
        commentsCount: 0
      };

      const docRef = await addDoc(seasonRatingsCollection, newRating);
      console.log('[createOrUpdateSeasonRating] Season rating created successfully with ID:', docRef.id);

      // Create activity for new season rating
      createActivity({
        type: 'review',
        targetId: docRef.id,
        targetType: 'seasonRating',
        content: review || '',
        raceYear: year,
        rating,
      }).catch(err => console.error('Failed to create activity:', err));

      return docRef.id;
    }
  } catch (error) {
    console.error('[createOrUpdateSeasonRating] Error creating/updating season rating:', error);
    throw error;
  }
};

/**
 * Get a specific user's rating for a season
 */
export const getUserSeasonRating = async (userId: string, year: number): Promise<SeasonRating | null> => {
  try {
    const q = query(
      seasonRatingsCollection,
      where('userId', '==', userId),
      where('year', '==', year),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
    } as SeasonRating;
  } catch (error) {
    console.error('[getUserSeasonRating] Error fetching user season rating:', error);
    return null;
  }
};

/**
 * Get all ratings for a specific season
 */
export const getSeasonRatings = async (year: number): Promise<SeasonRating[]> => {
  try {
    console.log(`[getSeasonRatings] Querying ratings for year ${year}`);
    const q = query(
      seasonRatingsCollection,
      where('year', '==', year),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    console.log(`[getSeasonRatings] Found ${snapshot.docs.length} documents for year ${year}`);

    const ratings = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`[getSeasonRatings] Document ${doc.id}:`, data);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as SeasonRating;
    });

    return ratings;
  } catch (error) {
    console.error('[getSeasonRatings] Error fetching season ratings:', error);
    return [];
  }
};

/**
 * Get average rating for a season
 */
export const getSeasonAverageRating = async (year: number): Promise<{ average: number; count: number }> => {
  try {
    const ratings = await getSeasonRatings(year);
    console.log(`[getSeasonAverageRating] Year ${year}: Found ${ratings.length} ratings`, ratings);

    if (ratings.length === 0) {
      return { average: 0, count: 0 };
    }

    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const average = sum / ratings.length;

    const result = {
      average: parseFloat(average.toFixed(1)),
      count: ratings.length
    };
    console.log(`[getSeasonAverageRating] Year ${year} result:`, result);

    return result;
  } catch (error) {
    console.error('[getSeasonAverageRating] Error calculating average rating:', error);
    return { average: 0, count: 0 };
  }
};

/**
 * Get all season ratings by a specific user
 */
export const getUserSeasonRatings = async (userId: string): Promise<SeasonRating[]> => {
  try {
    const q = query(
      seasonRatingsCollection,
      where('userId', '==', userId),
      orderBy('year', 'desc')
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)
      } as SeasonRating;
    });
  } catch (error) {
    console.error('[getUserSeasonRatings] Error fetching user season ratings:', error);
    return [];
  }
};

/**
 * Delete a season rating
 */
export const deleteSeasonRating = async (ratingId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  try {
    const docRef = doc(db, 'seasonRatings', ratingId);
    const ratingDoc = await getDoc(docRef);

    if (!ratingDoc.exists()) {
      throw new Error('Season rating not found');
    }

    const ratingData = ratingDoc.data();

    // Verify user owns this rating
    if (ratingData.userId !== user.uid) {
      throw new Error('Unauthorized to delete this rating');
    }

    await updateDoc(docRef, {
      rating: 0,
      review: '',
      favoriteRace: '',
      favoriteDriver: '',
      updatedAt: Timestamp.now()
    });

    console.log('[deleteSeasonRating] Season rating deleted successfully');
  } catch (error) {
    console.error('[deleteSeasonRating] Error deleting season rating:', error);
    throw error;
  }
};
