// In-memory cache for race data to speed up navigation
interface CachedRaceData {
  raceInfo: any;
  raceLogs: any[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const raceCache = new Map<string, CachedRaceData>();

export const getCacheKey = (season: number, round: number) => {
  return `${season}-${round}`;
};

export const getCachedRaceData = (season: number, round: number): CachedRaceData | null => {
  const key = getCacheKey(season, round);
  const cached = raceCache.get(key);

  if (!cached) return null;

  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    raceCache.delete(key);
    return null;
  }

  return cached;
};

export const setCachedRaceData = (season: number, round: number, data: Omit<CachedRaceData, 'timestamp'>) => {
  const key = getCacheKey(season, round);
  raceCache.set(key, {
    ...data,
    timestamp: Date.now()
  });
};

export const prefetchRaceData = async (season: number, round: number) => {
  // Check if already cached
  const cached = getCachedRaceData(season, round);
  if (cached) {
    console.log('[RaceCache] Data already cached for', season, round);
    return;
  }

  console.log('[RaceCache] Prefetching data for', season, round);

  try {
    // Dynamic import to avoid circular dependencies
    const { getRaceByYearAndRound } = await import('@/services/f1Calendar');
    const { getRaceLogsByRace } = await import('@/services/raceLogs');

    const firestoreRace = await getRaceByYearAndRound(season, round);

    if (firestoreRace) {
      const raceData = {
        meeting_key: firestoreRace.round,
        year: firestoreRace.year,
        round: firestoreRace.round,
        meeting_name: firestoreRace.raceName,
        circuit_short_name: firestoreRace.circuitName,
        date_start: firestoreRace.dateStart.toISOString(),
        country_code: firestoreRace.countryCode,
        country_name: firestoreRace.countryName,
        location: firestoreRace.location
      };

      // Fetch logs in parallel
      const raceLogs = await getRaceLogsByRace(firestoreRace.raceName, firestoreRace.year).catch(() => []);

      // Cache the data
      setCachedRaceData(season, round, {
        raceInfo: raceData,
        raceLogs: raceLogs || []
      });

      console.log('[RaceCache] Successfully prefetched and cached data');
    }
  } catch (error) {
    console.error('[RaceCache] Error prefetching:', error);
  }
};
