const OPENF1_BASE = 'https://api.openf1.org/v1';
const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Helper to make CORS-friendly requests using AllOrigins proxy
const fetchWithCORS = async (url: string, signal?: AbortSignal) => {
  // Use AllOrigins CORS proxy to avoid CORS issues
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
  console.log(`[F1 API] Fetching via AllOrigins proxy: ${proxiedUrl}`);

  const response = await fetch(proxiedUrl, {
    signal,
    headers: {
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    console.warn(`[F1 API] Proxy returned HTTP ${response.status}: ${response.statusText}`);
    throw new Error(`HTTP ${response.status}`);
  }

  return response;
};

export interface F1Meeting {
  circuit_key?: number;
  circuit_short_name: string;
  country_code: string;
  country_key?: number;
  country_name: string;
  date_start: string;
  gmt_offset?: string;
  location: string;
  meeting_key: number;
  meeting_name: string;
  meeting_official_name?: string;
  year: number;
  round: number; // Sequential round number within the season (1, 2, 3, etc.)
}

// Convert Jolpica/Ergast format to our format
const convertErgastToF1Meeting = (race: any, year: number, round: number): F1Meeting => {
  // Map circuit names to their correct countries
  const circuitToCountry: { [key: string]: string } = {
    'Yas Marina Circuit': 'UAE',
    'Circuit de Monaco': 'Monaco',
    'Marina Bay Street Circuit': 'Singapore',
    'Albert Park Circuit': 'Australia',
    'Autodromo Nazionale di Monza': 'Italy',
    'Silverstone Circuit': 'United Kingdom',
    'Circuit de Spa-Francorchamps': 'Belgium',
    'Suzuka Circuit': 'Japan',
    'Autódromo José Carlos Pace': 'Brazil',
    'Red Bull Ring': 'Austria',
    'Circuit Gilles Villeneuve': 'Canada',
    'Bahrain International Circuit': 'Bahrain',
    'Jeddah Corniche Circuit': 'Saudi Arabia',
    'Miami International Autodrome': 'USA',
    'Circuit of the Americas': 'USA',
    'Las Vegas Street Circuit': 'USA',
    'Autódromo Hermanos Rodríguez': 'Mexico',
    'Circuit de Barcelona-Catalunya': 'Spain',
    'Hungaroring': 'Hungary',
    'Circuit Zandvoort': 'Netherlands',
    'Baku City Circuit': 'Azerbaijan',
    'Circuit Paul Ricard': 'France',
    'Algarve International Circuit': 'Portugal',
    'Istanbul Park': 'Turkey',
  };

  let countryName = race.Circuit.Location.country;
  const circuitName = race.Circuit.circuitName;

  // Override country if we have a manual mapping
  if (circuitToCountry[circuitName]) {
    countryName = circuitToCountry[circuitName];
  }

  const countryCode = getCountryCodeFromName(countryName);
  return {
    meeting_key: round,
    circuit_short_name: race.Circuit.circuitName,
    country_code: countryCode,
    country_name: countryName,
    date_start: race.date,
    location: race.Circuit.Location.locality,
    meeting_name: race.raceName,
    meeting_official_name: race.raceName,
    year: year,
    round: round, // Ergast provides sequential round numbers
  };
};

export const getCurrentSeasonRaces = async (): Promise<F1Meeting[]> => {
  const year = new Date().getFullYear();
  console.log(`[F1 API] Fetching races for year ${year}...`);

  // Try OpenF1 first with short timeout (2 seconds)
  try {
    const url = `${OPENF1_BASE}/meetings?year=${year}`;
    console.log(`[F1 API] Trying OpenF1: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout - fail fast

    const response = await fetchWithCORS(url, controller.signal);
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      console.log(`[F1 API] OpenF1 returned ${data.length} meetings`);

      if (Array.isArray(data) && data.length > 0) {
        const races = data.filter(m => !m.meeting_name.toLowerCase().includes('testing'));
        // Add sequential round numbers to OpenF1 data
        const racesWithRounds = races.map((race, index) => ({
          ...race,
          round: index + 1
        }));
        console.log(`[F1 API] Success! Returning ${racesWithRounds.length} races from OpenF1`);
        return racesWithRounds;
      }
    }
  } catch (error) {
    console.warn('[F1 API] OpenF1 failed or timed out after 2s, falling back to Jolpica:', error);
  }

  // Fallback to Jolpica/Ergast with CORS proxy
  try {
    const url = `${JOLPICA_BASE}/${year}.json`;
    console.log(`[F1 API] Trying Jolpica: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout for Jolpica

    const response = await fetchWithCORS(url, controller.signal);
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const races = data.MRData.RaceTable.Races;
      console.log(`[F1 API] Jolpica returned ${races.length} races`);

      if (Array.isArray(races) && races.length > 0) {
        const converted = races.map((race: any, index: number) =>
          convertErgastToF1Meeting(race, year, index + 1)
        );
        console.log(`[F1 API] Success! Returning ${converted.length} races from Jolpica`);
        return converted;
      }
    }
  } catch (error) {
    console.warn('[F1 API] Jolpica failed:', error);
  }

  console.error('[F1 API] All APIs failed');
  return [];
};

export const getRacesBySeason = async (year: number): Promise<F1Meeting[]> => {
  console.log(`[F1 API] getRacesBySeason for year ${year}`);

  // Try OpenF1 first with short timeout (2 seconds)
  try {
    const url = `${OPENF1_BASE}/meetings?year=${year}`;
    console.log(`[F1 API] Trying OpenF1: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout - fail fast

    const response = await fetchWithCORS(url, controller.signal);
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      console.log(`[F1 API] OpenF1 returned ${data.length} meetings`);

      if (Array.isArray(data) && data.length > 0) {
        const races = data.filter(m => !m.meeting_name.toLowerCase().includes('testing'));
        // Add sequential round numbers to OpenF1 data
        const racesWithRounds = races.map((race, index) => ({
          ...race,
          round: index + 1
        }));
        console.log(`[F1 API] Success! Returning ${racesWithRounds.length} races from OpenF1`);
        return racesWithRounds;
      }
    }
  } catch (error) {
    console.warn('[F1 API] OpenF1 failed or timed out after 2s, falling back to Jolpica:', error);
  }

  // Fallback to Jolpica/Ergast with CORS proxy
  try {
    const url = `${JOLPICA_BASE}/${year}.json`;
    console.log(`[F1 API] Trying Jolpica: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout for Jolpica

    const response = await fetchWithCORS(url, controller.signal);
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const races = data.MRData.RaceTable.Races;
      console.log(`[F1 API] Jolpica returned ${races.length} races`);

      if (Array.isArray(races) && races.length > 0) {
        const converted = races.map((race: any, index: number) =>
          convertErgastToF1Meeting(race, year, index + 1)
        );
        console.log(`[F1 API] Success! Returning ${converted.length} races from Jolpica`);
        return converted;
      }
    }
  } catch (error) {
    console.warn('[F1 API] Jolpica failed:', error);
  }

  console.error('[F1 API] All APIs failed for year', year);
  return [];
};

export const getRaceByYearAndRound = async (year: number, round: number): Promise<F1Meeting | null> => {
  console.log(`[F1 API] getRaceByYearAndRound: year=${year}, round=${round}`);
  const races = await getRacesBySeason(year);
  console.log(`[F1 API] Found ${races.length} races for year ${year}`);
  // Use the round field (1, 2, 3...) instead of meeting_key for consistent lookup
  const race = races.find(r => r.round === round);
  console.log(`[F1 API] Race found?`, race ? 'YES' : 'NO', race);
  return race || null;
};

export const getCountryCodeFromName = (country: string): string => {
  const countryMap: { [key: string]: string } = {
    'Australia': 'AUS',
    'Austria': 'AUT',
    'Azerbaijan': 'AZE',
    'Bahrain': 'BRN',
    'Belgium': 'BEL',
    'Brazil': 'BRA',
    'Canada': 'CAN',
    'China': 'CHN',
    'France': 'FRA',
    'Germany': 'DEU',
    'Hungary': 'HUN',
    'Italy': 'ITA',
    'Japan': 'JPN',
    'Mexico': 'MEX',
    'Monaco': 'MCO',
    'Netherlands': 'NLD',
    'Portugal': 'PRT',
    'Qatar': 'QAT',
    'Russia': 'RUS',
    'Saudi Arabia': 'KSA',
    'Singapore': 'SGP',
    'Spain': 'ESP',
    'Turkey': 'TUR',
    'UAE': 'ARE',
    'United Arab Emirates': 'ARE',
    'UK': 'GBR',
    'United Kingdom': 'GBR',
    'USA': 'USA',
    'United States': 'USA',
  };
  return countryMap[country] || 'XXX';
};

const countryCodeMap: { [key: string]: string } = {
  'AUS': 'au',
  'AUT': 'at',
  'AZE': 'az',
  'BEL': 'be',
  'BHR': 'bh',
  'BRN': 'bh',
  'BRA': 'br',
  'CAN': 'ca',
  'CHN': 'cn',
  'ESP': 'es',
  'FRA': 'fr',
  'GBR': 'gb',
  'DEU': 'de',
  'HUN': 'hu',
  'ITA': 'it',
  'JPN': 'jp',
  'KSA': 'sa',
  'MEX': 'mx',
  'MON': 'mc',
  'MCO': 'mc',
  'NED': 'nl',
  'NLD': 'nl',
  'PRT': 'pt',
  'QAT': 'qa',
  'RUS': 'ru',
  'SAU': 'sa',
  'SGP': 'sg',
  'TUR': 'tr',
  'ARE': 'ae',
  'USA': 'us',
};

export const getCountryFlag = (countryCode: string): string => {
  const alpha2Code = countryCodeMap[countryCode.toUpperCase()] || countryCode.toLowerCase();
  return `https://flagcdn.com/w320/${alpha2Code}.png`;
};

export const getPosterUrl = (circuitName: string): string | null => {
  return null;
};

// Fetch race winner from Ergast API
export const getRaceWinner = async (year: number, round: number): Promise<string | null> => {
  try {
    console.log(`[F1 API] Fetching race winner for ${year} round ${round}`);
    const url = `${JOLPICA_BASE}/${year}/${round}/results/1.json`;
    const response = await fetch(url);

    if (response.ok) {
      const data = await response.json();
      const result = data.MRData?.RaceTable?.Races?.[0]?.Results?.[0];

      if (result) {
        const winner = `${result.Driver.givenName} ${result.Driver.familyName}`;
        console.log(`[F1 API] Race winner: ${winner}`);
        return winner;
      }
    }

    console.warn(`[F1 API] No winner data found for ${year} round ${round}`);
    return null;
  } catch (error) {
    console.error('[F1 API] Error fetching race winner:', error);
    return null;
  }
};
