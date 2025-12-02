import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Heart, MessageCircle, List, UserPlus, Eye, Star, ArrowRight } from 'lucide-react';
import { Activity } from '@/services/activity';
import { Link } from 'react-router-dom';
import { collection, query, orderBy, limit as firestoreLimit, onSnapshot, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { getFollowing } from '@/services/follows';
import { StarRating } from './StarRating';

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

export const ActivityFeed = ({ feedType, limit = 50, initialShow = 10 }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(initialShow);

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

          // Fetch user profiles for activities
          const activities = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data();
              let userAvatar = data.userAvatar || '';
              let username = data.username || 'User';

              // If userAvatar is missing, fetch from users collection
              if (!userAvatar && data.userId) {
                try {
                  const userDoc = await getDoc(doc(db, 'users', data.userId));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userAvatar = userData.photoURL || '';
                    username = userData.name || username;
                  }
                } catch (error) {
                  console.error('[ActivityFeed] Error fetching user profile:', error);
                }
              }

              const activity = {
                id: docSnapshot.id,
                ...data,
                username,
                userAvatar,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
              } as Activity;

              return activity;
            })
          );

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
        // Following feed - need to get following list first
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return () => {};
        }

        const following = await getFollowing(user.uid);
        const followingIds = following.map(f => f.followingId).filter(id => id !== undefined && id !== null);

        if (followingIds.length === 0) {
          setActivities([]);
          setLoading(false);
          return () => {};
        }

        // Use first 10 following IDs (Firestore 'in' limit)
        const batch = followingIds.slice(0, 10);
        const q = query(
          activitiesCollection,
          where('userId', 'in', batch),
          orderBy('createdAt', 'desc'),
          firestoreLimit(limit)
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          console.log('[ActivityFeed] Real-time update: received', snapshot.docs.length, 'activities');

          const activities = await Promise.all(
            snapshot.docs.map(async (docSnapshot) => {
              const data = docSnapshot.data();
              let userAvatar = data.userAvatar || '';
              let username = data.username || 'User';

              if (!userAvatar && data.userId) {
                try {
                  const userDoc = await getDoc(doc(db, 'users', data.userId));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    userAvatar = userData.photoURL || '';
                    username = userData.name || username;
                  }
                } catch (error) {
                  console.error('[ActivityFeed] Error fetching user profile:', error);
                }
              }

              return {
                id: docSnapshot.id,
                ...data,
                username,
                userAvatar,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
              } as Activity;
            })
          );

          setActivities(activities);
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
    }
  };

  const getActivityLink = (activity: Activity) => {
    switch (activity.targetType) {
      case 'raceLog':
        // Link to race detail page by year/round if available
        if (activity.raceYear && activity.round) {
          return `/race/${activity.raceYear}/${activity.round}`;
        }
        // Fallback to race log ID if no year/round
        if (activity.targetId) {
          return `/race/${activity.targetId}`;
        }
        return '#';
      case 'list':
        return `/list/${activity.targetId}`;
      case 'user':
        return `/user/${activity.targetId}`;
      default:
        return '#';
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

  if (activities.length === 0) {
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

  const displayedActivities = activities.slice(0, showCount);
  const hasMore = activities.length > showCount;

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 max-w-3xl mx-auto px-3 sm:px-4">
      {displayedActivities.map((activity) => (
        <Card key={activity.id} className="group bg-black/90 border-2 border-red-900/40 hover:border-racing-red transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-red-500/30">
          {/* Racing accent line */}
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

          <div className="p-3 sm:p-4 md:p-5 lg:p-6">
            <div className="flex gap-2.5 sm:gap-3 md:gap-4">
              {/* Avatar Section */}
              <Link to={`/user/${activity.userId}`} className="flex-shrink-0 group/avatar">
                <div className="relative">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${activity.userAvatar ? 'from-gray-800 to-gray-900' : getUserTeamColor(activity.userId)} flex items-center justify-center border-2 border-gray-700 group-hover/avatar:border-racing-red transition-all duration-300 overflow-hidden ring-2 ring-black/50`}>
                    {activity.userAvatar ? (
                      <img
                        src={activity.userAvatar}
                        alt={activity.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-base sm:text-lg md:text-xl font-black text-white drop-shadow-lg uppercase">
                        {activity.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Activity type badge - Letterboxd style */}
                  <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-racing-red border-2 border-black flex items-center justify-center shadow-lg">
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                </div>
              </Link>

              <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5 md:space-y-3">
                {/* Header - Letterboxd style action line */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm md:text-base leading-snug">
                    <Link
                      to={`/user/${activity.userId}`}
                      className="font-bold text-white hover:text-racing-red transition-colors"
                    >
                      {activity.username}
                    </Link>
                    <span className="text-gray-400">{getActivityText(activity)}</span>
                    {activity.targetType === 'raceLog' && (activity.raceName || activity.raceYear) ? (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-semibold text-racing-red hover:underline decoration-2 underline-offset-2"
                      >
                        {activity.raceName || 'a race'}
                      </Link>
                    ) : activity.targetType === 'raceLog' ? (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-semibold text-racing-red hover:underline decoration-2 underline-offset-2"
                      >
                        a race
                      </Link>
                    ) : null}
                    {activity.targetType === 'list' && (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-semibold text-racing-red hover:underline decoration-2 underline-offset-2"
                      >
                        a list
                      </Link>
                    )}
                    {activity.targetType === 'user' && activity.type === 'follow' && (
                      <Link
                        to={getActivityLink(activity)}
                        className="font-semibold text-racing-red hover:underline decoration-2 underline-offset-2"
                      >
                        {activity.content || 'a user'}
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
                  </div>

                  {/* Timestamp and race metadata - Letterboxd style subtle */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span>
                      {new Date(activity.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: new Date(activity.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </span>
                    <span className="text-gray-700">•</span>
                    <span>
                      {new Date(activity.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {activity.raceYear && (
                      <>
                        <span className="text-gray-700">•</span>
                        <span>{activity.raceYear}</span>
                      </>
                    )}
                    {activity.raceLocation && (
                      <>
                        <span className="text-gray-700">•</span>
                        <span>{activity.raceLocation}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Review/Content - Letterboxd style with better typography */}
                {activity.content && activity.type === 'review' && (
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="bg-black/40 rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-800/50">
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-200 line-clamp-3 sm:line-clamp-4">
                        {activity.content}
                      </p>
                    </div>
                    <Link
                      to={getActivityLink(activity)}
                      className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-gray-400 hover:text-racing-red transition-colors font-medium"
                    >
                      Read more
                      <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </Link>
                  </div>
                )}

                {/* Simple content for non-reviews */}
                {activity.content && activity.type !== 'review' && (
                  <p className="text-xs sm:text-sm text-gray-400 italic leading-relaxed">
                    {activity.content}
                  </p>
                )}

                {/* Interaction bar - Letterboxd style - Links to full activity page */}
                {activity.targetType === 'raceLog' && (
                  <div className="flex items-center gap-4 pt-2 border-t border-gray-800/50">
                    <Link
                      to={getActivityLink(activity)}
                      className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-racing-red transition-colors"
                    >
                      <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Like</span>
                    </Link>
                    <Link
                      to={getActivityLink(activity)}
                      className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-racing-red transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Comment</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button
            variant="outline"
            onClick={() => setShowCount(prev => prev + 10)}
            className="w-full sm:w-auto bg-black/80 border border-gray-700 text-gray-300 hover:bg-racing-red hover:text-white hover:border-racing-red transition-all duration-300 font-semibold px-8"
          >
            Load More ({activities.length - showCount} remaining)
          </Button>
        </div>
      )}

      {!hasMore && activities.length > initialShow && (
        <div className="text-center pt-6 text-sm text-gray-500">
          Showing all {activities.length} activities
        </div>
      )}
    </div>
  );
};
