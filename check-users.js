import admin from 'firebase-admin';

admin.initializeApp({
  projectId: 'box-boxd-f1-1759326853'
});

const db = admin.firestore();

async function checkUsers() {
  try {
    // Check Auth users
    console.log('\n=== Checking Firebase Auth Users ===');
    const authUsers = await admin.auth().listUsers(10);
    console.log(`Total Auth users: ${authUsers.users.length}`);
    authUsers.users.forEach(user => {
      console.log(`  - ${user.email} (${user.uid}) - verified: ${user.emailVerified}`);
    });

    // Check Firestore users collection
    console.log('\n=== Checking Firestore users collection ===');
    const usersSnapshot = await db.collection('users').limit(10).get();
    console.log(`Total user documents: ${usersSnapshot.size}`);
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${doc.id}: ${data.email} (${data.name})`);
    });

    // Check if there are any collections with data
    console.log('\n=== Checking other collections ===');
    const collections = ['raceLogs', 'watchlist', 'lists', 'notifications', 'activities'];
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).limit(1).get();
      console.log(`${collectionName}: ${snapshot.size} documents`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

checkUsers();
