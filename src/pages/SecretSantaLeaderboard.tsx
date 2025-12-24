import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard, SecretSantaSubmission } from '@/services/secretSanta';
import { Trophy, Medal, Award, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const SecretSantaLeaderboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topSubmissions, setTopSubmissions] = useState<SecretSantaSubmission[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await getLeaderboard(50);
      setTopSubmissions(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Award className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-600 to-yellow-400';
    if (index === 1) return 'bg-gradient-to-r from-gray-600 to-gray-400';
    if (index === 2) return 'bg-gradient-to-r from-orange-600 to-orange-400';
    return 'bg-gray-800';
  };

  const LeaderboardCard = ({ submission, index }: { submission: SecretSantaSubmission; index: number }) => {
    const isTopThree = index < 3;

    return (
      <div
        onClick={() => navigate(`/secret-santa/gift/${submission.id}`)}
        className={`cursor-pointer transition-all ${
          isTopThree
            ? 'bg-gradient-to-br from-gray-900 to-black border-2 border-racing-red'
            : 'bg-gray-900 border border-gray-800 hover:border-racing-red'
        } rounded-xl p-4 sm:p-6`}
      >
        <div className="flex gap-4">
          {/* Rank */}
          <div className="flex-shrink-0">
            <div className={`${getRankBadge(index)} w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center`}>
              {getRankIcon(index) || (
                <span className="text-white font-black text-xl sm:text-2xl">
                  #{index + 1}
                </span>
              )}
            </div>
          </div>

          {/* Gift Image */}
          <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-black">
            <img
              src={submission.giftImageUrl}
              alt={submission.giftTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Gift';
              }}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-base sm:text-lg mb-1 line-clamp-1">
              {submission.giftTitle}
            </h3>

            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs sm:text-sm text-gray-400">For</span>
              <span className="text-xs sm:text-sm font-bold text-racing-red">
                {submission.assignedDriver}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 mb-3">
              {submission.giftDescription}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {submission.userAvatar && (
                  <img
                    src={submission.userAvatar}
                    alt={submission.userName}
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
                  />
                )}
                <span className="text-xs sm:text-sm text-gray-500">{submission.userName}</span>
              </div>

              <div className="bg-racing-red/20 rounded-full px-3 py-1 flex items-center gap-1">
                <span className="text-racing-red font-black text-sm sm:text-base">
                  {submission.likes}
                </span>
                <span className="text-racing-red text-xs">likes</span>
              </div>

              <div className="bg-gray-800 rounded-full px-2 py-1">
                <span className="text-gray-400 text-xs">
                  {submission.priceRange}
                </span>
              </div>
            </div>
          </div>
        </div>

        {isTopThree && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-1">Why this gift?</p>
            <p className="text-sm text-gray-300 italic line-clamp-2">
              "{submission.reasoning}"
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse"></div>
          <p className="text-gray-400 text-sm">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-yellow-600/20 to-black border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
          <button
            onClick={() => navigate('/secret-santa/gallery')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Gallery</span>
          </button>

          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400" />
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white mb-3">
              Top Gifts
            </h1>

            <p className="text-base sm:text-lg text-gray-400">
              The most loved Secret Santa gifts of 2026
            </p>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {topSubmissions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 font-bold mb-2">No submissions yet</p>
            <p className="text-gray-600 text-sm mb-4">Be the first to submit a gift!</p>
            <Button
              onClick={() => navigate('/secret-santa')}
              className="bg-racing-red hover:bg-racing-red/90 text-white"
            >
              Get Started
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {topSubmissions.map((submission, index) => (
              <LeaderboardCard key={submission.id} submission={submission} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
