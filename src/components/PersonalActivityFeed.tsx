import { useEffect, useState } from "react";
import { getUserRaceLogs, getPublicRaceLogs, RaceLog } from "@/services/raceLogs";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Star, Heart } from "lucide-react";
import { toggleLike } from "@/services/likes";
import { useToast } from "@/hooks/use-toast";
import { getBlockedUsers } from "@/services/reports";
import { getUserProfile } from "@/services/auth";

export const PersonalActivityFeed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [communityLogs, setCommunityLogs] = useState<RaceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingLog, setLikingLog] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState<string>("");
  const [userNames, setUserNames] = useState<Map<string, string>>(new Map());

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

      // Get all public community logs (fetch MASSIVE pool for variety)
      const allCommunityLogs = await getPublicRaceLogs(1000);

      // Show all community reviews (no spoiler filter)
      // Just exclude user's own logs, blocked users, and only show reviews with written content
      const spoilerFreeLogs = allCommunityLogs.filter(log =>
        log.userId !== user.uid &&
        !blockedUserIds.includes(log.userId) &&
        log.review && log.review.trim().length > 0
      );

      // Twitter-style algorithm: Different candidates selected each time!
      // Use time-based random seed to ensure different selection each reload
      const now = Date.now();

      // Seeded random number generator using current timestamp
      let seed = now;
      const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      // Score each review with heavy random component (changes each reload)
      const scoredReviews = spoilerFreeLogs.map(log => {
        const engagementScore = (log.likesCount || 0) * 5;
        const ratingScore = log.rating * 3;

        // Time-based decay (newer content slightly preferred)
        const ageInDays = (now - log.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.max(0, 30 - ageInDays);

        // MASSIVE time-based random factor - changes every millisecond!
        const randomScore = seededRandom() * 500;

        const totalScore = engagementScore + ratingScore + recencyScore + randomScore;

        return { log, score: totalScore };
      });

      // Sort by score
      scoredReviews.sort((a, b) => b.score - a.score);

      // Apply diversity: max 3 per user
      const selectedReviews: RaceLog[] = [];
      const userFrequency = new Map<string, number>();
      const maxPerUser = 3;

      for (const item of scoredReviews) {
        const userCount = userFrequency.get(item.log.userId) || 0;

        if (userCount < maxPerUser) {
          selectedReviews.push(item.log);
          userFrequency.set(item.log.userId, userCount + 1);
        }

        if (selectedReviews.length >= 100) break;
      }

      // Fill remaining if needed
      if (selectedReviews.length < 100) {
        for (const item of scoredReviews) {
          if (!selectedReviews.includes(item.log)) {
            selectedReviews.push(item.log);
            if (selectedReviews.length >= 100) break;
          }
        }
      }

      // Add final randomization using current time
      const finalShuffle = [...selectedReviews].sort(() => {
        seed = (seed * 9301 + 49297) % 233280;
        return (seed / 233280) - 0.5;
      });

      setCommunityLogs(finalShuffle);

      // Fetch user display names for all users in the feed
      const uniqueUserIds = [...new Set(finalShuffle.map(log => log.userId))];
      const nameMap = new Map<string, string>();

      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          try {
            const profile = await getUserProfile(userId);
            if (profile?.name) {
              nameMap.set(userId, profile.name);
            }
          } catch (error) {
            console.error(`Failed to fetch profile for user ${userId}:`, error);
          }
        })
      );

      setUserNames(nameMap);
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
            className={`w-3 h-3 ${
              star <= rating
                ? 'fill-racing-red text-racing-red'
                : 'text-gray-800 fill-gray-800'
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
    const displayName = userNames.get(log.userId) || log.username;

    return (
    <div
      onClick={() => navigate(`/race/${log.raceYear}/${log.round || 1}`)}
      className="cursor-pointer border-b border-gray-800/50 hover:bg-white/[0.02] transition-all duration-200 px-4 py-3"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0 ring-1 ring-gray-800 hover:ring-gray-700 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/user/${log.userId}`);
          }}
        >
          {log.userAvatar ? (
            <img src={log.userAvatar} alt={log.username} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-black text-racing-red">{displayName.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header - Twitter style */}
          <div className="flex items-center gap-1 mb-0.5">
            <span
              className="font-bold text-white text-sm hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${log.userId}`);
              }}
            >
              {displayName}
            </span>
            <span className="text-gray-500 text-sm">@{log.username}</span>
          </div>

          {/* Race info */}
          <div className="mb-2">
            <div className="flex items-center gap-1.5 text-[13px] text-gray-400 mb-1.5">
              <span className="font-medium text-gray-300 truncate max-w-[200px]" title={log.raceName}>{log.raceName}</span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-500">{log.raceYear}</span>
            </div>
            <div className="flex items-center gap-1">
              {renderStars(log.rating)}
            </div>
          </div>

          {/* Review text */}
          {log.review && (
            <p className="text-sm leading-relaxed text-gray-100 mb-3 whitespace-pre-wrap">
              {log.review}
            </p>
          )}

          {/* Actions bar (Twitter-style) */}
          <div className="flex items-center gap-8 text-gray-600">
            <button
              className={`flex items-center gap-1.5 transition-all group ${
                isLiked ? 'text-racing-red' : 'hover:text-racing-red'
              }`}
              onClick={(e) => handleLike(log, e)}
              disabled={likingLog === log.id}
            >
              <div className={`p-1.5 rounded-full transition-all ${
                isLiked ? '' : 'group-hover:bg-racing-red/10'
              }`}>
                <Heart className={`w-[18px] h-[18px] transition-all ${
                  isLiked
                    ? 'fill-racing-red text-racing-red'
                    : 'group-hover:scale-110'
                }`} />
              </div>
              <span className={`text-[13px] ${isLiked ? 'text-racing-red font-semibold' : 'group-hover:text-racing-red'}`}>
                {log.likesCount > 0 ? log.likesCount : ''}
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
      <div className="bg-black border-y sm:border-x border-gray-800/60">
        <div className="p-8 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-racing-red rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (communityLogs.length === 0) {
    return (
      <div className="bg-black border-y sm:border-x border-gray-800/60">
        <div className="p-12 text-center">
          <p className="text-gray-500 text-sm mb-1">No reviews yet</p>
          <p className="text-gray-700 text-xs">Check back soon</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black border-y sm:border-x border-gray-800/60 overflow-hidden">
      {/* Feed Stream */}
      <div>
        {communityLogs.map((log) => (
          <FeedCard key={log.id} log={log} />
        ))}
      </div>
    </div>
  );
};
