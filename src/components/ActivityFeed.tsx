import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Heart, MessageCircle, List, UserPlus, Eye, Star, Gift } from 'lucide-react';
import { Activity } from '@/services/activity';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit as firestoreLimit, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getFollowing } from '@/services/follows';
import { StarRating } from './StarRating';
import { getBlockedUsers } from '@/services/reports';
import { toggleLike } from '@/services/likes';
import { useToast } from '@/hooks/use-toast';

interface ActivityFeedProps {
  feedType: 'following' | 'global';
  limit?: number;
  initialShow?: number;
}

// Racing team colors - subtle F1 team inspired backgrounds
const teamColors = [
  'from-red-900/80 to-red-950/90',        // Ferrari red (subtle)
  'from-blue-900/80 to-blue-950/90',      // Red Bull blue (subtle)
  'from-green-900/80 to-green-950/90',    // Aston Martin green (subtle)
  'from-orange-900/80 to-orange-950/90',  // McLaren orange (subtle)
  'from-pink-900/80 to-pink-950/90',      // Alpine pink (subtle)
  'from-cyan-900/80 to-cyan-950/90',      // Mercedes cyan (subtle)
  'from-purple-900/80 to-purple-950/90',  // Purple (subtle)
  'from-yellow-900/80 to-yellow-950/90',  // Renault yellow (subtle)
  'from-gray-700/80 to-gray-800/90',      // Haas gray (subtle)
];

// Generate consistent team color for user based on their ID
const getUserTeamColor = (userId: string) => {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return teamColors[Math.abs(hash) % teamColors.length];
};

// Global cache for user profiles to avoid refetching
const userProfileCache = new Map<string, { photoURL: string; name: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const ActivityFeed = ({ feedType, limit = 50, initialShow = 10 }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(initialShow);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [likedActivities, setLikedActivities] = useState<Set<string>>(new Set());
  const [likingActivity, setLikingActivity] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load blocked users
    const loadBlockedUsers = async () => {
      const blocked = await getBlockedUsers();
      setBlockedUsers(blocked);
    };
    loadBlockedUsers();
  }, []);

  useEffect(() => {
    console.log('[ActivityFeed] Setting up real-time listener, feedType:', feedType, 'limit:', limit);

    const setupListener = async () => {
      const activitiesCollection = collection(db, 'activities');

      if (feedType === 'global') {
        // Global feed - simple real-time listener
        const q = query(
          activitiesCollection,
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          console.log('[ActivityFeed] Real-time update: received', snapshot.docs.length, 'activities');

          // Collect all unique user IDs that need profile data
          const activitiesData = snapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data()
          }));

          const userIdsNeedingProfile = new Set<string>();
          const allUserIds = new Set<string>(); // Track all user IDs to check if they exist
          const now = Date.now();

          activitiesData.forEach(data => {
            if (data.userId) {
              allUserIds.add(data.userId); // Track all user IDs
              if (!data.userAvatar) {
                // Check cache first
                const cached = userProfileCache.get(data.userId);
                if (!cached || (now - cached.timestamp) > CACHE_DURATION) {
                  userIdsNeedingProfile.add(data.userId);
                }
              }
            }
          });

          // Fetch all needed user profiles in parallel (batch)
          const userProfilesMap = new Map<string, any>();
          const deletedUsers = new Set<string>(); // Track users that don't exist

          if (userIdsNeedingProfile.size > 0) {
            const profilePromises = Array.from(userIdsNeedingProfile).map(async (userId) => {
              try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  // Cache the result
                  userProfileCache.set(userId, {
                    photoURL: data.photoURL || '',
                    name: data.name || 'User',
                    timestamp: now
                  });
                  return { userId, data, exists: true };
                } else {
                  // User doesn't exist - mark for filtering
                  deletedUsers.add(userId);
                  return { userId, data: null, exists: false };
                }
              } catch (error) {
                console.error('[ActivityFeed] Error fetching user profile:', error);
              }
              return null;
            });

            const profileResults = await Promise.all(profilePromises);
            profileResults.forEach(result => {
              if (result && result.exists && result.data) {
                userProfilesMap.set(result.userId, result.data);
              }
            });
          }

          // Map activities with cached user data and filter out deleted users
          const activities = activitiesData
            .filter(data => !deletedUsers.has(data.userId)) // Filter out activities from deleted users
            .map(data => {
              let userAvatar = data.userAvatar || '';
              let username = data.username || 'User';

              // Use cached user profile data if available
              if (!userAvatar && data.userId) {
                // First check the newly fetched data
                const userData = userProfilesMap.get(data.userId);
                if (userData) {
                  userAvatar = userData.photoURL || '';
                  username = userData.name || username;
                } else {
                  // Fall back to cache
                  const cached = userProfileCache.get(data.userId);
                  if (cached) {
                    userAvatar = cached.photoURL;
                    username = cached.name;
                  }
                }
              }

              return {
                ...data,
                username,
                userAvatar,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
              } as Activity;
            });

          // Log the first few activities to verify ordering
          console.log('[ActivityFeed] First 3 activities:', activities.slice(0, 3).map(a => ({
            id: a.id,
            type: a.type,
            raceName: a.raceName,
            raceYear: a.raceYear,
            round: a.round,
            content: a.content?.substring(0, 30),
            createdAt: a.createdAt
          })));

          setActivities(activities);
          setLoading(false);
        }, (error) => {
          console.error('[ActivityFeed] Real-time listener error:', error);
          setLoading(false);
        });

        return unsubscribe;
      } else {
        // Following feed - fetch all activities then filter client-side
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return () => {};
        }

        const following = await getFollowing(user.uid);
        console.log('[ActivityFeed] Following data:', following);

        // The getFollowing function returns user objects with 'id' field
        const followingIds = following.map(f => f.id).filter(id => id !== undefined && id !== null);
        console.log('[ActivityFeed] Extracted following IDs:', followingIds);

        if (followingIds.length === 0) {
          console.log('[ActivityFeed] No following IDs found');
          setActivities([]);
          setLoading(false);
          return () => {};
        }

        // Fetch all activities and filter client-side
        const q = query(
          activitiesCollection,
          orderBy('createdAt', 'desc'),
          firestoreLimit(500) // Fetch more to ensure we get enough from followed users
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          console.log('[ActivityFeed] Real-time update: received', snapshot.docs.length, 'total activities');

          // Collect all activities data
          const allActivitiesData = snapshot.docs.map(docSnapshot => ({
            id: docSnapshot.id,
            ...docSnapshot.data()
          }));

          // Filter to only show activities from followed users first
          const followingActivitiesData = allActivitiesData.filter(data =>
            followingIds.includes(data.userId)
          );

          // Collect unique user IDs that need profile data (only for filtered activities)
          const userIdsNeedingProfile = new Set<string>();
          const allUserIds = new Set<string>(); // Track all user IDs to check if they exist
          const now = Date.now();

          followingActivitiesData.forEach(data => {
            if (data.userId) {
              allUserIds.add(data.userId); // Track all user IDs
              if (!data.userAvatar) {
                // Check cache first
                const cached = userProfileCache.get(data.userId);
                if (!cached || (now - cached.timestamp) > CACHE_DURATION) {
                  userIdsNeedingProfile.add(data.userId);
                }
              }
            }
          });

          // Fetch all needed user profiles in parallel (batch)
          const userProfilesMap = new Map<string, any>();
          const deletedUsers = new Set<string>(); // Track users that don't exist

          if (userIdsNeedingProfile.size > 0) {
            const profilePromises = Array.from(userIdsNeedingProfile).map(async (userId) => {
              try {
                const userDoc = await getDoc(doc(db, 'users', userId));
                if (userDoc.exists()) {
                  const data = userDoc.data();
                  // Cache the result
                  userProfileCache.set(userId, {
                    photoURL: data.photoURL || '',
                    name: data.name || 'User',
                    timestamp: now
                  });
                  return { userId, data, exists: true };
                } else {
                  // User doesn't exist - mark for filtering
                  deletedUsers.add(userId);
                  return { userId, data: null, exists: false };
                }
              } catch (error) {
                console.error('[ActivityFeed] Error fetching user profile:', error);
              }
              return null;
            });

            const profileResults = await Promise.all(profilePromises);
            profileResults.forEach(result => {
              if (result && result.exists && result.data) {
                userProfilesMap.set(result.userId, result.data);
              }
            });
          }

          // Map filtered activities with cached user data and filter out deleted users
          const followingActivities = followingActivitiesData
            .filter(data => !deletedUsers.has(data.userId)) // Filter out activities from deleted users
            .map(data => {
              let userAvatar = data.userAvatar || '';
              let username = data.username || 'User';

              // Use cached user profile data if available
              if (!userAvatar && data.userId) {
                // First check the newly fetched data
                const userData = userProfilesMap.get(data.userId);
                if (userData) {
                  userAvatar = userData.photoURL || '';
                  username = userData.name || username;
                } else {
                  // Fall back to cache
                  const cached = userProfileCache.get(data.userId);
                  if (cached) {
                    userAvatar = cached.photoURL;
                    username = cached.name;
                  }
                }
              }

              return {
                ...data,
                username,
                userAvatar,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
              } as Activity;
            });

          console.log('[ActivityFeed] Filtered to', followingActivities.length, 'activities from', followingIds.length, 'followed users');
          console.log('[ActivityFeed] Following IDs:', followingIds);
          console.log('[ActivityFeed] Sample activity userIds:', followingActivities.slice(0, 5).map(a => a.userId));

          setActivities(followingActivities.slice(0, limit));
          setLoading(false);
        }, (error) => {
          console.error('[ActivityFeed] Real-time listener error:', error);
          setLoading(false);
        });

        return unsubscribe;
      }
    };

    let unsubscribe: (() => void) | undefined;
    setupListener().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        console.log('[ActivityFeed] Cleaning up real-time listener');
        unsubscribe();
      }
    };
  }, [feedType, limit]);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'log':
        return <Eye className="w-4 h-4" />;
      case 'review':
        return <MessageCircle className="w-4 h-4" />;
      case 'like':
        return <Heart className="w-4 h-4 fill-racing-red text-racing-red" />;
      case 'list':
        return <List className="w-4 h-4" />;
      case 'follow':
        return <UserPlus className="w-4 h-4" />;
      case 'prediction':
        return <span className="text-sm">🏎️</span>;
      case 'secretSanta':
        return <Gift className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'log':
        return 'logged';
      case 'review':
        return 'reviewed';
      case 'like':
        return 'liked';
      case 'list':
        return 'added to a list';
      case 'follow':
        return 'followed';
      case 'prediction':
        // Keep the prediction text but remove the race name at the end
        if (activity.content) {
          // Match patterns like "will win [raceName]" or "for [raceName]"
          // Keep everything up to and including "will win" or "to"
          if (activity.content.includes(' will win ')) {
            const parts = activity.content.split(' will win ');
            return parts[0] + ' will win';
          } else if (activity.content.includes(' for ')) {
            const parts = activity.content.split(' for ');
            return parts[0];
          }
          return activity.content;
        }
        return 'made a prediction';
      case 'secretSanta':
        return activity.content || 'participated in Secret Santa';
    }
  };

  const getActivityLink = (activity: Activity) => {
    switch (activity.targetType) {
      case 'raceLog':
        // Link to race detail page by year/round if available
        if (activity.raceYear && activity.round) {
          // Include highlight parameter for reviews to scroll to the specific review
          if (activity.type === 'review' && activity.targetId) {
            return `/race/${activity.raceYear}/${activity.round}?highlight=${activity.targetId}`;
          }
          return `/race/${activity.raceYear}/${activity.round}`;
        }
        // Fallback to race log ID if no year/round
        if (activity.targetId) {
          return `/race/${activity.targetId}`;
        }
        return '#';
      case 'seasonRating':
        // Link to Explore page with season filter
        if (activity.raceYear) {
          return `/explore?season=${activity.raceYear}`;
        }
        return '/explore';
      case 'list':
        return `/list/${activity.targetId}`;
      case 'user':
        return `/user/${activity.targetId}`;
      case 'prediction':
        // Link to race detail page for prediction
        if (activity.raceYear && activity.round) {
          return `/race/${activity.raceYear}/${activity.round}`;
        }
        return '#';
      case 'secretSantaGift':
        return `/secret-santa/gift/${activity.targetId}`;
      default:
        return '#';
    }
  };

  const handleLike = async (activity: Activity, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like race logs",
        variant: "destructive"
      });
      return;
    }

    if (!activity.targetId) return;

    setLikingActivity(activity.targetId);

    try {
      await toggleLike(activity.targetId);

      // Toggle liked state
      setLikedActivities(prev => {
        const newSet = new Set(prev);
        if (newSet.has(activity.targetId!)) {
          newSet.delete(activity.targetId!);
        } else {
          newSet.add(activity.targetId!);
        }
        return newSet;
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to like race log",
        variant: "destructive"
      });
    } finally {
      setLikingActivity(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-2 text-gray-400">
          <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
          <span className="text-sm">Loading activity...</span>
        </div>
      </div>
    );
  }

  // Filter out blocked users
  const filteredActivities = activities.filter(activity => !blockedUsers.includes(activity.userId));

  if (filteredActivities.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="max-w-md mx-auto space-y-3">
          <div className="text-4xl">🏁</div>
          <h3 className="text-lg font-semibold text-white">
            {feedType === 'following' ? 'No Activity Yet' : 'No Activity Yet'}
          </h3>
          <p className="text-sm text-gray-400">
            {feedType === 'following'
              ? 'Follow users to see their race logs, reviews, and lists.'
              : 'Be the first to log a race and start the conversation!'}
          </p>
        </div>
      </div>
    );
  }

  const displayedActivities = filteredActivities.slice(0, showCount);
  const hasMore = filteredActivities.length > showCount;

  return (
    <div className="space-y-0 max-w-2xl mx-auto">
      {displayedActivities.map((activity) => (
        <div key={activity.id} className="group border-b border-gray-800/50 hover:bg-white/[0.02] transition-all duration-200 cursor-pointer">
          <div className="p-4">
            <div className="flex gap-3">
              {/* Avatar Section */}
              <Link to={`/user/${activity.userId}`} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden ring-1 ring-gray-800 hover:ring-gray-700 transition-all">
                  {activity.userAvatar ? (
                    <img
                      src={activity.userAvatar}
                      alt={activity.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-black text-racing-red">
                      {activity.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </Link>

              <div className="flex-1 min-w-0 space-y-2">
                {/* Header - Twitter style action line */}
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap text-sm leading-snug mb-1">
                    <Link
                      to={`/user/${activity.userId}`}
                      className="font-bold text-white hover:underline"
                    >
                      {activity.username}
                    </Link>
                    <span className="text-gray-400">{getActivityText(activity)}</span>
                    {activity.targetType === 'seasonRating' && activity.raceYear ? (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-medium text-racing-red hover:underline"
                      >
                        {activity.raceYear} Season
                      </Link>
                    ) : activity.targetType === 'raceLog' && (activity.raceName || activity.raceYear) ? (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-medium text-racing-red hover:underline truncate max-w-[200px]"
                        title={activity.raceName}
                      >
                        {activity.raceName || 'a race'}
                      </Link>
                    ) : activity.targetType === 'raceLog' ? (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-medium text-racing-red hover:underline"
                      >
                        a race
                      </Link>
                    ) : null}
                    {activity.targetType === 'list' && (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-medium text-racing-red hover:underline"
                      >
                        a list
                      </Link>
                    )}
                    {activity.targetType === 'user' && activity.type === 'follow' && (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-medium text-racing-red hover:underline"
                      >
                        {activity.content || 'a user'}
                      </Link>
                    )}
                    {activity.targetType === 'prediction' && activity.raceName && (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-medium text-racing-red hover:underline"
                      >
                        {activity.raceName}
                      </Link>
                    )}
                    {activity.targetType === 'secretSantaGift' && activity.assignedDriver && (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-medium text-racing-red hover:underline"
                      >
                        view gift
                      </Link>
                    )}
                    {activity.rating && activity.rating > 0 && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < activity.rating!
                                ? 'fill-racing-red text-racing-red'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    {/* We Got You Yuki tribute badge */}
                    {activity.weGotYouYuki && (
                      <span className="text-xs text-gray-400">
                        ,{' '}
                        <span className="font-bold text-racing-red">paid tribute to Yuki Tsunoda</span>
                      </span>
                    )}
                  </div>

                  {/* Timestamp - Twitter style subtle */}
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <span>
                      {new Date(activity.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Review/Content - Simple text */}
                {activity.content && activity.type === 'review' && (
                  <div>
                    <p className="text-sm leading-relaxed text-gray-100 mb-3 whitespace-pre-wrap">
                      {activity.content}
                    </p>
                  </div>
                )}

                {/* Simple content for non-reviews */}
                {activity.content && activity.type !== 'review' && activity.type !== 'secretSanta' && (
                  <p className="text-sm text-gray-400 italic leading-relaxed">
                    {activity.content}
                  </p>
                )}

                {/* Secret Santa Gift Display */}
                {activity.type === 'secretSanta' && activity.giftImageUrl && activity.giftTitle && (
                  <Link to={getActivityLink(activity)} className="block">
                    <div className="rounded-lg border border-gray-800/50 overflow-hidden hover:border-gray-700 transition-colors">
                      <div className="aspect-video relative overflow-hidden">
                        <img
                          src={activity.giftImageUrl}
                          alt={activity.giftTitle}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://via.placeholder.com/600x400?text=Gift';
                          }}
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-bold text-white mb-1">
                          {activity.giftTitle}
                        </p>
                        {activity.assignedDriver && (
                          <p className="text-xs text-gray-400">
                            for {activity.assignedDriver}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center border-t border-gray-800/50">
          <Button
            variant="ghost"
            onClick={() => setShowCount(prev => prev + 10)}
            className="w-full text-racing-red hover:bg-white/[0.02] py-6 font-semibold"
          >
            Show more
          </Button>
        </div>
      )}
    </div>
  );
};
