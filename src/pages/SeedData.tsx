import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { seed2025Calendar, seed2010to2020Calendar } from '@/services/f1Calendar';
import { useNavigate } from 'react-router-dom';

const SeedData = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading2010, setLoading2010] = useState(false);
  const [success2010, setSuccess2010] = useState(false);
  const [error2010, setError2010] = useState<string | null>(null);
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

  const handleSeed2010to2020 = async () => {
    setLoading2010(true);
    setError2010(null);
    setSuccess2010(false);

    try {
      await seed2010to2020Calendar();
      setSuccess2010(true);
    } catch (err: any) {
      console.error('Error seeding 2010-2020 data:', err);
      setError2010(err.message || 'Failed to seed 2010-2020 data');
    } finally {
      setLoading2010(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-black/90 border-2 border-red-900/40">
        <h1 className="text-2xl font-black text-white mb-6 uppercase tracking-wider">
          Seed F1 Calendar Data
        </h1>

        {/* 2020-2025 Section */}
        <div className="mb-8 pb-8 border-b border-gray-800">
          <h2 className="text-xl font-black text-racing-red mb-3 uppercase tracking-wider">
            2020-2025 Calendar
          </h2>
          <p className="text-gray-300 mb-4 font-bold text-sm">
            Import F1 race calendars for seasons 2020-2025 into Firestore. Only run this once!
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500/50 rounded">
              <p className="text-red-400 font-bold">Error: {error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-900/20 border-2 border-green-500/50 rounded">
              <p className="text-green-400 font-bold">Successfully seeded F1 calendars (2020-2025)!</p>
            </div>
          )}

          <Button
            onClick={handleSeed}
            disabled={loading || success}
            className="w-full bg-racing-red hover:bg-red-600 font-black uppercase"
          >
            {loading ? 'Seeding...' : success ? 'Done!' : 'Seed 2020-2025 Data'}
          </Button>

          <p className="text-xs text-gray-500 mt-2">
            ~130 races (2020-2025 seasons)
          </p>
        </div>

        {/* 2010-2020 Section */}
        <div className="mb-8 pb-8 border-b border-gray-800">
          <h2 className="text-xl font-black text-racing-red mb-3 uppercase tracking-wider">
            2010-2020 Calendar
          </h2>
          <p className="text-gray-300 mb-4 font-bold text-sm">
            Import F1 race calendars for seasons 2010-2020 into Firestore. Only run this once!
          </p>

          {error2010 && (
            <div className="mb-4 p-4 bg-red-900/20 border-2 border-red-500/50 rounded">
              <p className="text-red-400 font-bold">Error: {error2010}</p>
            </div>
          )}

          {success2010 && (
            <div className="mb-4 p-4 bg-green-900/20 border-2 border-green-500/50 rounded">
              <p className="text-green-400 font-bold">Successfully seeded F1 calendars (2010-2020)!</p>
            </div>
          )}

          <Button
            onClick={handleSeed2010to2020}
            disabled={loading2010 || success2010}
            className="w-full bg-racing-red hover:bg-red-600 font-black uppercase"
          >
            {loading2010 ? 'Seeding...' : success2010 ? 'Done!' : 'Seed 2010-2020 Data'}
          </Button>

          <p className="text-xs text-gray-500 mt-2">
            ~200 races (2010-2020 seasons)
          </p>
        </div>

        {/* Go Home Button */}
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          className="w-full border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase"
        >
          Go Home
        </Button>
      </Card>
    </div>
  );
};

export default SeedData;
