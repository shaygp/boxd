import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/RaceCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { CreateListDialog } from "@/components/CreateListDialog";
import { LogRaceDialog } from "@/components/LogRaceDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, UserMinus, Settings, Heart, List, Calendar, Star, Users, Eye, MessageCircle, Plus, ArrowRight, Ban, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getUserProfile, getUserRaceLogs, calculateTotalHoursWatched } from "@/services/raceLogs";
import { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from "@/services/follows";
import { getUserLists } from "@/services/lists";
import { getCountryCodeFromGPName } from "@/services/f1Api";
import { getUserWatchlist } from "@/services/watchlist";
import { collection, query, where, getDocs } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { useAuth } from "@/contexts/AuthContext";
import { blockUser, unblockUser, isUserBlocked } from "@/services/reports";

const Profile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    racesWatched: 0,
    hoursSpent: 0,
    reviews: 0,
    lists: 0,
    followers: 0,
    following: 0,
  });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followingUser, setFollowingUser] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [statsDoc, setStatsDoc] = useState<any>(null);
  const [lists, setLists] = useState<any[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [fullLogs, setFullLogs] = useState<any[]>([]);
  const [reviewsToShow, setReviewsToShow] = useState(8);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [followersDialogOpen, setFollowersDialogOpen] = useState(false);
  const [followingDialogOpen, setFollowingDialogOpen] = useState(false);

  const targetUserId = userId || currentUser?.uid;
  const isOwnProfile = !userId || userId === currentUser?.uid;

  const loadProfile = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch profile, logs, and stats in parallel
      const [profileDoc, userLogs, userStatsDoc] = await Promise.all([
        getDoc(doc(db, 'users', targetUserId)),
        getUserRaceLogs(targetUserId),
        getDoc(doc(db, 'userStats', targetUserId))
      ]);

      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() });
      } else {
        setProfile({
          name: currentUser?.displayName || 'User',
          email: currentUser?.email,
          username: 'user',
          description: 'F1 fan',
        });
      }

      const hoursWatched = calculateTotalHoursWatched(userLogs);
      const reviewsCount = userLogs.filter(log => log.review && log.review.length > 0).length;

      // Store full logs with review content
      setFullLogs(userLogs);

      setStatsDoc(userStatsDoc);
      const statsData = userStatsDoc.exists() ? userStatsDoc.data() : {};

      setStats({
        racesWatched: userLogs.length,
        hoursSpent: Math.round(hoursWatched),
        reviews: reviewsCount,
        lists: statsData.listsCount || 0,
        followers: statsData.followersCount || 0,
        following: statsData.followingCount || 0,
      });

      setLogs(userLogs.map(log => ({
        id: log.id,
        season: log.raceYear,
        round: log.round || 1,
        gpName: log.raceName,
        circuit: log.raceLocation,
        date: log.dateWatched instanceof Date
          ? log.dateWatched.toISOString()
          : new Date(log.dateWatched).toISOString(),
        rating: log.rating,
        watched: true,
        country: log.countryCode,
      })));

      // Prepare all remaining async tasks
      const additionalTasks = [
        getFollowers(targetUserId),
        getFollowing(targetUserId),
        getUserLists(targetUserId).catch(() => []),
        getUserWatchlist(targetUserId).catch(() => []),
      ];

      // Add following/blocked checks if viewing another user's profile
      if (currentUser && targetUserId !== currentUser.uid) {
        additionalTasks.push(
          isFollowing(targetUserId),
          isUserBlocked(targetUserId)
        );
      }

      // Add likes query
      additionalTasks.push(
        (async () => {
          try {
            const likesQuery = query(
              collection(db, 'likes'),
              where('userId', '==', targetUserId)
            );
            const likesSnapshot = await getDocs(likesQuery);
            const likedRaceLogIds = likesSnapshot.docs.map(doc => doc.data().raceLogId);

            // Fetch the actual race logs
            if (likedRaceLogIds.length > 0) {
              const raceLogsQuery = query(
                collection(db, 'raceLogs'),
                where('__name__', 'in', likedRaceLogIds.slice(0, 10)) // Firestore limit
              );
              const raceLogsSnapshot = await getDocs(raceLogsQuery);
              return raceLogsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
            }
            return [];
          } catch (error) {
            console.error('Error loading likes:', error);
            return [];
          }
        })()
      );

      // Execute all remaining tasks in parallel
      const results = await Promise.all(additionalTasks);

      // Unpack results
      const followersList = results[0];
      const followingList = results[1];
      const userLists = results[2];
      const userWatchlist = results[3];

      setFollowers(followersList);
      setFollowing(followingList);
      setLists(userLists);
      setWatchlist(userWatchlist);

      if (currentUser && targetUserId !== currentUser.uid) {
        const following = results[4];
        const blocked = results[5];
        const likedLogs = results[6];

        setFollowingUser(following);
        setIsBlocked(blocked);
        setLikes(likedLogs);
      } else {
        const likedLogs = results[4];
        setLikes(likedLogs);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    const targetUserId = userId || currentUser?.uid;

    if (!currentUser || !targetUserId || targetUserId === currentUser.uid) return;

    setFollowLoading(true);
    try {
      if (followingUser) {
        await unfollowUser(targetUserId);
        setFollowingUser(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        toast({ title: 'Unfollowed user' });
      } else {
        await followUser(targetUserId);
        setFollowingUser(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        toast({ title: 'Following user' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setFollowLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!currentUser || !targetUserId || targetUserId === currentUser.uid) return;

    setBlockLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(targetUserId);
        setIsBlocked(false);
        toast({ title: 'User unblocked' });
      } else {
        await blockUser(targetUserId);
        setIsBlocked(true);
        // Automatically unfollow when blocking
        if (followingUser) {
          await unfollowUser(targetUserId);
          setFollowingUser(false);
          setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        }
        toast({ title: 'User blocked' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setBlockLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8 max-w-5xl mx-auto">
        {/* Profile Header - Letterboxd Style */}
        <div className="mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar - Larger, more prominent */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full border-2 border-gray-700 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-2xl">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile?.name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                    {(profile?.name || profile?.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 min-w-0 pt-2">
              {/* Name and Username */}
              <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1">
                  {profile?.name || 'Loading...'}
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                  @{profile?.username || 'user'}
                </p>
              </div>

              {/* Stats - Letterboxd Style */}
              <div className="flex flex-wrap gap-4 sm:gap-6 text-sm mb-4">
                <button className="hover:text-racing-red transition-colors">
                  <span className="font-semibold text-white">{stats.racesWatched}</span>{' '}
                  <span className="text-gray-400">races</span>
                </button>
                <button
                  className="hover:text-racing-red transition-colors"
                  onClick={() => setFollowersDialogOpen(true)}
                >
                  <span className="font-semibold text-white">{stats.followers}</span>{' '}
                  <span className="text-gray-400">followers</span>
                </button>
                <button
                  className="hover:text-racing-red transition-colors"
                  onClick={() => setFollowingDialogOpen(true)}
                >
                  <span className="font-semibold text-white">{stats.following}</span>{' '}
                  <span className="text-gray-400">following</span>
                </button>
              </div>

              {/* Bio */}
              {profile?.description && (
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-4">
                  {profile.description}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {currentUser?.uid === (userId || currentUser?.uid) ? (
                  <EditProfileDialog profile={profile} onSuccess={loadProfile} />
                ) : (
                  <>
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followLoading || isBlocked}
                      size="sm"
                      variant={followingUser ? "outline" : "default"}
                      className={followingUser
                        ? "border border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:border-gray-500"
                        : "bg-racing-red hover:bg-red-600 text-white"
                      }
                    >
                      {followingUser ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={handleBlockToggle}
                      disabled={blockLoading}
                      size="sm"
                      variant="outline"
                      className={isBlocked
                        ? "border border-orange-600 bg-transparent text-orange-500 hover:bg-orange-900/20 hover:border-orange-500"
                        : "border border-gray-600 bg-transparent text-white hover:bg-gray-800 hover:border-gray-500"
                      }
                    >
                      {isBlocked ? (
                        <>
                          <Ban className="w-4 h-4 mr-2" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 mr-2" />
                          Block
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
              <div>
                <span className="text-gray-400">
                  {currentUser?.uid === (userId || currentUser?.uid) ? "You've" : `${profile?.name || 'User'} has`} spent{' '}
                </span>
                <span className="font-semibold text-racing-red">{(() => {
                  const totalHours = stats.hoursSpent;
                  const months = Math.floor(totalHours / (24 * 30));
                  const remainingAfterMonths = totalHours % (24 * 30);
                  const days = Math.floor(remainingAfterMonths / 24);
                  const hours = remainingAfterMonths % 24;
                  const parts = [];
                  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
                  if (days > 0) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
                  parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
                  return parts.join(', ');
                })()}</span>{' '}
                <span className="text-gray-400">watching GPs 🏎️</span>
              </div>
            </div>
          </div>

          {/* Favourites - Letterboxd Style */}
          {(statsDoc?.exists() && (statsDoc.data()?.favoriteDriver || statsDoc.data()?.favoriteCircuit || statsDoc.data()?.favoriteTeam)) && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Favorites
              </h3>
              <div className="flex flex-wrap gap-4">
                {statsDoc.data()?.favoriteDriver && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Driver:</span>
                    <span className="text-white font-medium">{statsDoc.data().favoriteDriver}</span>
                  </div>
                )}
                {statsDoc.data()?.favoriteCircuit && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Circuit:</span>
                    <span className="text-white font-medium">{statsDoc.data().favoriteCircuit}</span>
                  </div>
                )}
                {statsDoc.data()?.favoriteTeam && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Team:</span>
                    <span className="text-white font-medium">{statsDoc.data().favoriteTeam}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tabs - Letterboxd Style */}
        <Tabs defaultValue="reviews" className="space-y-6">
          <div className="border-b border-gray-800">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0 space-x-0">
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger
                value="lists"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Lists
              </TabsTrigger>
              <TabsTrigger
                value="logs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Rated
              </TabsTrigger>
              <TabsTrigger
                value="watchlist"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Watchlist
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="logs" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : logs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {logs.map((race, idx) => (
                  <RaceCard key={idx} {...race} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No race logs yet"
                description="Start logging F1 races you've watched to build your collection"
              />
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : (() => {
                // Get reviews (logs with review text)
                const reviews = fullLogs.filter(log => log.review && log.review.trim().length > 0);

                if (reviews.length === 0) {
                  return (
                    <EmptyState
                      icon={MessageCircle}
                      title="No reviews yet"
                      description="Write reviews for races you've watched to share your thoughts"
                    />
                  );
                }

                const displayedReviews = reviews.slice(0, reviewsToShow);
                const hasMore = reviews.length > reviewsToShow;

                return (
                  <div className="space-y-0 max-w-2xl mx-auto">
                    {displayedReviews.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => {
                          console.log('[Profile] Navigating to review:', { raceYear: log.raceYear, round: log.round, id: log.id });
                          // Navigate to race detail with highlight parameter to scroll to the review
                          if (log.round && log.raceYear) {
                            navigate(`/race/${log.raceYear}/${log.round}?highlight=${log.id}`);
                          } else if (log.id) {
                            navigate(`/race/${log.id}`);
                          }
                        }}
                        className="border-b border-gray-800 hover:bg-gray-900/30 transition-colors cursor-pointer p-4"
                      >
                        <div className="flex gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center overflow-hidden">
                              {profile?.photoURL ? (
                                <img
                                  src={profile.photoURL}
                                  alt={profile?.name || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-bold text-white">
                                  {(profile?.name || profile?.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-bold text-white text-sm hover:underline">
                                {profile?.name || 'User'}
                              </span>
                              <span className="text-gray-500 text-sm">
                                @{profile?.username || 'user'}
                              </span>
                              <span className="text-gray-500 text-sm">·</span>
                              <span className="text-gray-500 text-sm">
                                {log.dateWatched instanceof Date
                                  ? log.dateWatched.toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : log.createdAt instanceof Date
                                    ? log.createdAt.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })
                                    : 'Recently'}
                              </span>
                            </div>

                            {/* Race info */}
                            <div className="mb-2">
                              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                                <span className="font-bold text-racing-red">{log.raceName}</span>
                                <span>·</span>
                                <span>{log.raceYear}</span>
                                {log.rating && (
                                  <>
                                    <span>·</span>
                                    <div className="flex items-center gap-0.5">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-3 h-3 ${
                                            i < log.rating!
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'text-gray-600 fill-gray-600'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Session Type Badge */}
                              {log.sessionType && (
                                <div className="inline-block mb-2">
                                  <Badge variant="outline" className={`text-xs font-bold uppercase tracking-wider ${
                                    log.sessionType === 'race' ? 'border-racing-red/60 text-racing-red' :
                                    log.sessionType === 'sprint' ? 'border-orange-500/60 text-orange-500' :
                                    log.sessionType === 'qualifying' ? 'border-blue-500/60 text-blue-500' :
                                    log.sessionType === 'sprintQualifying' ? 'border-purple-500/60 text-purple-500' :
                                    'border-gray-500/60 text-gray-500'
                                  }`}>
                                    {log.sessionType === 'race' ? '🏁 Race' :
                                     log.sessionType === 'sprint' ? '⚡ Sprint' :
                                     log.sessionType === 'qualifying' ? '🏎️ Qualifying' :
                                     log.sessionType === 'sprintQualifying' ? '⚡ Sprint Qualifying' :
                                     log.sessionType}
                                  </Badge>
                                </div>
                              )}

                              {/* Driver of the Day */}
                              {log.driverOfTheDay && (
                                <div className="text-sm text-gray-400">
                                  <span>🏆 Driver of the Day: </span>
                                  <span className="text-white font-medium">{log.driverOfTheDay}</span>
                                </div>
                              )}
                            </div>

                            {/* Review text */}
                            <p className="text-white text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                              {log.review}
                            </p>

                            {/* Engagement stats and actions */}
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-6 text-gray-500">
                                <button className="flex items-center gap-1.5 hover:text-racing-red transition-colors group">
                                  <Heart className={`w-4 h-4 ${log.likedBy?.includes(currentUser?.uid || '') ? 'fill-racing-red text-racing-red' : 'group-hover:fill-racing-red'}`} />
                                  <span className="text-xs">{log.likesCount || 0}</span>
                                </button>
                                <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="text-xs">{log.commentsCount || 0}</span>
                                </button>
                              </div>

                              {/* Edit button (only show on own profile) */}
                              {isOwnProfile && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingReview(log);
                                    setLogDialogOpen(true);
                                  }}
                                  className="flex items-center gap-1.5 text-gray-500 hover:text-racing-red transition-colors text-xs font-bold uppercase tracking-wider"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* View More Button */}
                    {hasMore && (
                      <div className="flex justify-center py-6">
                        <Button
                          onClick={() => setReviewsToShow(prev => prev + 8)}
                          variant="outline"
                          className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase tracking-wider"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          View More Reviews ({reviews.length - reviewsToShow} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()
            }
          </TabsContent>

          <TabsContent value="lists">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : lists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {lists.map((list) => (
                  <Card
                    key={list.id}
                    onClick={() => navigate(`/list/${list.id}`)}
                    className="overflow-hidden border-2 border-red-900/40 bg-black/60 hover:bg-black/80 backdrop-blur cursor-pointer hover:border-racing-red hover:shadow-lg hover:shadow-red-500/20 transition-all group"
                  >
                    {/* Cover Image */}
                    {list.listImageUrl && (
                      <div className="relative w-full h-32 overflow-hidden">
                        <img
                          src={list.listImageUrl}
                          alt={list.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                        {list.isPublic && (
                          <Badge variant="outline" className="absolute top-2 right-2 bg-racing-red/80 border-racing-red text-white text-xs font-bold backdrop-blur-sm">
                            Public
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-black text-white text-base uppercase tracking-wide group-hover:text-racing-red transition-colors flex-1 line-clamp-1">
                          {list.title}
                        </h3>
                        {!list.listImageUrl && list.isPublic && (
                          <Badge variant="outline" className="bg-racing-red/10 border-racing-red/40 text-racing-red text-xs font-bold ml-2">
                            Public
                          </Badge>
                        )}
                      </div>
                      {list.description && (
                        <p className="text-gray-300 text-xs mb-3 line-clamp-2 font-medium leading-relaxed">
                          {list.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-gray-400 font-bold">
                          <span className="text-white">{list.races?.length || 0}</span> {list.races?.length === 1 ? 'race' : 'races'}
                        </span>
                        <span className="text-gray-600">•</span>
                        <span className="text-gray-500 font-medium">
                          {list.createdAt?.toDate
                            ? list.createdAt.toDate().toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })
                            : 'Recently'
                          }
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={List}
                title="No lists yet"
                description="Create lists to organize your favorite races"
              />
            )}
          </TabsContent>

          <TabsContent value="watchlist">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {watchlist.map((item, idx) => {
                  // Try to derive country code from GP name if not present
                  const countryCode = item.countryCode || getCountryCodeFromGPName(item.raceName);

                  return (
                    <RaceCard
                      key={idx}
                      season={item.raceYear}
                      round={idx + 1}
                      gpName={item.raceName}
                      circuit={item.raceLocation}
                      date={item.raceDate?.toDate?.()?.toISOString() || new Date().toISOString()}
                      country={countryCode}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={Eye}
                title="Watchlist is empty"
                description="Add races to your watchlist to keep track of what you want to watch"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Followers Dialog */}
      <Dialog open={followersDialogOpen} onOpenChange={setFollowersDialogOpen}>
        <DialogContent className="max-w-md bg-black/95 border-2 border-racing-red">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-wider text-racing-red">Followers ({followers.length})</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {followers.length > 0 ? (
              <div className="space-y-2">
                {followers.map((follower) => (
                  <div
                    key={follower.id}
                    onClick={() => { setFollowersDialogOpen(false); navigate(`/user/${follower.id}`); }}
                    className="flex items-center gap-3 p-2 rounded-lg border border-red-900/40 bg-black/60 hover:bg-black/80 hover:border-racing-red cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/60 border-2 border-racing-red/40 flex items-center justify-center overflow-hidden group-hover:border-racing-red transition-colors flex-shrink-0">
                      {follower.photoURL ? (
                        <img src={follower.photoURL} alt={follower.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm font-bold text-white">
                          {(follower.name || follower.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-white text-sm group-hover:text-racing-red transition-colors">{follower.name || follower.username}</p>
                      <p className="text-xs text-gray-400 truncate">@{follower.username || 'user'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">No followers yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Dialog */}
      <Dialog open={followingDialogOpen} onOpenChange={setFollowingDialogOpen}>
        <DialogContent className="max-w-md bg-black/95 border-2 border-racing-red">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-wider text-racing-red">Following ({following.length})</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {following.length > 0 ? (
              <div className="space-y-2">
                {following.map((followedUser) => (
                  <div
                    key={followedUser.id}
                    onClick={() => { setFollowingDialogOpen(false); navigate(`/user/${followedUser.id}`); }}
                    className="flex items-center gap-3 p-2 rounded-lg border border-red-900/40 bg-black/60 hover:bg-black/80 hover:border-racing-red cursor-pointer transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/60 border-2 border-racing-red/40 flex items-center justify-center overflow-hidden group-hover:border-racing-red transition-colors flex-shrink-0">
                      {followedUser.photoURL ? (
                        <img src={followedUser.photoURL} alt={followedUser.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-sm font-bold text-white">
                          {(followedUser.name || followedUser.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate text-white text-sm group-hover:text-racing-red transition-colors">{followedUser.name || followedUser.username}</p>
                      <p className="text-xs text-gray-400 truncate">@{followedUser.username || 'user'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Not following anyone yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Review Dialog */}
      {isOwnProfile && (
        <LogRaceDialog
          trigger={<div style={{ display: 'none' }} />}
          open={logDialogOpen}
          onOpenChange={(open) => {
            setLogDialogOpen(open);
            if (!open) {
              setEditingReview(null);
            }
          }}
          existingLog={editingReview}
          editMode={!!editingReview}
          onSuccess={() => {
            setLogDialogOpen(false);
            setEditingReview(null);
            loadProfile(); // Reload profile to show updated review
          }}
        />
      )}
    </div>
  );
};

export default Profile;
