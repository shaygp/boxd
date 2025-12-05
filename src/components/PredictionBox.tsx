import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  createOrUpdatePrediction,
  getUserPrediction,
  getPredictionStats,
  Prediction,
} from '@/services/predictions';

interface PredictionBoxProps {
  raceName: string;
  raceYear: number;
  round?: number;
}

const drivers2025 = [
  { id: 'verstappen', name: 'Max Verstappen', team: 'Red Bull Racing' },
  { id: 'tsunoda', name: 'Yuki Tsunoda', team: 'Red Bull Racing' },
  { id: 'leclerc', name: 'Charles Leclerc', team: 'Ferrari' },
  { id: 'hamilton', name: 'Lewis Hamilton', team: 'Ferrari' },
  { id: 'russell', name: 'George Russell', team: 'Mercedes' },
  { id: 'antonelli', name: 'Kimi Antonelli', team: 'Mercedes' },
  { id: 'norris', name: 'Lando Norris', team: 'McLaren' },
  { id: 'piastri', name: 'Oscar Piastri', team: 'McLaren' },
  { id: 'alonso', name: 'Fernando Alonso', team: 'Aston Martin' },
  { id: 'stroll', name: 'Lance Stroll', team: 'Aston Martin' },
  { id: 'gasly', name: 'Pierre Gasly', team: 'Alpine' },
  { id: 'colapinto', name: 'Franco Colapinto', team: 'Alpine' },
  { id: 'albon', name: 'Alex Albon', team: 'Williams' },
  { id: 'sainz', name: 'Carlos Sainz', team: 'Williams' },
  { id: 'hadjar', name: 'Isack Hadjar', team: 'RB' },
  { id: 'lawson', name: 'Liam Lawson', team: 'RB' },
  { id: 'bearman', name: 'Oliver Bearman', team: 'Haas' },
  { id: 'ocon', name: 'Esteban Ocon', team: 'Haas' },
  { id: 'hulkenberg', name: 'Nico Hülkenberg', team: 'Sauber' },
  { id: 'bortoleto', name: 'Gabriel Bortoleto', team: 'Sauber' },
];

export const PredictionBox = ({ raceName, raceYear, round }: PredictionBoxProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [existingPrediction, setExistingPrediction] = useState<Prediction | null>(null);
  const [stats, setStats] = useState<{ driver: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // Load user's existing prediction
        const prediction = await getUserPrediction(user.uid, raceName, raceYear);
        if (prediction) {
          setExistingPrediction(prediction);
          setSelectedDriver(prediction.predictedWinner);
        }

        // Load prediction stats
        const predictionStats = await getPredictionStats(raceName, raceYear);
        setStats(predictionStats);
      } catch (error) {
        console.error('Error loading prediction data:', error);
      } finally {
        setStatsLoading(false);
      }
    };

    loadData();
  }, [user, raceName, raceYear]);

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to make a prediction',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDriver) {
      toast({
        title: 'Select a driver',
        description: 'Please select a driver to predict the winner',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await createOrUpdatePrediction(raceName, raceYear, selectedDriver, round);
      toast({
        title: existingPrediction ? 'Prediction updated!' : 'Prediction submitted!',
        description: `You predicted ${selectedDriver} will win ${raceName}`,
      });

      // Reload stats
      const predictionStats = await getPredictionStats(raceName, raceYear);
      setStats(predictionStats);

      // Update existing prediction
      const prediction = await getUserPrediction(user.uid, raceName, raceYear);
      if (prediction) {
        setExistingPrediction(prediction);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPredictions = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="p-3 sm:p-4 border-2 border-red-900/40 bg-black/90 backdrop-blur-sm">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-racing-red/20 border border-racing-red/40 flex items-center justify-center text-base">
            🏎️
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide">
              Predict the Winner
            </h3>
            {existingPrediction && (
              <p className="text-xs text-gray-400 mt-0.5">Update your prediction</p>
            )}
          </div>
        </div>

        {/* Prediction Form */}
        <div className="space-y-2">
          <Select value={selectedDriver} onValueChange={setSelectedDriver}>
            <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white h-10 text-sm">
              <SelectValue placeholder="Select a driver..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-black/95 border-2 border-red-900/40">
              {drivers2025.map((driver) => (
                <SelectItem
                  key={driver.id}
                  value={driver.name}
                  className="text-white hover:bg-racing-red/20 cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{driver.name}</span>
                    <span className="text-xs text-gray-400">{driver.team}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedDriver}
            className="w-full bg-racing-red hover:bg-red-600 text-white font-bold uppercase tracking-wide h-9 text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {existingPrediction ? 'Updating...' : 'Submitting...'}
              </span>
            ) : (
              <span>{existingPrediction ? 'Update' : 'Submit'}</span>
            )}
          </Button>
        </div>

        {/* Community Predictions */}
        {!statsLoading && stats.length > 0 && (
          <div className="pt-3 border-t border-red-900/40">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center justify-between w-full text-gray-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  {showStats ? 'Hide' : 'See'} Community Predictions ({totalPredictions})
                </span>
              </div>
              <span className="text-xs">{showStats ? '▲' : '▼'}</span>
            </button>

            {showStats && (
              <div className="space-y-1.5 mt-2">
                {stats.slice(0, 5).map((stat) => {
                  const percentage = Math.round((stat.count / totalPredictions) * 100);
                  return (
                    <div key={stat.driver} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-white truncate">{stat.driver}</span>
                        <span className="text-gray-400 ml-2">
                          {percentage}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-black/60 rounded-full overflow-hidden border border-red-900/40">
                        <div
                          className="h-full bg-gradient-to-r from-racing-red to-red-600 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
