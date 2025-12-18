import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getChallengeLeaderboard, LeaderboardEntry } from "@/services/grillTheGrid";
import { useNavigate } from "react-router-dom";

interface GrillLeaderboardProps {
  challengeId: string;
}

export const GrillLeaderboard = ({ challengeId }: GrillLeaderboardProps) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadLeaderboard();
  }, [challengeId]);

  const loadLeaderboard = async () => {
    try {
      const data = await getChallengeLeaderboard(challengeId, 5);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="bg-black/90 border-2 border-red-900/40 backdrop-blur-sm p-6">
        <div className="flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse"></div>
          <p className="text-center text-gray-400 font-medium">Loading leaderboard...</p>
        </div>
      </Card>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <Card className="bg-black/90 border-2 border-red-900/40 backdrop-blur-sm p-6 text-center">
        <div className="py-4">
          <div className="text-5xl font-black text-racing-red/20 mb-2">🏁</div>
          <p className="text-gray-400 font-bold">No scores yet</p>
          <p className="text-gray-600 text-sm mt-1">Be the first to set a time!</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/90 border-2 border-red-900/40 hover:border-racing-red/60 transition-all backdrop-blur-sm p-4 sm:p-6">
      {/* Header with racing stripe */}
      <div className="mb-4 pb-3 border-b-2 border-racing-red/20">
        <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          <div className="w-1 h-6 bg-racing-red"></div>
          Top 5 Drivers
        </h2>
      </div>

      <div className="space-y-2">
        {leaderboard.map((entry, index) => (
          <div
            key={`${entry.userId}-${entry.completedAt}`}
            onClick={() => navigate(`/user/${entry.userId}`)}
            className={`
              relative overflow-hidden group cursor-pointer
              bg-gradient-to-r from-black/50 to-black/30
              border-2 transition-all duration-200
              ${entry.rank === 1 ? 'border-yellow-500/40 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20' : ''}
              ${entry.rank === 2 ? 'border-gray-400/40 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-400/20' : ''}
              ${entry.rank === 3 ? 'border-orange-500/40 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/20' : ''}
              ${entry.rank && entry.rank > 3 ? 'border-red-900/40 hover:border-racing-red hover:shadow-lg hover:shadow-racing-red/20' : ''}
              rounded-lg
            `}
          >
            {/* Racing stripe effect */}
            <div className={`
              absolute left-0 top-0 bottom-0 w-1
              ${entry.rank === 1 ? 'bg-yellow-500' : ''}
              ${entry.rank === 2 ? 'bg-gray-400' : ''}
              ${entry.rank === 3 ? 'bg-orange-500' : ''}
              ${entry.rank && entry.rank > 3 ? 'bg-racing-red/60' : ''}
            `}></div>

            <div className="flex items-center gap-3 p-3 pl-4">
              {/* User Info */}
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/80 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-red-900/60 group-hover:ring-racing-red transition-all">
                  {entry.userAvatar ? (
                    <img src={entry.userAvatar} alt={entry.userName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm sm:text-base font-black text-racing-red">{entry.userName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span className="font-bold text-sm sm:text-base text-gray-200 truncate group-hover:text-white transition-colors">{entry.userName}</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <div className="text-right bg-black/40 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded border border-racing-red/20">
                  <div className="text-xs sm:text-sm font-black text-white">{entry.score}<span className="text-gray-500 text-2xs sm:text-xs">/26</span></div>
                  <div className="text-2xs sm:text-xs text-gray-400 font-bold">{formatTime(entry.timeUsed)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
