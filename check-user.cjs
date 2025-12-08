// Simple script to query Firestore using Firebase Client SDK
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, limit, getDocs, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyC3jfMIVYvTdWnDZ0CWxRRqOvwLxv1pJhk",
  authDomain: "race-logger-66c2c.firebaseapp.com",
  projectId: "race-logger-66c2c",
  storageBucket: "race-logger-66c2c.firebasestorage.app",
  messagingSenderId: "324513878899",
  appId: "1:324513878899:web:0be9db23fc92f4c6cd0fe1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const userId = '5vQUKZJb49aAQ1XtixFefb6nznq1';

async function checkUser() {
  try {
    // Get user document
    console.log('Checking user:', userId);
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      console.log('\nUser data:', userDoc.data());
    } else {
      console.log('\nUser document does not exist');
    }

    // Get activities from this user
    console.log('\n--- Activities from this user ---');
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);

    console.log(`Found ${activitiesSnapshot.docs.length} activities`);
    activitiesSnapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      console.log({
        id: docSnapshot.id,
        type: data.type,
        createdAt: data.createdAt?.toDate(),
        raceName: data.raceName,
        content: data.content?.substring(0, 50),
        targetId: data.targetId
      });
    });

    // Check for activities from Nov 28
    console.log('\n--- All activities sorted by date (first 20) ---');
    const allActivitiesQuery = query(
      collection(db, 'activities'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const allActivitiesSnapshot = await getDocs(allActivitiesQuery);

    allActivitiesSnapshot.docs.forEach((docSnapshot, index) => {
      const data = docSnapshot.data();
      console.log(`${index + 1}.`, {
        id: docSnapshot.id,
        userId: data.userId,
        username: data.username,
        type: data.type,
        createdAt: data.createdAt?.toDate(),
        raceName: data.raceName
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
