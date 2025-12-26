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
  { name: 'Lando Norris', team: 'McLaren', number: 4, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F4_Lando_Norris.png?alt=media' },
  { name: 'Oscar Piastri', team: 'McLaren', number: 81, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F81_Oscar_Piastri.png?alt=media' },
  { name: 'George Russell', team: 'Mercedes', number: 63, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F63_George_Russell.png?alt=media' },
  { name: 'Kimi Antonelli', team: 'Mercedes', number: 12, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F12_Kimi_Antonelli.png?alt=media' },
  { name: 'Max Verstappen', team: 'Red Bull Racing', number: 1, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F1_Max_Verstappen.png?alt=media' },
  { name: 'Isack Hadjar', team: 'Red Bull Racing', number: 47, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F47_Isack_Hadjar.png?alt=media' },
  { name: 'Charles Leclerc', team: 'Ferrari', number: 16, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F16_Charles_Leclerc.png?alt=media' },
  { name: 'Lewis Hamilton', team: 'Ferrari', number: 44, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F44_Lewis_Hamilton.png?alt=media' },
  { name: 'Alex Albon', team: 'Williams', number: 23, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F23_Alex_Albon.png?alt=media' },
  { name: 'Carlos Sainz', team: 'Williams', number: 55, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F55_Carlos_Sainz.png?alt=media' },
  { name: 'Liam Lawson', team: 'Racing Bulls', number: 30, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F30_Liam_Lawson.png?alt=media' },
  { name: 'Arvid Lindblad', team: 'Racing Bulls', number: 41, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F41_Arvid_Lindblad.png?alt=media' },
  { name: 'Fernando Alonso', team: 'Aston Martin', number: 14, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F14_Fernando_Alonso.png?alt=media' },
  { name: 'Lance Stroll', team: 'Aston Martin', number: 18, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F18_Lance_Stroll.png?alt=media' },
  { name: 'Esteban Ocon', team: 'Haas', number: 31, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F31_Esteban_Ocon.png?alt=media' },
  { name: 'Oliver Bearman', team: 'Haas', number: 87, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F87_Oliver_Bearman.png?alt=media' },
  { name: 'Nico Hulkenberg', team: 'Sauber/Audi', number: 27, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F27_Nico_Hulkenberg.png?alt=media' },
  { name: 'Gabriel Bortoleto', team: 'Sauber/Audi', number: 5, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F5_Gabriel_Bortoleto.png?alt=media' },
  { name: 'Pierre Gasly', team: 'Alpine', number: 10, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F10_Pierre_Gasly.png?alt=media' },
  { name: 'Franco Colapinto', team: 'Alpine', number: 43, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F43_Franco_Colapinto.png?alt=media' },
  { name: 'Valtteri Bottas', team: 'Cadillac', number: 77, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F77_Valtteri_Bottas.png?alt=media' },
  { name: 'Sergio Perez', team: 'Cadillac', number: 11, image: 'https://firebasestorage.googleapis.com/v0/b/boxboxd-web-new.firebasestorage.app/o/driver-images%2F11_Sergio_Perez.png?alt=media' },
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

  const submission: any = {
    userId: user.uid,
    userName: userData?.username || userData?.name || 'User',
    userAvatar: userData?.photoURL,

    assignedDriver: driver.name,
    driverTeam: driver.team,
    driverNumber: driver.number,

    giftTitle: giftData.giftTitle,
    giftImageUrl: giftData.giftImageUrl,

    likes: 0,
    likedBy: [],

    createdAt: Timestamp.now(),
    year: 2026,
  };

  // Only add productLink if it exists
  if (giftData.productLink) {
    submission.productLink = giftData.productLink;
  }

  const docRef = await addDoc(submissionsCollection, submission);

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
