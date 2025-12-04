import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username: string;
  description: string;
  photoURL?: string;
  profile_image_url?: string; // deprecated, use photoURL
  created_at: Date;
  updated_at: Date;
}

// Username validation helper
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  // Remove @ if user included it
  const cleanUsername = username.replace(/^@/, '').toLowerCase();

  // Check length (3-20 characters)
  if (cleanUsername.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (cleanUsername.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }

  // Check format: alphanumeric, underscore, hyphen only
  if (!/^[a-z0-9_-]+$/.test(cleanUsername)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }

  // Check that it starts with a letter or number
  if (!/^[a-z0-9]/.test(cleanUsername)) {
    return { valid: false, error: 'Username must start with a letter or number' };
  }

  return { valid: true };
};

// Check if username is available
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const cleanUsername = username.replace(/^@/, '').toLowerCase();
  const usernameDoc = await getDoc(doc(db, 'usernames', cleanUsername));
  return !usernameDoc.exists();
};

// Get user ID by username
export const getUserIdByUsername = async (username: string): Promise<string | null> => {
  const cleanUsername = username.replace(/^@/, '').toLowerCase();
  const usernameDoc = await getDoc(doc(db, 'usernames', cleanUsername));
  if (usernameDoc.exists()) {
    return usernameDoc.data().userId;
  }
  return null;
};

export const signUp = async (email: string, password: string, name: string, username: string) => {
  try {
    console.log('[signUp] Starting signup process for:', email);

    // Validate username format
    const cleanUsername = username.replace(/^@/, '').toLowerCase();
    const validation = validateUsername(cleanUsername);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Check username availability
    const isAvailable = await checkUsernameAvailability(cleanUsername);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }

    console.log('[signUp] Creating user account...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('[signUp] User created with UID:', user.uid);

    // Send verification email
    console.log('[signUp] Sending verification email to:', user.email);
    try {
      await sendEmailVerification(user);
      console.log('[signUp] Verification email sent successfully!');
    } catch (emailError: any) {
      console.error('[signUp] Failed to send verification email:', emailError);
      console.error('[signUp] Error code:', emailError.code);
      console.error('[signUp] Error message:', emailError.message);
      // Don't throw - continue with account creation even if email fails
    }

    console.log('[signUp] Creating user profile document...');
    const userProfile: Omit<UserProfile, 'id'> = {
      name,
      email,
      username: cleanUsername,
      description: '',
      photoURL: '',
      created_at: Timestamp.now() as any,
      updated_at: Timestamp.now() as any
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('[signUp] User profile created');

    // Create username document for uniqueness enforcement
    console.log('[signUp] Creating username mapping...');
    await setDoc(doc(db, 'usernames', cleanUsername), {
      userId: user.uid,
      created_at: Timestamp.now()
    });
    console.log('[signUp] Username mapping created');

    console.log('[signUp] Creating user stats document...');
    const userStats = {
      racesWatched: 0,
      reviewsCount: 0,
      listsCount: 0,
      followersCount: 0,
      followingCount: 0,
      totalHoursWatched: 0,
      favoriteDriver: '',
      favoriteCircuit: '',
      favoriteTeam: ''
    };

    await setDoc(doc(db, 'userStats', user.uid), userStats);
    console.log('[signUp] User stats created');
    console.log('[signUp] Signup completed successfully!');

    return user;
  } catch (error: any) {
    console.error('[signUp] Signup failed:', error);
    throw error;
  }
};

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  await sendEmailVerification(user);
};

export const signIn = async (email: string, password: string) => {
  try {
    console.log('[signIn] Attempting to sign in with email:', email);

    // Persistence is already configured in firebase.ts initialization
    // No need to set it again here
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[signIn] Sign in successful, user:', userCredential.user?.uid);

    if (!userCredential.user) {
      throw new Error('Authentication failed - no user returned');
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('[signIn] Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', userId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as UserProfile;
  }
  return null;
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    console.log('[updateUserProfile] Updating profile...', { userId, updates });

    const docRef = doc(db, 'users', userId);

    // Clean up the updates object - remove any undefined values
    const cleanUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        cleanUpdates[key] = updates[key];
      }
    });

    // If username is being changed, handle the username mapping
    if (cleanUpdates.username) {
      console.log('[updateUserProfile] Username change detected, updating username mapping...');

      // Get the old username from the user profile
      const oldProfileDoc = await getDoc(docRef);
      if (oldProfileDoc.exists()) {
        const oldProfile = oldProfileDoc.data();
        const oldUsername = oldProfile.username;
        const newUsername = cleanUpdates.username;

        if (oldUsername && oldUsername !== newUsername) {
          console.log('[updateUserProfile] Deleting old username mapping:', oldUsername);
          // Delete old username mapping
          try {
            await deleteDoc(doc(db, 'usernames', oldUsername));
            console.log('[updateUserProfile] Old username mapping deleted');
          } catch (deleteError) {
            console.error('[updateUserProfile] Failed to delete old username mapping:', deleteError);
            // Continue anyway - might not exist
          }

          console.log('[updateUserProfile] Creating new username mapping:', newUsername);
          // Create new username mapping
          await setDoc(doc(db, 'usernames', newUsername), {
            userId: userId,
            created_at: Timestamp.now()
          });
          console.log('[updateUserProfile] New username mapping created');
        }
      }
    }

    // Add timestamp
    cleanUpdates.updated_at = Timestamp.now();

    console.log('[updateUserProfile] Clean updates:', cleanUpdates);

    await setDoc(docRef, cleanUpdates, { merge: true });

    console.log('[updateUserProfile] Profile updated successfully!');
  } catch (error: any) {
    console.error('[updateUserProfile] Failed to update profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const uploadProfilePicture = async (userId: string, file: File): Promise<string> => {
  try {
    console.log('[uploadProfilePicture] Starting upload...', { userId, fileName: file.name, fileSize: file.size });

    const fileExtension = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, `profile-pictures/${fileName}`);

    console.log('[uploadProfilePicture] Uploading to storage...', { path: `profile-pictures/${fileName}` });

    // Add timeout to prevent hanging
    const uploadPromise = uploadBytes(storageRef, file);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
    );

    await Promise.race([uploadPromise, timeoutPromise]);

    console.log('[uploadProfilePicture] Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);

    console.log('[uploadProfilePicture] Upload complete!', { downloadURL });
    return downloadURL;
  } catch (error: any) {
    console.error('[uploadProfilePicture] Upload failed:', error);
    throw new Error(`Failed to upload profile picture: ${error.message}`);
  }
};
