import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getRacesBySeason as getFirestoreRacesBySeason } from './f1Calendar';

export interface SearchResult {
  id: string;
  type: 'race' | 'user' | 'list';
  title: string;
  subtitle?: string;
  metadata?: any;
}

export const searchRaces = async (searchTerm: string, limitCount: number = 10): Promise<SearchResult[]> => {
  const term = searchTerm.toLowerCase();

  // Search across all seasons (2020-2025)
  const seasons = [2025, 2024, 2023, 2022, 2021, 2020];
  const allRacesPromises = seasons.map(year => getFirestoreRacesBySeason(year));
  const allRacesArrays = await Promise.all(allRacesPromises);
  const firestoreRaces = allRacesArrays.flat();

  // Convert Firestore races to expected format
  const allRaces = firestoreRaces.map(race => ({
    meeting_key: race.round,
    year: race.year,
    round: race.round,
    meeting_name: race.raceName,
    circuit_short_name: race.circuitName,
    date_start: race.dateStart.toISOString(),
    country_code: race.countryCode,
    country_name: race.countryName,
    location: race.location,
    circuit_key: race.round
  }));

  const filteredRaces = allRaces.filter(race =>
    race.meeting_name?.toLowerCase().includes(term) ||
    race.circuit_short_name?.toLowerCase().includes(term) ||
    race.location?.toLowerCase().includes(term) ||
    race.country_name?.toLowerCase().includes(term)
  ).slice(0, limitCount);

  return filteredRaces.map(race => ({
    id: `${race.year}-${race.meeting_key}`,
    type: 'race' as const,
    title: race.meeting_name,
    subtitle: `${race.year} • ${race.circuit_short_name}`,
    metadata: race
  }));
};

export const searchUsers = async (searchTerm: string, limitCount: number = 10): Promise<SearchResult[]> => {
  // Remove @ symbol if present and convert to lowercase
  const term = searchTerm.replace(/^@/, '').toLowerCase().trim();

  try {
    console.log('[searchUsers] Searching for:', term);
    const usersCollection = collection(db, 'users');
    // Get ALL users - no limit to ensure we search through everyone
    const q = query(usersCollection);
    const snapshot = await getDocs(q);

    console.log('[searchUsers] Found', snapshot.docs.length, 'total users in database');

    // Map and deduplicate by user ID
    const seenUserIds = new Set();
    const seenUsernames = new Set();

    const users = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => {
        // Skip if no username (old/incomplete profiles)
        if (!user.username) {
          return false;
        }

        // Skip duplicates by user ID
        if (seenUserIds.has(user.id)) {
          console.log('[searchUsers] Skipping duplicate user ID:', user.id);
          return false;
        }

        // Skip if we already have this username (in case of old data)
        if (seenUsernames.has(user.username)) {
          console.log('[searchUsers] Skipping duplicate username:', user.username);
          return false;
        }

        seenUserIds.add(user.id);
        seenUsernames.add(user.username);

        const nameMatch = user.name?.toLowerCase().includes(term);
        const usernameMatch = user.username?.toLowerCase().includes(term);
        const emailMatch = user.email?.toLowerCase().includes(term);

        const matches = nameMatch || usernameMatch || emailMatch;

        // Log users that match for debugging
        if (matches) {
          console.log('[searchUsers] Match found:', {
            id: user.id,
            username: user.username,
            name: user.name,
            nameMatch,
            usernameMatch,
            emailMatch
          });
        }

        return matches;
      })
      .slice(0, limitCount);

    console.log('[searchUsers] Filtered to', users.length, 'matching users');

    return users.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.name || user.username || 'User',
      subtitle: `@${user.username || 'user'}`,
      metadata: user
    }));
  } catch (error) {
    console.error('[searchUsers] Error searching users:', error);
    return [];
  }
};

export const searchLists = async (searchTerm: string, limitCount: number = 10): Promise<SearchResult[]> => {
  const term = searchTerm.toLowerCase();

  try {
    const listsCollection = collection(db, 'lists');
    const q = query(listsCollection, limit(50));
    const snapshot = await getDocs(q);

    const lists = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(list =>
        list.title?.toLowerCase().includes(term) ||
        list.description?.toLowerCase().includes(term) ||
        list.tags?.some((tag: string) => tag.toLowerCase().includes(term))
      )
      .slice(0, limitCount);

    return lists.map(list => ({
      id: list.id,
      type: 'list' as const,
      title: list.title,
      subtitle: list.description || `${list.races?.length || 0} races`,
      metadata: list
    }));
  } catch (error) {
    console.error('Error searching lists:', error);
    return [];
  }
};

export const searchAll = async (searchTerm: string): Promise<SearchResult[]> => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }

  const [races, users, lists] = await Promise.all([
    searchRaces(searchTerm, 5),
    searchUsers(searchTerm, 5),
    searchLists(searchTerm, 5)
  ]);

  return [...races, ...users, ...lists];
};
