import {
  collection,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  addDoc,
  Timestamp,
  doc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { races2010to2020 } from '@/data/f1-2010-2020';

export interface F1Race {
  id?: string;
  year: number;
  round: number;
  raceName: string;
  circuitName: string;
  location: string;
  countryCode: string;
  countryName: string;
  dateStart: Date;
  winner?: string;
  createdAt?: Date;
}

const racesCollection = collection(db, 'f1_races');

// Get all races for a specific season
export const getRacesBySeason = async (year: number): Promise<F1Race[]> => {
  const q = query(
    racesCollection,
    where('year', '==', year),
    orderBy('round', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dateStart: data.dateStart?.toDate ? data.dateStart.toDate() : new Date(data.dateStart),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    } as F1Race;
  });
};

// Get current season races
export const getCurrentSeasonRaces = async (): Promise<F1Race[]> => {
  const currentYear = new Date().getFullYear();
  return getRacesBySeason(currentYear);
};

// Get a specific race by year and round
export const getRaceByYearAndRound = async (year: number, round: number): Promise<F1Race | null> => {
  const docId = `${year}-${round}`;

  try {
    const docRef = doc(racesCollection, docId);
    const docSnapshot = await getDoc(docRef);

    if (!docSnapshot.exists()) {
      return null;
    }

    const data = docSnapshot.data();

    return {
      id: docSnapshot.id,
      ...data,
      dateStart: data.dateStart?.toDate ? data.dateStart.toDate() : new Date(data.dateStart),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    } as F1Race;
  } catch (error) {
    console.error(`[F1Calendar] Error fetching race ${docId}:`, error);
    return null;
  }
};

// Get a specific race by name and year
export const getRaceByNameAndYear = async (raceName: string, year: number): Promise<F1Race | null> => {
  console.log(`[F1Calendar] getRaceByNameAndYear: raceName=${raceName}, year=${year}`);

  try {
    const q = query(
      racesCollection,
      where('year', '==', year),
      where('raceName', '==', raceName)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`[F1Calendar] No race found for ${raceName} in ${year}`);
      return null;
    }

    const data = snapshot.docs[0].data();
    console.log(`[F1Calendar] Found race:`, data);

    return {
      id: snapshot.docs[0].id,
      ...data,
      dateStart: data.dateStart?.toDate ? data.dateStart.toDate() : new Date(data.dateStart),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
    } as F1Race;
  } catch (error) {
    console.error(`[F1Calendar] Error fetching race by name:`, error);
    return null;
  }
};

// Seed 2025 F1 calendar data
export const seed2025Calendar = async () => {
  console.log('[F1Calendar] Seeding 2025 F1 calendar data...');

  const races2025 = [
    {
      year: 2025,
      round: 1,
      raceName: 'Australian Grand Prix',
      circuitName: 'Albert Park Circuit',
      location: 'Melbourne',
      countryCode: 'AUS',
      countryName: 'Australia',
      dateStart: new Date('2025-03-16')
    },
    {
      year: 2025,
      round: 2,
      raceName: 'Chinese Grand Prix',
      circuitName: 'Shanghai International Circuit',
      location: 'Shanghai',
      countryCode: 'CHN',
      countryName: 'China',
      dateStart: new Date('2025-03-23')
    },
    {
      year: 2025,
      round: 3,
      raceName: 'Japanese Grand Prix',
      circuitName: 'Suzuka Circuit',
      location: 'Suzuka',
      countryCode: 'JPN',
      countryName: 'Japan',
      dateStart: new Date('2025-04-06')
    },
    {
      year: 2025,
      round: 4,
      raceName: 'Bahrain Grand Prix',
      circuitName: 'Bahrain International Circuit',
      location: 'Sakhir',
      countryCode: 'BRN',
      countryName: 'Bahrain',
      dateStart: new Date('2025-04-13')
    },
    {
      year: 2025,
      round: 5,
      raceName: 'Saudi Arabian Grand Prix',
      circuitName: 'Jeddah Corniche Circuit',
      location: 'Jeddah',
      countryCode: 'KSA',
      countryName: 'Saudi Arabia',
      dateStart: new Date('2025-04-20')
    },
    {
      year: 2025,
      round: 6,
      raceName: 'Miami Grand Prix',
      circuitName: 'Miami International Autodrome',
      location: 'Miami',
      countryCode: 'USA',
      countryName: 'USA',
      dateStart: new Date('2025-05-04')
    },
    {
      year: 2025,
      round: 7,
      raceName: 'Emilia Romagna Grand Prix',
      circuitName: 'Autodromo Enzo e Dino Ferrari',
      location: 'Imola',
      countryCode: 'ITA',
      countryName: 'Italy',
      dateStart: new Date('2025-05-18')
    },
    {
      year: 2025,
      round: 8,
      raceName: 'Monaco Grand Prix',
      circuitName: 'Circuit de Monaco',
      location: 'Monaco',
      countryCode: 'MCO',
      countryName: 'Monaco',
      dateStart: new Date('2025-05-25')
    },
    {
      year: 2025,
      round: 9,
      raceName: 'Spanish Grand Prix',
      circuitName: 'Circuit de Barcelona-Catalunya',
      location: 'Barcelona',
      countryCode: 'ESP',
      countryName: 'Spain',
      dateStart: new Date('2025-06-01')
    },
    {
      year: 2025,
      round: 10,
      raceName: 'Canadian Grand Prix',
      circuitName: 'Circuit Gilles Villeneuve',
      location: 'Montreal',
      countryCode: 'CAN',
      countryName: 'Canada',
      dateStart: new Date('2025-06-15')
    },
    {
      year: 2025,
      round: 11,
      raceName: 'Austrian Grand Prix',
      circuitName: 'Red Bull Ring',
      location: 'Spielberg',
      countryCode: 'AUT',
      countryName: 'Austria',
      dateStart: new Date('2025-06-29')
    },
    {
      year: 2025,
      round: 12,
      raceName: 'British Grand Prix',
      circuitName: 'Silverstone Circuit',
      location: 'Silverstone',
      countryCode: 'GBR',
      countryName: 'United Kingdom',
      dateStart: new Date('2025-07-06')
    },
    {
      year: 2025,
      round: 13,
      raceName: 'Belgian Grand Prix',
      circuitName: 'Circuit de Spa-Francorchamps',
      location: 'Spa',
      countryCode: 'BEL',
      countryName: 'Belgium',
      dateStart: new Date('2025-07-27')
    },
    {
      year: 2025,
      round: 14,
      raceName: 'Hungarian Grand Prix',
      circuitName: 'Hungaroring',
      location: 'Budapest',
      countryCode: 'HUN',
      countryName: 'Hungary',
      dateStart: new Date('2025-08-03')
    },
    {
      year: 2025,
      round: 15,
      raceName: 'Dutch Grand Prix',
      circuitName: 'Circuit Zandvoort',
      location: 'Zandvoort',
      countryCode: 'NLD',
      countryName: 'Netherlands',
      dateStart: new Date('2025-08-31')
    },
    {
      year: 2025,
      round: 16,
      raceName: 'Italian Grand Prix',
      circuitName: 'Autodromo Nazionale di Monza',
      location: 'Monza',
      countryCode: 'ITA',
      countryName: 'Italy',
      dateStart: new Date('2025-09-07')
    },
    {
      year: 2025,
      round: 17,
      raceName: 'Azerbaijan Grand Prix',
      circuitName: 'Baku City Circuit',
      location: 'Baku',
      countryCode: 'AZE',
      countryName: 'Azerbaijan',
      dateStart: new Date('2025-09-21')
    },
    {
      year: 2025,
      round: 18,
      raceName: 'Singapore Grand Prix',
      circuitName: 'Marina Bay Street Circuit',
      location: 'Singapore',
      countryCode: 'SGP',
      countryName: 'Singapore',
      dateStart: new Date('2025-10-05')
    },
    {
      year: 2025,
      round: 19,
      raceName: 'United States Grand Prix',
      circuitName: 'Circuit of the Americas',
      location: 'Austin',
      countryCode: 'USA',
      countryName: 'USA',
      dateStart: new Date('2025-10-19')
    },
    {
      year: 2025,
      round: 20,
      raceName: 'Mexico City Grand Prix',
      circuitName: 'Autódromo Hermanos Rodríguez',
      location: 'Mexico City',
      countryCode: 'MEX',
      countryName: 'Mexico',
      dateStart: new Date('2025-10-26')
    },
    {
      year: 2025,
      round: 21,
      raceName: 'São Paulo Grand Prix',
      circuitName: 'Autódromo José Carlos Pace',
      location: 'São Paulo',
      countryCode: 'BRA',
      countryName: 'Brazil',
      dateStart: new Date('2025-11-09')
    },
    {
      year: 2025,
      round: 22,
      raceName: 'Las Vegas Grand Prix',
      circuitName: 'Las Vegas Street Circuit',
      location: 'Las Vegas',
      countryCode: 'USA',
      countryName: 'USA',
      dateStart: new Date('2025-11-22')
    },
    {
      year: 2025,
      round: 23,
      raceName: 'Qatar Grand Prix',
      circuitName: 'Lusail International Circuit',
      location: 'Lusail',
      countryCode: 'QAT',
      countryName: 'Qatar',
      dateStart: new Date('2025-11-30')
    },
    {
      year: 2025,
      round: 24,
      raceName: 'Abu Dhabi Grand Prix',
      circuitName: 'Yas Marina Circuit',
      location: 'Abu Dhabi',
      countryCode: 'ARE',
      countryName: 'UAE',
      dateStart: new Date('2025-12-07')
    }
  ];

  const races2024 = [
    { year: 2024, round: 1, raceName: 'Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', location: 'Sakhir', countryCode: 'BHR', countryName: 'Bahrain', dateStart: new Date('2024-03-02') },
    { year: 2024, round: 2, raceName: 'Saudi Arabian Grand Prix', circuitName: 'Jeddah Corniche Circuit', location: 'Jeddah', countryCode: 'SAU', countryName: 'Saudi Arabia', dateStart: new Date('2024-03-09') },
    { year: 2024, round: 3, raceName: 'Australian Grand Prix', circuitName: 'Albert Park Circuit', location: 'Melbourne', countryCode: 'AUS', countryName: 'Australia', dateStart: new Date('2024-03-24') },
    { year: 2024, round: 4, raceName: 'Japanese Grand Prix', circuitName: 'Suzuka Circuit', location: 'Suzuka', countryCode: 'JPN', countryName: 'Japan', dateStart: new Date('2024-04-07') },
    { year: 2024, round: 5, raceName: 'Chinese Grand Prix', circuitName: 'Shanghai International Circuit', location: 'Shanghai', countryCode: 'CHN', countryName: 'China', dateStart: new Date('2024-04-21') },
    { year: 2024, round: 6, raceName: 'Miami Grand Prix', circuitName: 'Miami International Autodrome', location: 'Miami', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2024-05-05') },
    { year: 2024, round: 7, raceName: 'Emilia Romagna Grand Prix', circuitName: 'Autodromo Enzo e Dino Ferrari', location: 'Imola', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2024-05-19') },
    { year: 2024, round: 8, raceName: 'Monaco Grand Prix', circuitName: 'Circuit de Monaco', location: 'Monaco', countryCode: 'MCO', countryName: 'Monaco', dateStart: new Date('2024-05-26') },
    { year: 2024, round: 9, raceName: 'Canadian Grand Prix', circuitName: 'Circuit Gilles Villeneuve', location: 'Montreal', countryCode: 'CAN', countryName: 'Canada', dateStart: new Date('2024-06-09') },
    { year: 2024, round: 10, raceName: 'Spanish Grand Prix', circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', countryCode: 'ESP', countryName: 'Spain', dateStart: new Date('2024-06-23') },
    { year: 2024, round: 11, raceName: 'Austrian Grand Prix', circuitName: 'Red Bull Ring', location: 'Spielberg', countryCode: 'AUT', countryName: 'Austria', dateStart: new Date('2024-06-30') },
    { year: 2024, round: 12, raceName: 'British Grand Prix', circuitName: 'Silverstone Circuit', location: 'Silverstone', countryCode: 'GBR', countryName: 'United Kingdom', dateStart: new Date('2024-07-07') },
    { year: 2024, round: 13, raceName: 'Hungarian Grand Prix', circuitName: 'Hungaroring', location: 'Budapest', countryCode: 'HUN', countryName: 'Hungary', dateStart: new Date('2024-07-21') },
    { year: 2024, round: 14, raceName: 'Belgian Grand Prix', circuitName: 'Circuit de Spa-Francorchamps', location: 'Spa', countryCode: 'BEL', countryName: 'Belgium', dateStart: new Date('2024-07-28') },
    { year: 2024, round: 15, raceName: 'Dutch Grand Prix', circuitName: 'Circuit Zandvoort', location: 'Zandvoort', countryCode: 'NLD', countryName: 'Netherlands', dateStart: new Date('2024-08-25') },
    { year: 2024, round: 16, raceName: 'Italian Grand Prix', circuitName: 'Autodromo Nazionale di Monza', location: 'Monza', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2024-09-01') },
    { year: 2024, round: 17, raceName: 'Azerbaijan Grand Prix', circuitName: 'Baku City Circuit', location: 'Baku', countryCode: 'AZE', countryName: 'Azerbaijan', dateStart: new Date('2024-09-15') },
    { year: 2024, round: 18, raceName: 'Singapore Grand Prix', circuitName: 'Marina Bay Street Circuit', location: 'Singapore', countryCode: 'SGP', countryName: 'Singapore', dateStart: new Date('2024-09-22') },
    { year: 2024, round: 19, raceName: 'United States Grand Prix', circuitName: 'Circuit of the Americas', location: 'Austin', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2024-10-20') },
    { year: 2024, round: 20, raceName: 'Mexico City Grand Prix', circuitName: 'Autódromo Hermanos Rodríguez', location: 'Mexico City', countryCode: 'MEX', countryName: 'Mexico', dateStart: new Date('2024-10-27') },
    { year: 2024, round: 21, raceName: 'São Paulo Grand Prix', circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo', countryCode: 'BRA', countryName: 'Brazil', dateStart: new Date('2024-11-03') },
    { year: 2024, round: 22, raceName: 'Las Vegas Grand Prix', circuitName: 'Las Vegas Street Circuit', location: 'Las Vegas', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2024-11-23') },
    { year: 2024, round: 23, raceName: 'Qatar Grand Prix', circuitName: 'Lusail International Circuit', location: 'Lusail', countryCode: 'QAT', countryName: 'Qatar', dateStart: new Date('2024-12-01') },
    { year: 2024, round: 24, raceName: 'Abu Dhabi Grand Prix', circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi', countryCode: 'ARE', countryName: 'UAE', dateStart: new Date('2024-12-08') }
  ];

  const races2023 = [
    { year: 2023, round: 1, raceName: 'Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', location: 'Sakhir', countryCode: 'BHR', countryName: 'Bahrain', dateStart: new Date('2023-03-05') },
    { year: 2023, round: 2, raceName: 'Saudi Arabian Grand Prix', circuitName: 'Jeddah Corniche Circuit', location: 'Jeddah', countryCode: 'SAU', countryName: 'Saudi Arabia', dateStart: new Date('2023-03-19') },
    { year: 2023, round: 3, raceName: 'Australian Grand Prix', circuitName: 'Albert Park Circuit', location: 'Melbourne', countryCode: 'AUS', countryName: 'Australia', dateStart: new Date('2023-04-02') },
    { year: 2023, round: 4, raceName: 'Azerbaijan Grand Prix', circuitName: 'Baku City Circuit', location: 'Baku', countryCode: 'AZE', countryName: 'Azerbaijan', dateStart: new Date('2023-04-30') },
    { year: 2023, round: 5, raceName: 'Miami Grand Prix', circuitName: 'Miami International Autodrome', location: 'Miami', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2023-05-07') },
    { year: 2023, round: 6, raceName: 'Monaco Grand Prix', circuitName: 'Circuit de Monaco', location: 'Monaco', countryCode: 'MCO', countryName: 'Monaco', dateStart: new Date('2023-05-28') },
    { year: 2023, round: 7, raceName: 'Spanish Grand Prix', circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', countryCode: 'ESP', countryName: 'Spain', dateStart: new Date('2023-06-04') },
    { year: 2023, round: 8, raceName: 'Canadian Grand Prix', circuitName: 'Circuit Gilles Villeneuve', location: 'Montreal', countryCode: 'CAN', countryName: 'Canada', dateStart: new Date('2023-06-18') },
    { year: 2023, round: 9, raceName: 'Austrian Grand Prix', circuitName: 'Red Bull Ring', location: 'Spielberg', countryCode: 'AUT', countryName: 'Austria', dateStart: new Date('2023-07-02') },
    { year: 2023, round: 10, raceName: 'British Grand Prix', circuitName: 'Silverstone Circuit', location: 'Silverstone', countryCode: 'GBR', countryName: 'United Kingdom', dateStart: new Date('2023-07-09') },
    { year: 2023, round: 11, raceName: 'Hungarian Grand Prix', circuitName: 'Hungaroring', location: 'Budapest', countryCode: 'HUN', countryName: 'Hungary', dateStart: new Date('2023-07-23') },
    { year: 2023, round: 12, raceName: 'Belgian Grand Prix', circuitName: 'Circuit de Spa-Francorchamps', location: 'Spa', countryCode: 'BEL', countryName: 'Belgium', dateStart: new Date('2023-07-30') },
    { year: 2023, round: 13, raceName: 'Dutch Grand Prix', circuitName: 'Circuit Zandvoort', location: 'Zandvoort', countryCode: 'NLD', countryName: 'Netherlands', dateStart: new Date('2023-08-27') },
    { year: 2023, round: 14, raceName: 'Italian Grand Prix', circuitName: 'Autodromo Nazionale di Monza', location: 'Monza', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2023-09-03') },
    { year: 2023, round: 15, raceName: 'Singapore Grand Prix', circuitName: 'Marina Bay Street Circuit', location: 'Singapore', countryCode: 'SGP', countryName: 'Singapore', dateStart: new Date('2023-09-17') },
    { year: 2023, round: 16, raceName: 'Japanese Grand Prix', circuitName: 'Suzuka Circuit', location: 'Suzuka', countryCode: 'JPN', countryName: 'Japan', dateStart: new Date('2023-09-24') },
    { year: 2023, round: 17, raceName: 'Qatar Grand Prix', circuitName: 'Lusail International Circuit', location: 'Lusail', countryCode: 'QAT', countryName: 'Qatar', dateStart: new Date('2023-10-08') },
    { year: 2023, round: 18, raceName: 'United States Grand Prix', circuitName: 'Circuit of the Americas', location: 'Austin', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2023-10-22') },
    { year: 2023, round: 19, raceName: 'Mexico City Grand Prix', circuitName: 'Autódromo Hermanos Rodríguez', location: 'Mexico City', countryCode: 'MEX', countryName: 'Mexico', dateStart: new Date('2023-10-29') },
    { year: 2023, round: 20, raceName: 'São Paulo Grand Prix', circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo', countryCode: 'BRA', countryName: 'Brazil', dateStart: new Date('2023-11-05') },
    { year: 2023, round: 21, raceName: 'Las Vegas Grand Prix', circuitName: 'Las Vegas Street Circuit', location: 'Las Vegas', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2023-11-18') },
    { year: 2023, round: 22, raceName: 'Abu Dhabi Grand Prix', circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi', countryCode: 'ARE', countryName: 'UAE', dateStart: new Date('2023-11-26') }
  ];

  const races2022 = [
    { year: 2022, round: 1, raceName: 'Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', location: 'Sakhir', countryCode: 'BHR', countryName: 'Bahrain', dateStart: new Date('2022-03-20') },
    { year: 2022, round: 2, raceName: 'Saudi Arabian Grand Prix', circuitName: 'Jeddah Corniche Circuit', location: 'Jeddah', countryCode: 'SAU', countryName: 'Saudi Arabia', dateStart: new Date('2022-03-27') },
    { year: 2022, round: 3, raceName: 'Australian Grand Prix', circuitName: 'Albert Park Circuit', location: 'Melbourne', countryCode: 'AUS', countryName: 'Australia', dateStart: new Date('2022-04-10') },
    { year: 2022, round: 4, raceName: 'Emilia Romagna Grand Prix', circuitName: 'Autodromo Enzo e Dino Ferrari', location: 'Imola', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2022-04-24') },
    { year: 2022, round: 5, raceName: 'Miami Grand Prix', circuitName: 'Miami International Autodrome', location: 'Miami', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2022-05-08') },
    { year: 2022, round: 6, raceName: 'Spanish Grand Prix', circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', countryCode: 'ESP', countryName: 'Spain', dateStart: new Date('2022-05-22') },
    { year: 2022, round: 7, raceName: 'Monaco Grand Prix', circuitName: 'Circuit de Monaco', location: 'Monaco', countryCode: 'MCO', countryName: 'Monaco', dateStart: new Date('2022-05-29') },
    { year: 2022, round: 8, raceName: 'Azerbaijan Grand Prix', circuitName: 'Baku City Circuit', location: 'Baku', countryCode: 'AZE', countryName: 'Azerbaijan', dateStart: new Date('2022-06-12') },
    { year: 2022, round: 9, raceName: 'Canadian Grand Prix', circuitName: 'Circuit Gilles Villeneuve', location: 'Montreal', countryCode: 'CAN', countryName: 'Canada', dateStart: new Date('2022-06-19') },
    { year: 2022, round: 10, raceName: 'British Grand Prix', circuitName: 'Silverstone Circuit', location: 'Silverstone', countryCode: 'GBR', countryName: 'United Kingdom', dateStart: new Date('2022-07-03') },
    { year: 2022, round: 11, raceName: 'Austrian Grand Prix', circuitName: 'Red Bull Ring', location: 'Spielberg', countryCode: 'AUT', countryName: 'Austria', dateStart: new Date('2022-07-10') },
    { year: 2022, round: 12, raceName: 'French Grand Prix', circuitName: 'Circuit Paul Ricard', location: 'Le Castellet', countryCode: 'FRA', countryName: 'France', dateStart: new Date('2022-07-24') },
    { year: 2022, round: 13, raceName: 'Hungarian Grand Prix', circuitName: 'Hungaroring', location: 'Budapest', countryCode: 'HUN', countryName: 'Hungary', dateStart: new Date('2022-07-31') },
    { year: 2022, round: 14, raceName: 'Belgian Grand Prix', circuitName: 'Circuit de Spa-Francorchamps', location: 'Spa', countryCode: 'BEL', countryName: 'Belgium', dateStart: new Date('2022-08-28') },
    { year: 2022, round: 15, raceName: 'Dutch Grand Prix', circuitName: 'Circuit Zandvoort', location: 'Zandvoort', countryCode: 'NLD', countryName: 'Netherlands', dateStart: new Date('2022-09-04') },
    { year: 2022, round: 16, raceName: 'Italian Grand Prix', circuitName: 'Autodromo Nazionale di Monza', location: 'Monza', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2022-09-11') },
    { year: 2022, round: 17, raceName: 'Singapore Grand Prix', circuitName: 'Marina Bay Street Circuit', location: 'Singapore', countryCode: 'SGP', countryName: 'Singapore', dateStart: new Date('2022-10-02') },
    { year: 2022, round: 18, raceName: 'Japanese Grand Prix', circuitName: 'Suzuka Circuit', location: 'Suzuka', countryCode: 'JPN', countryName: 'Japan', dateStart: new Date('2022-10-09') },
    { year: 2022, round: 19, raceName: 'United States Grand Prix', circuitName: 'Circuit of the Americas', location: 'Austin', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2022-10-23') },
    { year: 2022, round: 20, raceName: 'Mexico City Grand Prix', circuitName: 'Autódromo Hermanos Rodríguez', location: 'Mexico City', countryCode: 'MEX', countryName: 'Mexico', dateStart: new Date('2022-10-30') },
    { year: 2022, round: 21, raceName: 'São Paulo Grand Prix', circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo', countryCode: 'BRA', countryName: 'Brazil', dateStart: new Date('2022-11-13') },
    { year: 2022, round: 22, raceName: 'Abu Dhabi Grand Prix', circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi', countryCode: 'ARE', countryName: 'UAE', dateStart: new Date('2022-11-20') }
  ];

  const races2021 = [
    { year: 2021, round: 1, raceName: 'Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', location: 'Sakhir', countryCode: 'BHR', countryName: 'Bahrain', dateStart: new Date('2021-03-28') },
    { year: 2021, round: 2, raceName: 'Emilia Romagna Grand Prix', circuitName: 'Autodromo Enzo e Dino Ferrari', location: 'Imola', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2021-04-18') },
    { year: 2021, round: 3, raceName: 'Portuguese Grand Prix', circuitName: 'Autódromo Internacional do Algarve', location: 'Portimão', countryCode: 'PRT', countryName: 'Portugal', dateStart: new Date('2021-05-02') },
    { year: 2021, round: 4, raceName: 'Spanish Grand Prix', circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', countryCode: 'ESP', countryName: 'Spain', dateStart: new Date('2021-05-09') },
    { year: 2021, round: 5, raceName: 'Monaco Grand Prix', circuitName: 'Circuit de Monaco', location: 'Monaco', countryCode: 'MCO', countryName: 'Monaco', dateStart: new Date('2021-05-23') },
    { year: 2021, round: 6, raceName: 'Azerbaijan Grand Prix', circuitName: 'Baku City Circuit', location: 'Baku', countryCode: 'AZE', countryName: 'Azerbaijan', dateStart: new Date('2021-06-06') },
    { year: 2021, round: 7, raceName: 'French Grand Prix', circuitName: 'Circuit Paul Ricard', location: 'Le Castellet', countryCode: 'FRA', countryName: 'France', dateStart: new Date('2021-06-20') },
    { year: 2021, round: 8, raceName: 'Styrian Grand Prix', circuitName: 'Red Bull Ring', location: 'Spielberg', countryCode: 'AUT', countryName: 'Austria', dateStart: new Date('2021-06-27') },
    { year: 2021, round: 9, raceName: 'Austrian Grand Prix', circuitName: 'Red Bull Ring', location: 'Spielberg', countryCode: 'AUT', countryName: 'Austria', dateStart: new Date('2021-07-04') },
    { year: 2021, round: 10, raceName: 'British Grand Prix', circuitName: 'Silverstone Circuit', location: 'Silverstone', countryCode: 'GBR', countryName: 'United Kingdom', dateStart: new Date('2021-07-18') },
    { year: 2021, round: 11, raceName: 'Hungarian Grand Prix', circuitName: 'Hungaroring', location: 'Budapest', countryCode: 'HUN', countryName: 'Hungary', dateStart: new Date('2021-08-01') },
    { year: 2021, round: 12, raceName: 'Belgian Grand Prix', circuitName: 'Circuit de Spa-Francorchamps', location: 'Spa', countryCode: 'BEL', countryName: 'Belgium', dateStart: new Date('2021-08-29') },
    { year: 2021, round: 13, raceName: 'Dutch Grand Prix', circuitName: 'Circuit Zandvoort', location: 'Zandvoort', countryCode: 'NLD', countryName: 'Netherlands', dateStart: new Date('2021-09-05') },
    { year: 2021, round: 14, raceName: 'Italian Grand Prix', circuitName: 'Autodromo Nazionale di Monza', location: 'Monza', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2021-09-12') },
    { year: 2021, round: 15, raceName: 'Russian Grand Prix', circuitName: 'Sochi Autodrom', location: 'Sochi', countryCode: 'RUS', countryName: 'Russia', dateStart: new Date('2021-09-26') },
    { year: 2021, round: 16, raceName: 'Turkish Grand Prix', circuitName: 'Intercity Istanbul Park', location: 'Istanbul', countryCode: 'TUR', countryName: 'Turkey', dateStart: new Date('2021-10-10') },
    { year: 2021, round: 17, raceName: 'United States Grand Prix', circuitName: 'Circuit of the Americas', location: 'Austin', countryCode: 'USA', countryName: 'USA', dateStart: new Date('2021-10-24') },
    { year: 2021, round: 18, raceName: 'Mexico City Grand Prix', circuitName: 'Autódromo Hermanos Rodríguez', location: 'Mexico City', countryCode: 'MEX', countryName: 'Mexico', dateStart: new Date('2021-11-07') },
    { year: 2021, round: 19, raceName: 'São Paulo Grand Prix', circuitName: 'Autódromo José Carlos Pace', location: 'São Paulo', countryCode: 'BRA', countryName: 'Brazil', dateStart: new Date('2021-11-14') },
    { year: 2021, round: 20, raceName: 'Qatar Grand Prix', circuitName: 'Losail International Circuit', location: 'Al Daayen', countryCode: 'QAT', countryName: 'Qatar', dateStart: new Date('2021-11-21') },
    { year: 2021, round: 21, raceName: 'Saudi Arabian Grand Prix', circuitName: 'Jeddah Corniche Circuit', location: 'Jeddah', countryCode: 'SAU', countryName: 'Saudi Arabia', dateStart: new Date('2021-12-05') },
    { year: 2021, round: 22, raceName: 'Abu Dhabi Grand Prix', circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi', countryCode: 'ARE', countryName: 'UAE', dateStart: new Date('2021-12-12') }
  ];

  const races2020 = [
    { year: 2020, round: 1, raceName: 'Austrian Grand Prix', circuitName: 'Red Bull Ring', location: 'Spielberg', countryCode: 'AUT', countryName: 'Austria', dateStart: new Date('2020-07-05') },
    { year: 2020, round: 2, raceName: 'Styrian Grand Prix', circuitName: 'Red Bull Ring', location: 'Spielberg', countryCode: 'AUT', countryName: 'Austria', dateStart: new Date('2020-07-12') },
    { year: 2020, round: 3, raceName: 'Hungarian Grand Prix', circuitName: 'Hungaroring', location: 'Budapest', countryCode: 'HUN', countryName: 'Hungary', dateStart: new Date('2020-07-19') },
    { year: 2020, round: 4, raceName: 'British Grand Prix', circuitName: 'Silverstone Circuit', location: 'Silverstone', countryCode: 'GBR', countryName: 'United Kingdom', dateStart: new Date('2020-08-02') },
    { year: 2020, round: 5, raceName: '70th Anniversary Grand Prix', circuitName: 'Silverstone Circuit', location: 'Silverstone', countryCode: 'GBR', countryName: 'United Kingdom', dateStart: new Date('2020-08-09') },
    { year: 2020, round: 6, raceName: 'Spanish Grand Prix', circuitName: 'Circuit de Barcelona-Catalunya', location: 'Barcelona', countryCode: 'ESP', countryName: 'Spain', dateStart: new Date('2020-08-16') },
    { year: 2020, round: 7, raceName: 'Belgian Grand Prix', circuitName: 'Circuit de Spa-Francorchamps', location: 'Spa', countryCode: 'BEL', countryName: 'Belgium', dateStart: new Date('2020-08-30') },
    { year: 2020, round: 8, raceName: 'Italian Grand Prix', circuitName: 'Autodromo Nazionale di Monza', location: 'Monza', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2020-09-06') },
    { year: 2020, round: 9, raceName: 'Tuscan Grand Prix', circuitName: 'Autodromo Internazionale del Mugello', location: 'Mugello', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2020-09-13') },
    { year: 2020, round: 10, raceName: 'Russian Grand Prix', circuitName: 'Sochi Autodrom', location: 'Sochi', countryCode: 'RUS', countryName: 'Russia', dateStart: new Date('2020-09-27') },
    { year: 2020, round: 11, raceName: 'Eifel Grand Prix', circuitName: 'Nürburgring', location: 'Nürburg', countryCode: 'DEU', countryName: 'Germany', dateStart: new Date('2020-10-11') },
    { year: 2020, round: 12, raceName: 'Portuguese Grand Prix', circuitName: 'Autódromo Internacional do Algarve', location: 'Portimão', countryCode: 'PRT', countryName: 'Portugal', dateStart: new Date('2020-10-25') },
    { year: 2020, round: 13, raceName: 'Emilia Romagna Grand Prix', circuitName: 'Autodromo Enzo e Dino Ferrari', location: 'Imola', countryCode: 'ITA', countryName: 'Italy', dateStart: new Date('2020-11-01') },
    { year: 2020, round: 14, raceName: 'Turkish Grand Prix', circuitName: 'Intercity Istanbul Park', location: 'Istanbul', countryCode: 'TUR', countryName: 'Turkey', dateStart: new Date('2020-11-15') },
    { year: 2020, round: 15, raceName: 'Bahrain Grand Prix', circuitName: 'Bahrain International Circuit', location: 'Sakhir', countryCode: 'BHR', countryName: 'Bahrain', dateStart: new Date('2020-11-29') },
    { year: 2020, round: 16, raceName: 'Sakhir Grand Prix', circuitName: 'Bahrain International Circuit', location: 'Sakhir', countryCode: 'BHR', countryName: 'Bahrain', dateStart: new Date('2020-12-06') },
    { year: 2020, round: 17, raceName: 'Abu Dhabi Grand Prix', circuitName: 'Yas Marina Circuit', location: 'Abu Dhabi', countryCode: 'ARE', countryName: 'UAE', dateStart: new Date('2020-12-13') }
  ];

  const allRaces = [...races2025, ...races2024, ...races2023, ...races2022, ...races2021, ...races2020];

  // Add each race to Firestore
  for (const race of allRaces) {
    try {
      const raceData = {
        ...race,
        dateStart: Timestamp.fromDate(race.dateStart),
        createdAt: Timestamp.now()
      };

      // Use year-round as document ID for easy lookup
      const docId = `${race.year}-${race.round}`;
      await setDoc(doc(racesCollection, docId), raceData);

      console.log(`[F1Calendar] Added ${race.raceName} (Round ${race.round})`);
    } catch (error) {
      console.error(`[F1Calendar] Error adding ${race.raceName}:`, error);
    }
  }

  console.log('[F1Calendar] Seeding complete!');
};

// Seed 2010-2020 F1 calendar data
export const seed2010to2020Calendar = async () => {
  console.log('[F1Calendar] Seeding 2010-2020 F1 calendar data...');

  // Flatten all years into a single array
  const allRaces = [];
  for (const year in races2010to2020) {
    const yearRaces = races2010to2020[year as keyof typeof races2010to2020].map(race => ({
      ...race,
      year: parseInt(year)
    }));
    allRaces.push(...yearRaces);
  }

  console.log(`[F1Calendar] Found ${allRaces.length} races to seed from 2010-2020`);

  // Add each race to Firestore
  for (const race of allRaces) {
    try {
      const raceData = {
        ...race,
        dateStart: Timestamp.fromDate(race.dateStart),
        createdAt: Timestamp.now()
      };

      // Use year-round as document ID for easy lookup
      const docId = `${race.year}-${race.round}`;
      await setDoc(doc(racesCollection, docId), raceData);

      console.log(`[F1Calendar] Added ${race.year} ${race.raceName} (Round ${race.round})`);
    } catch (error) {
      console.error(`[F1Calendar] Error adding ${race.year} ${race.raceName}:`, error);
    }
  }

  console.log('[F1Calendar] 2010-2020 seeding complete!');
};
