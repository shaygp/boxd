import { db } from '../lib/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

async function seedAZChallenge() {
  const challengesCollection = collection(db, 'grillTheGridChallenges');

  const azChallenge = {
    name: 'A-Z Challenge',
    type: 'az',
    description: 'Name an F1 driver surname for every letter of the alphabet',
    timeLimit: 180, // 3 minutes in seconds
    questions: ALPHABET.map(letter => ({
      id: letter,
      prompt: `Name a driver whose surname starts with ${letter}`,
      correctAnswer: [], // We validate dynamically against allF1Drivers
    })),
    isActive: true,
    startDate: Timestamp.now(),
    totalAttempts: 0,
    createdAt: Timestamp.now(),
  };

  try {
    await setDoc(doc(challengesCollection, 'az-challenge'), azChallenge);
    console.log('✅ Successfully created az-challenge!');
  } catch (error) {
    console.error('❌ Error creating challenge:', error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAZChallenge().then(() => {
    console.log('Done!');
    process.exit(0);
  });
}

export { seedAZChallenge };
