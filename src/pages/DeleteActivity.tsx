import { useState, useEffect } from 'react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DeleteActivity = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState('Checking auth...');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setAuthStatus(`Logged in as: ${user.email || user.uid}`);
    } else {
      setAuthStatus('Not logged in - waiting for auth...');
      // Wait for auth state to load
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          setAuthStatus(`Logged in as: ${user.email || user.uid}`);
        } else {
          setAuthStatus('ERROR: Not logged in!');
        }
      });
      return () => unsubscribe();
    }
  }, []);

  const deleteActivity = async () => {
    setLoading(true);
    try {
      const activityRef = doc(db, 'activities', 'O601kQp3dDmF2jyD4MpU');

      // First check if it exists
      const activityDoc = await getDoc(activityRef);

      if (activityDoc.exists()) {
        const data = activityDoc.data();
        setResult(`Found activity:\n${JSON.stringify(data, null, 2)}\n\nDeleting...`);

        // Delete it
        await deleteDoc(activityRef);
        setResult(`Successfully deleted activity O601kQp3dDmF2jyD4MpU!`);
      } else {
        setResult('Activity not found - it may already be deleted');
      }
    } catch (error: any) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <Card className="max-w-2xl mx-auto p-6 bg-black/90 border-2 border-red-900/40">
        <h1 className="text-2xl font-bold text-white mb-4">Delete Activity</h1>
        <p className="text-gray-400 mb-2">Activity ID: O601kQp3dDmF2jyD4MpU</p>
        <p className="text-sm text-yellow-400 mb-4">{authStatus}</p>

        <Button
          onClick={deleteActivity}
          disabled={loading}
          className="bg-racing-red hover:bg-racing-red/80 text-white font-bold"
        >
          {loading ? 'Deleting...' : 'Delete Activity'}
        </Button>

        {result && (
          <pre className="mt-4 p-4 bg-gray-900 text-white rounded text-sm overflow-auto">
            {result}
          </pre>
        )}
      </Card>
    </div>
  );
};

export default DeleteActivity;
