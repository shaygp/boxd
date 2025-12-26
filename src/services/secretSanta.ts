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
  previousDrivers: string[]; // Track all previous drivers to avoid duplicates
  lastSharedAt?: Date; // When user last shared on Twitter
  canGetNewDriver: boolean; // Whether user is eligible for new driver today
}

/**
 * Check if it's 10AM CET or later today
 */
const isAfter10AMCET = (): boolean => {
  const now = new Date();
  // Convert to CET (UTC+1) or CEST (UTC+2 during daylight saving)
  const cetOffset = 1; // CET is UTC+1
  const cetTime = new Date(now.getTime() + (cetOffset * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  return cetTime.getHours() >= 10;
};

/**
 * Assign a driver to a user (daily at 10AM CET if they shared on Twitter)
 */
export const assignDriverToUser = async (): Promise<Driver> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const year = 2026;

  // Check if user already has an assignment
  const q = query(
    assignmentsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year)
  );

  const snapshot = await getDocs(q);
  const assignmentDoc = snapshot.empty ? null : snapshot.docs[0];

  if (assignmentDoc) {
    const assignmentData = assignmentDoc.data();
    const previousDrivers = assignmentData.previousDrivers || [];
    const lastSharedAt = assignmentData.lastSharedAt?.toDate();
    const assignedAt = assignmentData.assignedAt?.toDate();
    const now = new Date();

    // Get start of today (midnight)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Check if assignment is from before today OR if 24 hours passed
    const needsNewDriver = !assignedAt ||
                          assignedAt < todayStart ||
                          (now.getTime() - assignedAt.getTime()) >= 24 * 60 * 60 * 1000;

    // Check if user has shared on Twitter since their last assignment
    const hasShared = lastSharedAt && assignedAt && lastSharedAt.getTime() > assignedAt.getTime();

    // Only give new driver if time passed AND user shared (or if assignment is old)
    if (!needsNewDriver || (!hasShared && assignedAt >= todayStart)) {
      // Return current driver
      const currentDriver = DRIVERS_2026.find(d => d.name === assignmentData.driverName);
      if (currentDriver) return currentDriver;
    }

    // User is eligible for a new driver!
    const availableDrivers = DRIVERS_2026.filter(d => !previousDrivers.includes(d.name) && d.name !== assignmentData.driverName);

    if (availableDrivers.length === 0) {
      // All drivers have been assigned, return current one
      const currentDriver = DRIVERS_2026.find(d => d.name === assignmentData.driverName);
      if (currentDriver) return currentDriver;
      throw new Error('No more drivers available');
    }

    const newDriver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];

    // Update assignment with new driver and reset share status
    await updateDoc(assignmentDoc.ref, {
      driverName: newDriver.name,
      previousDrivers: [...previousDrivers, assignmentData.driverName],
      assignedAt: Timestamp.now(),
      lastSharedAt: null, // Reset so they need to share again
      canGetNewDriver: false,
    });

    return newDriver;
  }

  // First time assignment - pick random driver
  const randomDriver = DRIVERS_2026[Math.floor(Math.random() * DRIVERS_2026.length)];

  await addDoc(assignmentsCollection, {
    userId: user.uid,
    driverName: randomDriver.name,
    year,
    assignedAt: Timestamp.now(),
    previousDrivers: [],
    canGetNewDriver: false,
  });

  return randomDriver;
};

/**
 * Mark that user shared on Twitter (eligibility for tomorrow's driver)
 */
export const markSharedOnTwitter = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const year = 2026;

  const q = query(
    assignmentsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    firestoreLimit(1)
  );

  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    await updateDoc(snapshot.docs[0].ref, {
      lastSharedAt: Timestamp.now(),
      canGetNewDriver: true,
    });
  }
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
 * Check if user has already submitted a gift for their current driver
 */
export const hasUserSubmitted = async (currentDriverName?: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  const year = 2026;

  // If no driver name provided, get the current assigned driver
  let driverName = currentDriverName;
  if (!driverName) {
    const assignment = await getUserAssignedDriver();
    if (!assignment) return false;
    driverName = assignment.name;
  }

  const q = query(
    submissionsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    where('assignedDriver', '==', driverName),
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

  // Check if already submitted for this driver
  const alreadySubmitted = await hasUserSubmitted(driver.name);
  if (alreadySubmitted) {
    throw new Error('You have already submitted a gift for this driver');
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
 * Get user's submission for their current driver
 */
export const getUserSubmission = async (): Promise<SecretSantaSubmission | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const year = 2026;

  // Get current assigned driver
  const currentDriver = await getUserAssignedDriver();
  if (!currentDriver) return null;

  const q = query(
    submissionsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    where('assignedDriver', '==', currentDriver.name),
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
 * Get all user's submissions (all gifts they've given)
 */
export const getAllUserSubmissions = async (): Promise<SecretSantaSubmission[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const year = 2026;

  const q = query(
    submissionsCollection,
    where('userId', '==', user.uid),
    where('year', '==', year),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
  })) as SecretSantaSubmission[];
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
