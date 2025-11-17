import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { seed2025Calendar } from '@/services/f1Calendar';
import { useNavigate } from 'react-router-dom';

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await seed2025Calendar();
      setSuccess(true);
    } catch (err: any) {
      console.error('Error seeding data:', err);
      setError(err.message || 'Failed to seed data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-black/90 border-2 border-red-900/40">
        <h1 className="text-2xl font-black text-white mb-4 uppercase tracking-wider">
          Seed F1 Calendar Data
        </h1>

        <p className="text-gray-300 mb-6 font-bold">
          This will import F1 race calendars for seasons 2020-2025 into Firestore. Only run this once!
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500/50 rounded">
            <p className="text-red-400 font-bold">Error: {error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-900/20 border-2 border-green-500/50 rounded">
            <p className="text-green-400 font-bold">Successfully seeded F1 calendars (2020-2025)!</p>
            <p className="text-green-300 text-sm mt-2">You can now go back to the home page.</p>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handleSeed}
            disabled={loading || success}
            className="flex-1 bg-racing-red hover:bg-red-600 font-black uppercase"
          >
            {loading ? 'Seeding...' : success ? 'Done!' : 'Seed Data'}
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase"
          >
            Go Home
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Note: This will add ~130 races (2020-2025 seasons) to your Firestore database.
        </p>
      </Card>
    </div>
  );
};

export default SeedData;
