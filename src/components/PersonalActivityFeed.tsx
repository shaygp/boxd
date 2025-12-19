import { useEffect, useState } from "react";
import { getUserRaceLogs, getPublicRaceLogs, RaceLog } from "@/services/raceLogs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toggleLike } from "@/services/likes";
import { useToast } from "@/hooks/use-toast";
import { getBlockedUsers } from "@/services/reports";

export const PersonalActivityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [communityLogs, setCommunityLogs] = useState<RaceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingLog, setLikingLog] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    loadCommunityActivity();
  }, [user]);

  // Reload feed when window regains focus (like Twitter)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadCommunityActivity();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // Reload feed when user navigates back to home (like Twitter)
  useEffect(() => {
    if (location.pathname === '/home' && lastPath !== '/home' && lastPath !== '') {
      // User just navigated back to home from another page
      console.log('[Feed] User returned to home, reloading feed...');
      loadCommunityActivity();
    }
    setLastPath(location.pathname);
  }, [location.pathname]);

  const loadCommunityActivity = async () => {
    if (!user) return;

    try {
      // Get blocked users list (includes globally blocked users)
      const blockedUserIds = await getBlockedUsers();

      // Get user's watched races to prevent spoilers
      const userLogs = await getUserRaceLogs(user.uid);
      const watchedRaces = new Set(
        userLogs.map(log => `${log.raceYear}-${log.raceName}`)
      );

      // Get all public community logs (fetch a lot more)
      const allCommunityLogs = await getPublicRaceLogs(200);

      // Filter to only show logs for races the user has already watched
      // exclude the user's own logs, blocked users, and only show reviews with written content
      const spoilerFreeLogs = allCommunityLogs.filter(log =>
        log.userId !== user.uid &&
        !blockedUserIds.includes(log.userId) &&
        watchedRaces.has(`${log.raceYear}-${log.raceName}`) &&
        log.review && log.review.trim().length > 0
      );

      // Twitter-style "For You" algorithm
      // Mix of engagement, recency, and HEAVY randomness for variety
      const now = Date.now();

      // Calculate relevance score for each log (Twitter-style)
      const scoredLogs = spoilerFreeLogs.map(log => {
        // Engagement score (likes count heavily)
        const engagementScore = (log.likesCount || 0) * 10;

        // Recency score (newer content gets boost)
        const ageInHours = (now - log.createdAt.getTime()) / (1000 * 60 * 60);
        const recencyScore = Math.max(0, 100 - ageInHours); // Decay over time

        // Rating bonus (high ratings = quality content)
        const ratingScore = log.rating * 5;

        // Review length bonus (longer reviews = more effort)
        const reviewLength = log.review?.length || 0;
        const contentScore = Math.min(reviewLength / 10, 50); // Cap at 50

        // STRONG random factor for maximum variety on each reload
        const randomness = Math.random() * 200; // Increased from 30 to 200!

        // Combined score
        const totalScore = engagementScore + recencyScore + ratingScore + contentScore + randomness;

        return { log, score: totalScore };
      });

      // Sort by score (highest first)
      scoredLogs.sort((a, b) => b.score - a.score);

      // Apply diversity: prevent same user from dominating feed
      const diversifiedFeed: typeof scoredLogs = [];
      const userFrequency = new Map<string, number>();
      const maxPerUser = 3; // Max 3 reviews per user in top 100

      for (const item of scoredLogs) {
        const userCount = userFrequency.get(item.log.userId) || 0;

        if (userCount < maxPerUser) {
          diversifiedFeed.push(item);
          userFrequency.set(item.log.userId, userCount + 1);
        }

        if (diversifiedFeed.length >= 100) break;
      }

      // If we don't have enough, add remaining items
      if (diversifiedFeed.length < 100) {
        for (const item of scoredLogs) {
          if (!diversifiedFeed.includes(item)) {
            diversifiedFeed.push(item);
            if (diversifiedFeed.length >= 100) break;
          }
        }
      }

      // Extract logs and apply aggressive shuffling
      const finalFeed = diversifiedFeed.map(item => item.log);

      // Fisher-Yates shuffle the ENTIRE feed for maximum variety
      for (let i = finalFeed.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [finalFeed[i], finalFeed[j]] = [finalFeed[j], finalFeed[i]];
      }

      setCommunityLogs(finalFeed);
    } catch (error) {
      console.error('Error loading community activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-3.5 h-3.5 ${
              star <= rating
                ? 'fill-racing-red text-racing-red'
                : 'text-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };

  const handleLike = async (log: RaceLog, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user || !log.id) return;

    setLikingLog(log.id);

    try {
      await toggleLike(log.id);

      // Update local state
      setCommunityLogs(prev => prev.map(l => {
        if (l.id === log.id) {
          const isLiked = l.likedBy?.includes(user.uid);
          return {
            ...l,
            likesCount: isLiked ? l.likesCount - 1 : l.likesCount + 1,
            likedBy: isLiked
              ? l.likedBy.filter(id => id !== user.uid)
              : [...(l.likedBy || []), user.uid]
          };
        }
        return l;
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to like review",
        variant: "destructive"
      });
    } finally {
      setLikingLog(null);
    }
  };

  const FeedCard = ({ log }: { log: RaceLog }) => {
    const isLiked = log.likedBy?.includes(user?.uid || '');

    return (
    <div
      onClick={() => navigate(`/race/${log.raceYear}/${log.round || 1}`)}
      className="cursor-pointer border-b border-gray-800 hover:bg-gray-900/30 transition-colors p-4"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/${log.userId}`);
          }}
        >
          {log.userAvatar ? (
            <img src={log.userAvatar} alt={log.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-base font-black text-racing-red">{log.username.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-bold text-white hover:underline text-sm sm:text-base"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${log.userId}`);
                }}
              >
                {log.username}
              </span>
              <span className="text-gray-500 text-xs sm:text-sm">
                · {formatDistanceToNow(log.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Race info */}
          <div className="mb-2">
            <h3 className="font-bold text-white text-sm sm:text-base mb-1">
              {log.raceName}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>{log.raceLocation}</span>
              <span>•</span>
              <span>{log.raceYear}</span>
              <span>•</span>
              {renderStars(log.rating)}
            </div>
          </div>

          {/* Review text */}
          {log.review && (
            <p className="text-sm sm:text-base text-gray-200 mb-3 whitespace-pre-wrap">
              {log.review}
            </p>
          )}

          {/* Actions bar (Twitter-style) */}
          <div className="flex items-center gap-6 text-gray-500 text-xs sm:text-sm">
            <button
              className={`flex items-center gap-1.5 transition-colors group ${
                isLiked ? 'text-racing-red' : 'hover:text-racing-red'
              }`}
              onClick={(e) => handleLike(log, e)}
              disabled={likingLog === log.id}
            >
              <Heart className={`w-4 h-4 transition-all ${
                isLiked
                  ? 'fill-racing-red text-racing-red scale-110'
                  : 'group-hover:fill-racing-red/10 group-hover:scale-110'
              }`} />
              <span className={isLiked ? 'text-racing-red font-bold' : ''}>
                {log.likesCount || 0}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-black/90 border-y sm:border-2 border-gray-800 sm:rounded-xl">
        <div className="p-6 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse"></div>
          <p className="text-gray-400 text-sm">Loading feed...</p>
        </div>
      </div>
    );
  }

  if (communityLogs.length === 0) {
    return (
      <div className="bg-black/90 border-y sm:border-2 border-gray-800 sm:rounded-xl">
        <div className="p-8 text-center">
          <div className="text-5xl mb-3">🏁</div>
          <p className="text-gray-400 font-bold mb-1">No community activity yet</p>
          <p className="text-gray-600 text-sm">Log races to discover what others are saying!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/90 border-y sm:border-x border-gray-800 overflow-hidden">
      {/* Header - Twitter style */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-black/80 border-b border-gray-800 px-4 py-3">
        <h2 className="text-lg sm:text-xl font-bold text-white">Home</h2>
      </div>

      {/* Feed Stream */}
      <div className="divide-y divide-gray-800">
        {communityLogs.map((log) => (
          <FeedCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
};
