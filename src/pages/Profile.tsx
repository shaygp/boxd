import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/RaceCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { LogRaceDialog } from "@/components/LogRaceDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, UserMinus, Settings, Heart, List, Calendar, Star, Users, Eye, MessageCircle, Plus, ArrowRight, Ban, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getUserProfile, getUserRaceLogs } from "@/services/raceLogs";
import { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from "@/services/follows";
import { getUserLists } from "@/services/lists";
import { getCountryCodeFromGPName, getCountryFlag } from "@/services/f1Api";
import { getUserWatchlist } from "@/services/watchlist";
import { collection, query, where, getDocs } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { useAuth } from "@/contexts/AuthContext";
import { blockUser, unblockUser, isUserBlocked } from "@/services/reports";
import { getRacesBySeason } from "@/services/f1Calendar";
import { setFavoriteRace } from "@/services/auth";

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
  const [ratedSortBy, setRatedSortBy] = useState<'dateWatched' | 'raceDate' | 'ratingDate'>('dateWatched');
  const [selectFavoriteDialogOpen, setSelectFavoriteDialogOpen] = useState(false);
  const [allRaces, setAllRaces] = useState<any[]>([]);
  const [likesDialogOpen, setLikesDialogOpen] = useState(false);
  const [selectedLogLikes, setSelectedLogLikes] = useState<any[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);

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

      const reviewsCount = userLogs.filter(log => log.review && log.review.length > 0).length;

      // Store full logs with review content
      setFullLogs(userLogs);

      setStatsDoc(userStatsDoc);
      const statsData = userStatsDoc.exists() ? userStatsDoc.data() : {};

      setStats({
        racesWatched: userLogs.length,
        hoursSpent: 0,
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
        dateWatched: log.dateWatched instanceof Date
          ? log.dateWatched
          : new Date(log.dateWatched),
        createdAt: log.createdAt instanceof Date
          ? log.createdAt
          : new Date(log.createdAt),
        rating: log.rating,
        watched: true,
        country: log.countryCode,
        sessionType: log.sessionType,
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

  const handleShowLikes = async (log: any) => {
    if (!log.likedBy || log.likedBy.length === 0) {
      toast({ title: 'No likes yet' });
      return;
    }

    setLikesLoading(true);
    setLikesDialogOpen(true);
    setSelectedLogLikes([]);

    try {
      const likesData = await Promise.all(
        log.likedBy.map(async (uid: string) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            return {
              id: uid,
              ...userDoc.data()
            };
          }
          return null;
        })
      );

      setSelectedLogLikes(likesData.filter(user => user !== null));
    } catch (error) {
      console.error('Error loading likes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load likes',
        variant: 'destructive'
      });
    } finally {
      setLikesLoading(false);
    }
  };

  const loadAllRaces = async () => {
    try {
      const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
      const racesPromises = years.map(year => getRacesBySeason(year));
      const racesArrays = await Promise.all(racesPromises);
      const allRacesFlat = racesArrays.flat();
      setAllRaces(allRacesFlat);
    } catch (error) {
      console.error('Error loading races:', error);
    }
  };

  const handleSetFavoriteRace = async (race: any) => {
    if (!currentUser) return;

    try {
      await setFavoriteRace(currentUser.uid, {
        raceName: race.raceName,
        raceYear: race.year,
        raceLocation: race.circuitName,
        countryCode: race.countryCode,
        round: race.round
      });
      setSelectFavoriteDialogOpen(false);
      toast({ title: 'Favorite race set!' });
      // Reload profile
      loadProfile();
    } catch (error) {
      console.error('Error setting favorite race:', error);
      toast({ title: 'Failed to set favorite race', variant: 'destructive' });
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
                <div className="flex items-center justify-between mb-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {profile?.name || 'Loading...'}
                  </h1>
                  {currentUser?.uid === (userId || currentUser?.uid) && (
                    <EditProfileDialog profile={profile} onSuccess={loadProfile} />
                  )}
                </div>
                <p className="text-sm sm:text-base text-gray-400">
                  @{profile?.username || 'user'}
                </p>
              </div>

              {/* Stats */}
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

              {/* Action Buttons - Only for other users' profiles */}
              {currentUser?.uid !== (userId || currentUser?.uid) && (
                <div className="flex items-center gap-2 flex-wrap">
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
                </div>
              )}
            </div>
          </div>

          {/* Top Race */}
          {profile?.id === currentUser?.uid && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Top Race</h3>
                {profile?.favoriteRace && (
                  <Button
                    onClick={() => {
                      loadAllRaces();
                      setSelectFavoriteDialogOpen(true);
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-racing-red hover:text-red-400 hover:bg-racing-red/10"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              {profile?.favoriteRace ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-racing-red/30 bg-black/40">
                  <div className="w-14 h-10 flex-shrink-0 rounded overflow-hidden">
                    <img
                      src={getCountryFlag(profile.favoriteRace.countryCode)}
                      alt={profile.favoriteRace.countryCode}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-base mb-0.5 truncate">
                      {profile.favoriteRace.raceName}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">{profile.favoriteRace.raceLocation}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-black text-racing-red">{profile.favoriteRace.raceYear}</div>
                    <div className="text-xs text-gray-500">Round {profile.favoriteRace.round || 1}</div>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => {
                    loadAllRaces();
                    setSelectFavoriteDialogOpen(true);
                  }}
                  className="border-2 border-dashed border-racing-red/30 rounded-lg p-4 text-center bg-black/40 hover:bg-black/60 hover:border-racing-red/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Star className="w-5 h-5 text-racing-red/50" />
                    <span className="text-sm font-bold text-gray-400">Click to add your top race</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {profile?.favoriteRace && profile?.id !== currentUser?.uid && (
            <div className="mt-6 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Top Race</h3>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-racing-red/30 bg-black/40">
                <div className="w-14 h-10 flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={getCountryFlag(profile.favoriteRace.countryCode)}
                    alt={profile.favoriteRace.countryCode}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-base mb-0.5 truncate">
                    {profile.favoriteRace.raceName}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{profile.favoriteRace.raceLocation}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-black text-racing-red">{profile.favoriteRace.raceYear}</div>
                  <div className="text-xs text-gray-500">Round {profile.favoriteRace.round || 1}</div>
                </div>
              </div>
            </div>
          )}

          {/* Favourites */}
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
              <>
                {/* Stats Section - Similar to Diary */}
                <div className="pb-4 border-b-2 border-red-900/50">
                  <p className="text-sm sm:text-base text-gray-300 flex items-center gap-2 sm:gap-3 flex-wrap font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-racing-red" />
                      {fullLogs.length} RACES LOGGED
                    </span>
                    <span className="text-red-900">•</span>
                    <span className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-racing-red fill-racing-red" />
                      {(() => {
                        const ratedLogs = fullLogs.filter(log => log.rating && log.rating > 0);
                        if (ratedLogs.length === 0) return '0.0 AVG RATING';
                        const average = ratedLogs.reduce((sum, log) => sum + (log.rating || 0), 0) / ratedLogs.length;
                        // Round to nearest 0.5 for half-star precision
                        const roundedAverage = Math.round(average * 2) / 2;
                        return `${roundedAverage.toFixed(1)} AVG RATING`;
                      })()}
                    </span>
                  </p>
                </div>

                {/* Sort dropdown */}
                <div className="flex justify-start mb-4">
                  <Select value={ratedSortBy} onValueChange={(value: 'dateWatched' | 'raceDate' | 'ratingDate') => setRatedSortBy(value)}>
                    <SelectTrigger className="w-[180px] h-8 text-xs font-bold uppercase tracking-wider bg-black/60 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-gray-700">
                      <SelectItem value="dateWatched" className="text-xs font-bold uppercase text-white cursor-pointer">Date Watched</SelectItem>
                      <SelectItem value="raceDate" className="text-xs font-bold uppercase text-white cursor-pointer">Race Date</SelectItem>
                      <SelectItem value="ratingDate" className="text-xs font-bold uppercase text-white cursor-pointer">Rating Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto px-2 sm:px-0">
                  {(() => {
                    // Sort logs based on selected option
                    const sortedLogs = [...fullLogs].sort((a: any, b: any) => {
                      if (ratedSortBy === 'dateWatched') {
                        return b.dateWatched.getTime() - a.dateWatched.getTime();
                      } else if (ratedSortBy === 'raceDate') {
                        if (a.raceYear !== b.raceYear) {
                          return b.raceYear - a.raceYear;
                        }
                        return (b.round || 0) - (a.round || 0);
                      } else {
                        return b.createdAt.getTime() - a.createdAt.getTime();
                      }
                    });

                    return sortedLogs.map((log) => {
                      const flagUrl = log.countryCode ? getCountryFlag(log.countryCode) : null;
                      const dateStr = log.dateWatched instanceof Date
                        ? log.dateWatched.toLocaleDateString()
                        : new Date(log.dateWatched).toLocaleDateString();

                      return (
                        <Card
                          key={log.id}
                          className="p-3 sm:p-4 md:p-5 hover:border-racing-red transition-all cursor-pointer group relative overflow-hidden bg-black/90 border-2 border-red-900/40 hover:shadow-xl hover:shadow-red-500/30 backdrop-blur-sm"
                          onClick={() => navigate(`/race/${log.id}`)}
                        >
                          {/* Racing stripe */}
                          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

                          <div className="flex gap-2 sm:gap-3 md:gap-4 items-center flex-wrap sm:flex-nowrap">
                            {/* Flag & Title */}
                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                              {flagUrl && (
                                <div className="w-14 h-9 sm:w-16 sm:h-10 md:w-20 md:h-12 rounded overflow-hidden border-2 border-racing-red/40 shadow-xl shadow-black/50 flex-shrink-0">
                                  <img
                                    src={flagUrl}
                                    alt={log.countryCode || log.raceLocation}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <h3 className="font-black text-sm sm:text-base md:text-lg mb-0.5 truncate uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{log.raceName}</h3>
                                <p className="text-[10px] sm:text-xs md:text-sm text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                                  {log.raceYear} • {log.raceLocation}
                                </p>
                                {/* Session Type Badge */}
                                {log.sessionType && (
                                  <div className="mt-1">
                                    <Badge variant="outline" className={`text-xs font-bold uppercase tracking-wider rounded-sm ${
                                      log.sessionType === 'race' ? 'border-racing-red/60 text-racing-red' :
                                      log.sessionType === 'sprint' ? 'border-orange-500/60 text-orange-500' :
                                      log.sessionType === 'qualifying' ? 'border-blue-500/60 text-blue-500' :
                                      log.sessionType === 'sprintQualifying' ? 'border-purple-500/60 text-purple-500' :
                                      'border-gray-500/60 text-gray-500'
                                    }`}>
                                      {log.sessionType === 'race' ? 'Race 🏁' :
                                       log.sessionType === 'sprint' ? 'Sprint ⚡' :
                                       log.sessionType === 'qualifying' ? 'Qualifying 🏎️' :
                                       log.sessionType === 'sprintQualifying' ? 'Sprint Qualifying ⚡' :
                                       log.sessionType}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Rating */}
                            {log.rating && (
                              <div className="flex items-center gap-1 bg-black/90 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border border-racing-red/50 flex-shrink-0">
                                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-racing-red text-racing-red drop-shadow-[0_0_4px_rgba(220,38,38,0.8)]" />
                                <span className="font-black text-xs sm:text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{log.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>

                          {/* Driver of the Day & Review */}
                          <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                            {log.driverOfTheDay && (
                              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                                <span className="text-[10px] sm:text-xs text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">DRIVER OF THE DAY:</span>
                                <span className="font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">🏆 {log.driverOfTheDay}</span>
                              </div>
                            )}

                            {log.review && (
                              <p className="text-[10px] sm:text-xs md:text-sm text-gray-200 line-clamp-2 italic font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                                "{log.review}"
                              </p>
                            )}

                            {/* Footer */}
                            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)] pt-1.5 sm:pt-2">
                              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-racing-red" />
                              <span>{dateStr}</span>
                            </div>
                          </div>
                        </Card>
                      );
                    });
                  })()}
                </div>
              </>
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
                          // Always use the log ID to navigate to avoid crashes from missing round data
                          if (log.id) {
                            navigate(`/race/${log.id}?highlight=${log.id}`);
                          }
                        }}
                        className="border-b border-gray-800/60 hover:bg-black/20 transition-all cursor-pointer px-4 py-3"
                      >
                        <div className="flex gap-3">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center overflow-hidden hover:border-gray-600 transition-colors">
                              {profile?.photoURL ? (
                                <img
                                  src={profile.photoURL}
                                  alt={profile?.name || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-base font-black text-gray-300">
                                  {(profile?.name || profile?.username || 'U').charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header - Twitter style */}
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="font-black text-white text-base hover:underline cursor-pointer">
                                {profile?.name || 'User'}
                              </span>
                              <span className="text-gray-500 text-sm font-medium">
                                @{profile?.username || 'user'}
                              </span>
                              <span className="text-gray-600">·</span>
                              <span className="text-gray-500 text-sm hover:underline">
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

                            {/* Race info card - Compact - SHOWN FIRST */}
                            <div className="bg-black/40 border border-racing-red/20 rounded-lg p-3 mb-3 hover:border-racing-red/40 transition-colors">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                  <div className="font-black text-racing-red text-sm">
                                    {log.raceName.replace('Grand Prix', 'GP')} <span className="text-gray-400 font-medium">{log.raceYear}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Session Badge */}
                                  {log.sessionType && (
                                    <Badge variant="outline" className={`text-[10px] font-black uppercase tracking-wider rounded-sm px-2 py-0.5 ${
                                      log.sessionType === 'race' ? 'border-racing-red/60 text-racing-red bg-racing-red/10' :
                                      log.sessionType === 'sprint' ? 'border-orange-500/60 text-orange-500 bg-orange-500/10' :
                                      log.sessionType === 'qualifying' ? 'border-blue-500/60 text-blue-500 bg-blue-500/10' :
                                      log.sessionType === 'sprintQualifying' ? 'border-purple-500/60 text-purple-500 bg-purple-500/10' :
                                      'border-gray-500/60 text-gray-500 bg-gray-500/10'
                                    }`}>
                                      {log.sessionType === 'race' ? '🏁 RACE' :
                                       log.sessionType === 'sprint' ? '⚡ SPRINT' :
                                       log.sessionType === 'qualifying' ? '🏎️ QUALI' :
                                       log.sessionType === 'sprintQualifying' ? '⚡ SQ' :
                                       log.sessionType}
                                    </Badge>
                                  )}

                                  {/* Rating */}
                                  {log.rating && (
                                    <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/30 rounded-sm px-2 py-1">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-2.5 h-2.5 ${
                                            i < log.rating!
                                              ? 'fill-yellow-400 text-yellow-400'
                                              : 'fill-gray-700 text-gray-700'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Driver of the Day */}
                              {log.driverOfTheDay && (
                                <div className="mt-2 pt-2 border-t border-gray-800 text-xs">
                                  <span className="text-gray-500 font-medium">DOTD:</span>{' '}
                                  <span className="text-white font-bold">{log.driverOfTheDay}</span>
                                </div>
                              )}
                            </div>

                            {/* Review text - Shown AFTER the GP card */}
                            <p className="text-white text-[14px] leading-relaxed whitespace-pre-wrap break-words mb-3">
                              {log.review}
                            </p>

                            {/* Engagement bar - Twitter style */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 sm:gap-6">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleShowLikes(log);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2 hover:text-racing-red transition-colors group cursor-pointer select-none"
                                >
                                  <Heart className={`w-[18px] h-[18px] ${log.likedBy?.includes(currentUser?.uid || '') ? 'fill-racing-red text-racing-red' : 'text-gray-600 group-hover:text-racing-red'}`} />
                                  <span className="text-sm font-medium text-gray-500 group-hover:text-racing-red">{log.likesCount || 0}</span>
                                </button>
                              </div>

                              {/* Edit button */}
                              {isOwnProfile && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingReview(log);
                                    setLogDialogOpen(true);
                                  }}
                                  className="flex items-center gap-1 text-gray-600 hover:text-racing-red transition-colors text-xs font-bold uppercase tracking-wider px-2 py-1 hover:bg-racing-red/10 rounded"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Edit</span>
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

      {/* Select Favorite Race Dialog */}
      <Dialog open={selectFavoriteDialogOpen} onOpenChange={setSelectFavoriteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-black/95 border-2 border-racing-red">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-wider text-racing-red">
              Select Your Top Race
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            {allRaces.map((race) => (
              <div
                key={`${race.year}-${race.round}`}
                onClick={() => handleSetFavoriteRace(race)}
                className="flex items-center gap-4 p-3 rounded-lg border border-red-900/40 bg-black/60 hover:bg-black/80 hover:border-racing-red cursor-pointer transition-all group"
              >
                <div className="w-12 h-9 flex-shrink-0 rounded overflow-hidden">
                  <img
                    src={getCountryFlag(race.countryCode)}
                    alt={race.countryCode}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-sm group-hover:text-racing-red transition-colors truncate">
                    {race.raceName}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">{race.circuitName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-racing-red">{race.year}</div>
                  <div className="text-xs text-gray-500">Round {race.round}</div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Likes Dialog */}
      <Dialog open={likesDialogOpen} onOpenChange={setLikesDialogOpen}>
        <DialogContent className="max-w-md bg-black border-2 border-racing-red/40">
          <DialogHeader>
            <DialogTitle className="text-white">Liked by</DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            {likesLoading ? (
              <div className="text-center text-gray-400 py-8">Loading...</div>
            ) : selectedLogLikes.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No likes yet</div>
            ) : (
              selectedLogLikes.map((user: any) => (
                <div
                  key={user.id}
                  onClick={() => {
                    setLikesDialogOpen(false);
                    navigate(`/user/${user.id}`);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium truncate">{user.name}</div>
                    <div className="text-gray-400 text-sm truncate">@{user.username}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
