import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RaceCard } from "@/components/RaceCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { UserPlus, UserMinus, Settings, Heart, List, Calendar, Star, Users, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getUserProfile, getUserRaceLogs, calculateTotalHoursWatched } from "@/services/raceLogs";
import { followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from "@/services/follows";
import { getUserLists } from "@/services/lists";
import { getUserWatchlist } from "@/services/watchlist";
import { collection, query, where, getDocs } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useParams, useNavigate } from "react-router-dom";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { useAuth } from "@/contexts/AuthContext";

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

  const loadProfile = async () => {
    const targetUserId = userId || currentUser?.uid;

    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const profileDoc = await getDoc(doc(db, 'users', targetUserId));
      if (profileDoc.exists()) {
        setProfile({ id: profileDoc.id, ...profileDoc.data() });
      } else {
        setProfile({
          name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
          email: currentUser?.email,
          description: 'F1 fan',
        });
      }

      const userLogs = await getUserRaceLogs(targetUserId);
      const hoursWatched = calculateTotalHoursWatched(userLogs);
      const reviewsCount = userLogs.filter(log => log.review && log.review.length > 0).length;

      const userStatsDoc = await getDoc(doc(db, 'userStats', targetUserId));
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

      if (currentUser && targetUserId !== currentUser.uid) {
        const following = await isFollowing(targetUserId);
        setFollowingUser(following);
      }

      // Load followers, following, lists, watchlist, and likes
      const [followersList, followingList, userLists, userWatchlist] = await Promise.all([
        getFollowers(targetUserId),
        getFollowing(targetUserId),
        getUserLists(targetUserId).catch(() => []),
        getUserWatchlist(targetUserId).catch(() => []),
      ]);

      setFollowers(followersList);
      setFollowing(followingList);
      setLists(userLists);
      setWatchlist(userWatchlist);

      // Load likes (race logs that user has liked)
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
          const likedLogs = raceLogsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setLikes(likedLogs);
        }
      } catch (error) {
        console.error('Error loading likes:', error);
        setLikes([]);
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
                    {(profile?.name || profile?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
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
                  @{profile?.email?.split('@')[0] || 'user'}
                </p>
              </div>

              {/* Stats - Letterboxd Style */}
              <div className="flex flex-wrap gap-4 sm:gap-6 text-sm mb-4">
                <button className="hover:text-racing-red transition-colors">
                  <span className="font-semibold text-white">{stats.racesWatched}</span>{' '}
                  <span className="text-gray-400">races</span>
                </button>
                <button className="hover:text-racing-red transition-colors">
                  <span className="font-semibold text-white">{stats.followers}</span>{' '}
                  <span className="text-gray-400">followers</span>
                </button>
                <button className="hover:text-racing-red transition-colors">
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

              {/* Action Button */}
              <div>
                {currentUser?.uid === (userId || currentUser?.uid) ? (
                  <EditProfileDialog profile={profile} onSuccess={loadProfile} />
                ) : (
                  <Button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
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
              {stats.reviews > 0 && (
                <div>
                  <span className="font-semibold text-racing-red">{stats.reviews}</span>{' '}
                  <span className="text-gray-400">reviews</span>
                </div>
              )}
              {stats.lists > 0 && (
                <div>
                  <span className="font-semibold text-racing-red">{stats.lists}</span>{' '}
                  <span className="text-gray-400">lists</span>
                </div>
              )}
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
        <Tabs defaultValue="logs" className="space-y-6">
          <div className="border-b border-gray-800">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0 space-x-0">
              <TabsTrigger
                value="logs"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Logs
              </TabsTrigger>
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
                value="watchlist"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Watchlist
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Likes
              </TabsTrigger>
              <TabsTrigger
                value="followers"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Followers
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-4 py-3 font-medium text-sm"
              >
                Following
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
            ) : logs.filter(log => logs.find(l => l.id === log.id && l.rating > 0)).length > 0 ? (
              logs
                .filter(log => {
                  const fullLog = logs.find(l => l.id === log.id);
                  return fullLog && fullLog.rating > 0;
                })
                .map((race) => (
                  <Card key={race.id} className="p-6 border-2 border-red-900/40 bg-black/90 backdrop-blur hover:ring-2 hover:ring-racing-red transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-black/60 border-2 border-racing-red/40 flex items-center justify-center">
                        {profile?.photoURL ? (
                          <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-lg font-bold text-white">
                            {(profile?.name || profile?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-white">{profile?.name || profile?.email?.split('@')[0]}</span>
                          <span className="text-gray-300 text-sm font-bold">reviewed</span>
                          <span
                            className="font-bold text-white hover:text-racing-red cursor-pointer"
                            onClick={() => navigate(`/race/${race.id}`)}
                          >
                            {race.season} {race.gpName}
                          </span>
                          {race.rating && (
                            <div className="flex items-center gap-1 ml-auto">
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-bold text-white">{race.rating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mb-2 font-bold">
                          Watched at {race.circuit} on {new Date(race.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
            ) : (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Rate and review the races you've watched to share your thoughts"
              />
            )}
          </TabsContent>

          <TabsContent value="lists">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : lists.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {lists.map((list) => (
                  <Card
                    key={list.id}
                    className="p-6 hover:ring-2 hover:ring-racing-red border-2 border-red-900/40 bg-black/90 backdrop-blur transition-all cursor-pointer"
                    onClick={() => navigate(`/list/${list.id}`)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-racing-red/20 to-racing-red/5 rounded-xl flex items-center justify-center border-2 border-racing-red/40">
                        <List className="w-6 h-6 text-racing-red" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-white">{list.title}</h3>
                        <p className="text-sm text-gray-300 line-clamp-2 font-bold">{list.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-300 pt-3 border-t border-red-900/40 font-bold">
                      <span>{list.races?.length || 0} races</span>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {list.likesCount || 0}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={List}
                title="No lists yet"
                description="Create custom lists to organize your favorite races"
              />
            )}
          </TabsContent>

          <TabsContent value="watchlist">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : watchlist.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {watchlist.map((item, idx) => (
                  <RaceCard
                    key={idx}
                    season={item.raceYear}
                    round={idx + 1}
                    gpName={item.raceName}
                    circuit={item.raceLocation}
                    date={item.raceDate?.toDate?.()?.toISOString() || new Date().toISOString()}
                    country={item.countryCode}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Eye}
                title="Watchlist is empty"
                description="Add races to your watchlist to keep track of what you want to watch"
              />
            )}
          </TabsContent>

          <TabsContent value="likes">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : likes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {likes.map((log) => (
                  <RaceCard
                    key={log.id}
                    id={log.id}
                    season={log.raceYear}
                    round={log.round || 1}
                    gpName={log.raceName}
                    circuit={log.raceLocation}
                    date={log.dateWatched?.toDate?.()?.toISOString() || new Date().toISOString()}
                    rating={log.rating}
                    watched={true}
                    country={log.countryCode}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="No likes yet"
                description="Like reviews and lists to show your appreciation"
              />
            )}
          </TabsContent>

          <TabsContent value="followers">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : followers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {followers.map((follower) => (
                  <Card key={follower.id} className="p-4 border-2 border-red-900/40 bg-black/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-black/60 border-2 border-racing-red/40 flex items-center justify-center overflow-hidden">
                        {follower.photoURL ? (
                          <img src={follower.photoURL} alt={follower.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-lg font-bold text-white">
                            {(follower.name || follower.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-white">{follower.name || follower.email?.split('@')[0]}</p>
                        <p className="text-sm text-gray-300 truncate font-bold">@{follower.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                      onClick={() => navigate(`/user/${follower.id}`)}
                    >
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="No followers yet"
                description="Share your profile and connect with other F1 fans"
              />
            )}
          </TabsContent>

          <TabsContent value="following">
            {loading ? (
              <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
            ) : following.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {following.map((followedUser) => (
                  <Card key={followedUser.id} className="p-4 border-2 border-red-900/40 bg-black/90 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-black/60 border-2 border-racing-red/40 flex items-center justify-center overflow-hidden">
                        {followedUser.photoURL ? (
                          <img src={followedUser.photoURL} alt={followedUser.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-lg font-bold text-white">
                            {(followedUser.name || followedUser.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold truncate text-white">{followedUser.name || followedUser.email?.split('@')[0]}</p>
                        <p className="text-sm text-gray-300 truncate font-bold">@{followedUser.email?.split('@')[0]}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                      onClick={() => navigate(`/user/${followedUser.id}`)}
                    >
                      View Profile
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="Not following anyone yet"
                description="Follow other F1 fans to see their activity and race logs"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
