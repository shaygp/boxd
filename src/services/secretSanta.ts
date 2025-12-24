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
  arrayUnion,
} from 'firebase/firestore';
import { createActivity } from './activity';

const submissionsCollection = collection(db, 'secretSantaSubmissions');
const assignmentsCollection = collection(db, 'secretSantaAssignments');

// 2026 F1 Grid
export const DRIVERS_2026 = [
  { name: 'Lando Norris', team: 'McLaren', number: 4, image: 'https://www.formula1.com/content/dam/fom-website/drivers/L/LANNOR01_Lando_Norris/lannor01.png.transform/2col-retina/image.png' },
  { name: 'Oscar Piastri', team: 'McLaren', number: 81, image: 'https://www.formula1.com/content/dam/fom-website/drivers/O/OSCPIA01_Oscar_Piastri/oscpia01.png.transform/2col-retina/image.png' },
  { name: 'George Russell', team: 'Mercedes', number: 63, image: 'https://www.formula1.com/content/dam/fom-website/drivers/G/GEORUS01_George_Russell/georus01.png.transform/2col-retina/image.png' },
  { name: 'Kimi Antonelli', team: 'Mercedes', number: 12, image: 'https://placehold.co/600x800/1a1a1a/00d2be?text=12&font=montserrat' },
  { name: 'Max Verstappen', team: 'Red Bull Racing', number: 1, image: 'https://www.formula1.com/content/dam/fom-website/drivers/M/MAXVER01_Max_Verstappen/maxver01.png.transform/2col-retina/image.png' },
  { name: 'Isack Hadjar', team: 'Red Bull Racing', number: 47, image: 'https://placehold.co/600x800/1a1a1a/0600ef?text=47&font=montserrat' },
  { name: 'Charles Leclerc', team: 'Ferrari', number: 16, image: 'https://www.formula1.com/content/dam/fom-website/drivers/C/CHALEC01_Charles_Leclerc/chalec01.png.transform/2col-retina/image.png' },
  { name: 'Lewis Hamilton', team: 'Ferrari', number: 44, image: 'https://www.formula1.com/content/dam/fom-website/drivers/L/LEWHAM01_Lewis_Hamilton/lewham01.png.transform/2col-retina/image.png' },
  { name: 'Alex Albon', team: 'Williams', number: 23, image: 'https://www.formula1.com/content/dam/fom-website/drivers/A/ALEALB01_Alex_Albon/alealb01.png.transform/2col-retina/image.png' },
  { name: 'Carlos Sainz', team: 'Williams', number: 55, image: 'https://www.formula1.com/content/dam/fom-website/drivers/C/CARSAI01_Carlos_Sainz/carsai01.png.transform/2col-retina/image.png' },
  { name: 'Liam Lawson', team: 'Racing Bulls', number: 30, image: 'https://www.formula1.com/content/dam/fom-website/drivers/L/LIALAW01_Liam_Lawson/lialaw01.png.transform/2col-retina/image.png' },
  { name: 'Arvid Lindblad', team: 'Racing Bulls', number: 45, image: 'https://placehold.co/600x800/1a1a1a/6692ff?text=45&font=montserrat' },
  { name: 'Fernando Alonso', team: 'Aston Martin', number: 14, image: 'https://www.formula1.com/content/dam/fom-website/drivers/F/FERALO01_Fernando_Alonso/feralo01.png.transform/2col-retina/image.png' },
  { name: 'Lance Stroll', team: 'Aston Martin', number: 18, image: 'https://www.formula1.com/content/dam/fom-website/drivers/L/LANSTR01_Lance_Stroll/lanstr01.png.transform/2col-retina/image.png' },
  { name: 'Esteban Ocon', team: 'Haas', number: 31, image: 'https://www.formula1.com/content/dam/fom-website/drivers/E/ESTOCO01_Esteban_Ocon/estoco01.png.transform/2col-retina/image.png' },
  { name: 'Oliver Bearman', team: 'Haas', number: 87, image: 'https://www.formula1.com/content/dam/fom-website/drivers/O/OLIBEA01_Oliver_Bearman/olibea01.png.transform/2col-retina/image.png' },
  { name: 'Nico Hulkenberg', team: 'Sauber/Audi', number: 27, image: 'https://www.formula1.com/content/dam/fom-website/drivers/N/NICHUL01_Nico_Hulkenberg/nichul01.png.transform/2col-retina/image.png' },
  { name: 'Gabriel Bortoleto', team: 'Sauber/Audi', number: 5, image: 'https://placehold.co/600x800/1a1a1a/52e252?text=5&font=montserrat' },
  { name: 'Pierre Gasly', team: 'Alpine', number: 10, image: 'https://www.formula1.com/content/dam/fom-website/drivers/P/PIEGAS01_Pierre_Gasly/piegas01.png.transform/2col-retina/image.png' },
  { name: 'Franco Colapinto', team: 'Alpine', number: 43, image: 'https://www.formula1.com/content/dam/fom-website/drivers/F/FRACOL01_Franco_Colapinto/fracol01.png.transform/2col-retina/image.png' },
  { name: 'Valtteri Bottas', team: 'Cadillac', number: 77, image: 'https://www.formula1.com/content/dam/fom-website/drivers/V/VALBOT01_Valtteri_Bottas/valbot01.png.transform/2col-retina/image.png' },
  { name: 'Sergio Perez', team: 'Cadillac', number: 11, image: 'https://www.formula1.com/content/dam/fom-website/drivers/S/SERPER01_Sergio_Perez/serper01.png.transform/2col-retina/image.png' },
];

export interface Driver {
  name: string;
  team: string;
  number: number;
  image: string;
}

export interface SecretSantaSubmission {
  id?: string;
  userId: string;
  userName: string;
  userAvatar?: string;

  assignedDriver: string;
  driverTeam: string;
  driverNumber: number;

  giftTitle: string;
  giftImageUrl: string;
  productLink?: string;

  likes: number;
  likedBy: string[];

  createdAt: Date;
  year: number;
}

export interface DriverAssignment {
  userId: string;
  driverName: string;
  year: number;
  assignedAt: Date;
}

/**
 * Assign a random driver to a user (one-time only per year)
 */
export const assignDriverToUser = async (): Promise<Driver> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const year = 2026;

  // Check if user already has an assignment for this year
  const q = query(
    assignmentsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    firestoreLimit(1)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    // User already has an assignment
    const assignmentData = snapshot.docs[0].data();
    const driver = DRIVERS_2026.find(d => d.name === assignmentData.driverName);
    if (driver) return driver;
  }

  // Assign random driver
  const randomDriver = DRIVERS_2026[Math.floor(Math.random() * DRIVERS_2026.length)];

  // Save assignment
  await addDoc(assignmentsCollection, {
    userId: user.uid,
    driverName: randomDriver.name,
    year,
    assignedAt: Timestamp.now(),
  });

  return randomDriver;
};

/**
 * Get user's assigned driver
 */
export const getUserAssignedDriver = async (): Promise<Driver | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const year = 2026;

  const q = query(
    assignmentsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    firestoreLimit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const assignmentData = snapshot.docs[0].data();
  const driver = DRIVERS_2026.find(d => d.name === assignmentData.driverName);

  return driver || null;
};

/**
 * Check if user has already submitted a gift
 */
export const hasUserSubmitted = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const year = 2026;

  const q = query(
    submissionsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    firestoreLimit(1)
  );

  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Submit a Secret Santa gift
 */
export const submitSecretSantaGift = async (
  driver: Driver,
  giftData: {
    giftTitle: string;
    giftImageUrl: string;
    productLink?: string;
  }
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  // Check if already submitted
  const alreadySubmitted = await hasUserSubmitted();
  if (alreadySubmitted) {
    throw new Error('You have already submitted a gift for this year');
  }

  // Get user profile
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const userData = userDoc.data();

  const submission: Omit<SecretSantaSubmission, 'id'> = {
    userId: user.uid,
    userName: userData?.username || userData?.name || 'User',
    userAvatar: userData?.photoURL,

    assignedDriver: driver.name,
    driverTeam: driver.team,
    driverNumber: driver.number,

    ...giftData,

    likes: 0,
    likedBy: [],

    createdAt: new Date(),
    year: 2026,
  };

  const docRef = await addDoc(submissionsCollection, {
    ...submission,
    createdAt: Timestamp.now(),
  });

  // Create activity for the feed
  try {
    await createActivity({
      type: 'secretSanta',
      targetId: docRef.id,
      targetType: 'secretSantaGift',
      content: `gifted ${giftData.giftTitle} to ${driver.name}`,
      giftTitle: giftData.giftTitle,
      giftImageUrl: giftData.giftImageUrl,
      assignedDriver: driver.name,
    });
  } catch (error) {
    console.error('Error creating Secret Santa activity:', error);
    // Don't fail the submission if activity creation fails
  }

  return docRef.id;
};

/**
 * Get user's submission
 */
export const getUserSubmission = async (): Promise<SecretSantaSubmission | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const year = 2026;

  const q = query(
    submissionsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    firestoreLimit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
    createdAt: snapshot.docs[0].data().createdAt?.toDate(),
  } as SecretSantaSubmission;
};

/**
 * Get a specific submission by ID (for sharing)
 */
export const getSubmissionById = async (id: string): Promise<SecretSantaSubmission | null> => {
  const docRef = doc(submissionsCollection, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
    createdAt: docSnap.data().createdAt?.toDate(),
  } as SecretSantaSubmission;
};

/**
 * Get all submissions (for gallery)
 */
export const getAllSubmissions = async (limit: number = 100): Promise<SecretSantaSubmission[]> => {
  const year = 2026;

  const q = query(
    submissionsCollection,
    where('year', '==', year),
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as SecretSantaSubmission[];
};

/**
 * Get submissions for a specific driver
 */
export const getDriverSubmissions = async (driverName: string): Promise<SecretSantaSubmission[]> => {
  const year = 2026;

  const q = query(
    submissionsCollection,
    where('year', '==', year),
    where('assignedDriver', '==', driverName),
    orderBy('likes', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as SecretSantaSubmission[];
};

/**
 * Toggle like on a submission
 */
export const toggleSubmissionLike = async (submissionId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const submissionRef = doc(submissionsCollection, submissionId);
  const submissionSnap = await getDoc(submissionRef);

  if (!submissionSnap.exists()) {
    throw new Error('Submission not found');
  }

  const data = submissionSnap.data();
  const likedBy = data.likedBy || [];
  const isLiked = likedBy.includes(user.uid);

  if (isLiked) {
    // Unlike
    await updateDoc(submissionRef, {
      likes: Math.max(0, (data.likes || 0) - 1),
      likedBy: likedBy.filter((id: string) => id !== user.uid),
    });
  } else {
    // Like
    await updateDoc(submissionRef, {
      likes: (data.likes || 0) + 1,
      likedBy: arrayUnion(user.uid),
    });
  }
};

/**
 * Get leaderboard (top submissions by likes)
 */
export const getLeaderboard = async (limit: number = 20): Promise<SecretSantaSubmission[]> => {
  const year = 2026;

  const q = query(
    submissionsCollection,
    where('year', '==', year),
    orderBy('likes', 'desc'),
    firestoreLimit(limit)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as SecretSantaSubmission[];
};
