import { Header } from "@/components/Header";
import { RaceCard } from "@/components/RaceCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { CreateListDialog } from "@/components/CreateListDialog";
import { RateSeasonDialog } from "@/components/RateSeasonDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, List, Calendar, History, MessageCircle, Heart, Plus, ArrowRight, Trophy, Award } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPublicRaceLogs } from "@/services/raceLogs";
import { getPublicLists } from "@/services/lists";
import { getPosterUrl } from "@/services/f1Api";
import { getCurrentSeasonRaces as getFirestoreRaces, getRacesBySeason as getFirestoreRacesBySeason } from "@/services/f1Calendar";
import { getSeasonAverageRating, getUserSeasonRating } from "@/services/seasonRatings";
import { auth } from "@/lib/firebase";

const Explore = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [trendingRaces, setTrendingRaces] = useState<any[]>([]);
  const [topReviews, setTopReviews] = useState<any[]>([]);
  const [popularLists, setPopularLists] = useState<any[]>([]);
  const [upcomingRaces, setUpcomingRaces] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear());
  const [seasonRaces, setSeasonRaces] = useState<any[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listsToShow, setListsToShow] = useState(10);
  const [rateSeasonDialogOpen, setRateSeasonDialogOpen] = useState(false);
  const [seasonRating, setSeasonRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [userSeasonRating, setUserSeasonRating] = useState<number | null>(null);
  const [allSeasonRatings, setAllSeasonRatings] = useState<{ year: number; average: number; count: number }[]>([]);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'seasons');
  const [listFilter, setListFilter] = useState<'recent' | 'liked' | 'items'>('recent');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [logs, lists, firestoreRaces, seasonRatingsData] = await Promise.all([
          getPublicRaceLogs(50),
          getPublicLists(),
          getFirestoreRaces(),
          // Load all season ratings for leaderboard
          Promise.all([2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010].map(async (year) => {
            const rating = await getSeasonAverageRating(year);
            return { year, ...rating };
          }))
        ]);

        const logCounts: { [key: string]: number } = {};
        logs.forEach(log => {
          const key = `${log.raceName}-${log.raceYear}`;
          logCounts[key] = (logCounts[key] || 0) + 1;
        });

        const uniqueRaces = Array.from(new Set(logs.map(log => `${log.raceName}-${log.raceYear}`)))
          .map(key => {
            const [raceName, raceYear] = key.split('-');
            const raceLogs = logs.filter(l => l.raceName === raceName && l.raceYear === parseInt(raceYear));
            return raceLogs[0];
          })
          .sort((a, b) => {
            const countA = logCounts[`${a.raceName}-${a.raceYear}`] || 0;
            const countB = logCounts[`${b.raceName}-${b.raceYear}`] || 0;
            return countB - countA;
          })
          .slice(0, 12);

        setTrendingRaces(uniqueRaces);

        const reviewsWithContent = logs
          .filter(log => log.review && log.review.length > 0)
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
          .slice(0, 10);

        setTopReviews(reviewsWithContent);

        // Store unsorted lists - we'll sort them based on filter
        setPopularLists(lists);

        // Set all season ratings for leaderboard (sorted by rating)
        setAllSeasonRatings(seasonRatingsData.sort((a, b) => b.average - a.average));

        // Convert Firestore races to expected format
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const upcoming = firestoreRaces.map(race => ({
          meeting_key: race.round,
          year: race.year,
          round: race.round,
          meeting_name: race.raceName,
          circuit_short_name: race.circuitName,
          date_start: race.dateStart.toISOString(),
          country_code: race.countryCode,
          location: race.location,
          circuit_key: race.round
        }));

        const thisWeekRaces = upcoming.filter(race => {
          const raceDate = new Date(race.date_start);
          return raceDate >= today && raceDate <= nextWeek;
        });

        setUpcomingRaces(thisWeekRaces);
      } catch (error) {
        console.error('Error loading explore data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle URL parameters for season and tab
  useEffect(() => {
    const seasonParam = searchParams.get('season');
    const tabParam = searchParams.get('tab');

    if (seasonParam) {
      const year = parseInt(seasonParam);
      if (!isNaN(year)) {
        setSelectedSeason(year);
      }
    }

    // Only change tab if explicitly set in URL and different from current
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
      // Scroll to top when navigating via tab parameter
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchParams, activeTab]);

  useEffect(() => {
    const loadSeasonRaces = async () => {
      setSeasonLoading(true);
      try {
        const [firestoreRaces, avgRating, userRating] = await Promise.all([
          getFirestoreRacesBySeason(selectedSeason),
          getSeasonAverageRating(selectedSeason),
          auth.currentUser ? getUserSeasonRating(auth.currentUser.uid, selectedSeason) : Promise.resolve(null)
        ]);

        // Convert to expected format
        const races = firestoreRaces.map(race => ({
          meeting_key: race.round,
          year: race.year,
          round: race.round,
          meeting_name: race.raceName,
          circuit_short_name: race.circuitName,
          date_start: race.dateStart.toISOString(),
          country_code: race.countryCode,
          location: race.location,
          circuit_key: race.round
        }));
        setSeasonRaces(races);
        setSeasonRating(avgRating);
        setUserSeasonRating(userRating?.rating || null);
      } catch (error) {
        console.error('Error loading season races:', error);
        setSeasonRaces([]);
        setSeasonRating({ average: 0, count: 0 });
        setUserSeasonRating(null);
      } finally {
        setSeasonLoading(false);
      }
    };

    loadSeasonRaces();
  }, [selectedSeason]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1412] via-[#0f0d0c] to-[#050403] pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b-2 border-gray-800/60">
            <TabsList className="w-full justify-start bg-transparent h-auto p-0 space-x-0">
              <TabsTrigger value="seasons" className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-5 py-4 font-black text-sm uppercase tracking-wider transition-all">
                Seasons
              </TabsTrigger>
              <TabsTrigger value="lists" className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-5 py-4 font-black text-sm uppercase tracking-wider transition-all">
                Lists
              </TabsTrigger>
              <TabsTrigger value="trending" className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-5 py-4 font-black text-sm uppercase tracking-wider transition-all">
                Trending
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-racing-red data-[state=active]:bg-transparent bg-transparent text-gray-400 data-[state=active]:text-white px-5 py-4 font-black text-sm uppercase tracking-wider transition-all">
                Reviews
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="seasons" className="space-y-0">
            {/* Season Selector Bar - Full width red accent */}
            <div className="bg-gradient-to-r from-black via-racing-red/5 to-black border-y-2 border-racing-red/30 py-4 px-6 mb-6">
              <div className="flex flex-wrap items-center gap-3 justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                  {/* Year Dropdown */}
                  <Select value={selectedSeason.toString()} onValueChange={(value) => {
                    const year = parseInt(value);
                    setSelectedSeason(year);
                    const newParams = new URLSearchParams(searchParams);
                    newParams.set('season', value);
                    setSearchParams(newParams);
                  }}>
                    <SelectTrigger className="w-[120px] h-10 text-sm font-black uppercase tracking-wider bg-racing-red border-2 border-red-400 text-white hover:bg-red-600 shadow-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-2 border-racing-red">
                      {[2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010].map((year) => (
                        <SelectItem key={year} value={year.toString()} className="text-sm font-black uppercase text-white cursor-pointer hover:bg-racing-red/20">
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="h-6 w-px bg-gray-700"></div>

                  {/* Rating Display + Edit/Rate Button */}
                  {userSeasonRating ? (
                    <button
                      onClick={() => setRateSeasonDialogOpen(true)}
                      className="flex items-center gap-2 bg-black/60 hover:bg-black border-2 border-yellow-600/50 hover:border-yellow-500 px-3 py-2 rounded-lg transition-all"
                    >
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-black text-yellow-400">{userSeasonRating}</span>
                        <span className="text-xs text-yellow-400/70 font-bold">/5</span>
                      </div>
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs text-gray-400 font-bold uppercase">Edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setRateSeasonDialogOpen(true)}
                      className="group bg-black/60 hover:bg-racing-red text-white px-4 py-2 text-xs rounded-lg font-black uppercase tracking-wider border-2 border-racing-red/50 hover:border-red-400 transition-all shadow-lg hover:shadow-red-500/50"
                    >
                      <span className="flex items-center gap-1.5">
                        <Star className="w-4 h-4 group-hover:fill-yellow-400 group-hover:text-yellow-400 transition-all" />
                        Rate Season
                      </span>
                    </button>
                  )}
                </div>

                {/* Season Stats */}
                {!seasonLoading && seasonRaces.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Trophy className="w-4 h-4 text-racing-red" />
                    <span className="font-bold">{seasonRaces.length} Races</span>
                  </div>
                )}
              </div>
            </div>

            {/* Races Grid */}
            {seasonLoading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3 text-gray-400">
                  <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider">Loading {selectedSeason}...</span>
                </div>
              </div>
            ) : seasonRaces.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={History}
                  title={`No races found for ${selectedSeason}`}
                  description="Try selecting a different season or check back later"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {seasonRaces.map((race) => (
                  <RaceCard
                    key={race.meeting_key}
                    season={race.year}
                    round={race.round}
                    gpName={race.meeting_name}
                    circuit={race.circuit_short_name}
                    date={race.date_start}
                    country={race.country_code}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3 text-gray-400">
                  <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider">Loading...</span>
                </div>
              </div>
            ) : trendingRaces.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={TrendingUp}
                  title="No trending races yet"
                  description="Start logging races to see what's trending in the community"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {trendingRaces.map((race) => (
                  <RaceCard
                    key={race.id}
                    id={race.id}
                    season={race.raceYear}
                    round={race.round || 1}
                    gpName={race.raceName}
                    circuit={race.raceLocation}
                    date={race.dateWatched?.toDate?.()?.toISOString() || ''}
                    rating={race.rating}
                    watched={true}
                    country={race.countryCode}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3 text-gray-400">
                  <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider">Loading reviews...</span>
                </div>
              </div>
            ) : topReviews.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  description="Be the first to write a review and share your thoughts on F1 races"
                />
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
                  {topReviews.map((review) => (
                    <Card key={review.id} className="group bg-black/90 border-2 border-red-900/40 hover:border-racing-red transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-red-500/30 cursor-pointer"
                      onClick={() => navigate(`/race/${review.id}`)}>
                      {/* Racing accent line */}
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

                      <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                        <div className="flex gap-2.5 sm:gap-3 md:gap-4">
                          {/* Avatar Section */}
                          <div className="flex-shrink-0">
                            <div className="relative">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border-2 border-gray-700 group-hover:border-racing-red transition-all duration-300 overflow-hidden ring-2 ring-black/50">
                                {review.userAvatar ? (
                                  <img
                                    src={review.userAvatar}
                                    alt={review.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-base sm:text-lg md:text-xl font-black text-white drop-shadow-lg uppercase">
                                    {review.username?.charAt(0)?.toUpperCase() || 'U'}
                                  </span>
                                )}
                              </div>
                              {/* Review badge */}
                              <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-full bg-racing-red border-2 border-black flex items-center justify-center shadow-lg">
                                <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                              </div>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0 space-y-2 sm:space-y-2.5 md:space-y-3">
                            {/* Header */}
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm md:text-base leading-snug">
                                <span className="font-bold text-white">{review.username}</span>
                                <span className="text-gray-400">reviewed</span>
                                <span className="font-semibold text-racing-red">
                                  {review.raceName}
                                </span>
                                {review.rating && review.rating > 0 && (
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-3.5 h-3.5 ${
                                          i < review.rating
                                            ? 'fill-racing-red text-racing-red'
                                            : 'text-gray-600'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Timestamp and metadata */}
                              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                                <span>
                                  {new Date(review.dateWatched || review.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                                {review.raceYear && (
                                  <>
                                    <span className="text-gray-700">•</span>
                                    <span>{review.raceYear}</span>
                                  </>
                                )}
                                {review.raceLocation && (
                                  <>
                                    <span className="text-gray-700">•</span>
                                    <span>{review.raceLocation}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Review Content */}
                            {review.review && (
                              <div className="space-y-1.5 sm:space-y-2">
                                <div className="bg-black/40 rounded-lg p-2.5 sm:p-3 md:p-4 border border-gray-800/50">
                                  <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-200 line-clamp-3 sm:line-clamp-4">
                                    {review.review}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Interaction bar */}
                            <div className="flex items-center gap-4 pt-2 border-t border-gray-800/50">
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400">
                                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-racing-red text-racing-red" />
                                <span>{review.likesCount || 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400">
                                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Comment</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lists" className="space-y-0">
            {/* Filter Bar - Full width */}
            <div className="bg-gradient-to-r from-black via-racing-red/5 to-black border-y-2 border-racing-red/30 py-4 px-6 mb-6">
              <div className="flex flex-wrap items-center gap-3 justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 font-black uppercase tracking-wider">Sort:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setListFilter('recent')}
                      className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        listFilter === 'recent'
                          ? 'bg-racing-red text-white border-2 border-red-400 shadow-lg'
                          : 'bg-black/60 border-2 border-gray-700 text-gray-400 hover:border-racing-red/50'
                      }`}
                    >
                      Recent
                    </button>
                    <button
                      onClick={() => setListFilter('liked')}
                      className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        listFilter === 'liked'
                          ? 'bg-racing-red text-white border-2 border-red-400 shadow-lg'
                          : 'bg-black/60 border-2 border-gray-700 text-gray-400 hover:border-racing-red/50'
                      }`}
                    >
                      Top Liked
                    </button>
                    <button
                      onClick={() => setListFilter('items')}
                      className={`px-3 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                        listFilter === 'items'
                          ? 'bg-racing-red text-white border-2 border-red-400 shadow-lg'
                          : 'bg-black/60 border-2 border-gray-700 text-gray-400 hover:border-racing-red/50'
                      }`}
                    >
                      Most Items
                    </button>
                  </div>
                </div>

                <CreateListDialog
                  trigger={
                    <Button className="bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-500/30 text-xs px-4 py-2 h-auto">
                      <Plus className="w-4 h-4 mr-1.5" />
                      Create List
                    </Button>
                  }
                  onSuccess={(listId) => {
                    navigate(`/list/${listId}`);
                  }}
                />
              </div>
            </div>

            {/* Lists Grid */}
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-3 text-gray-400">
                  <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
                  <span className="text-sm font-bold uppercase tracking-wider">Loading...</span>
                </div>
              </div>
            ) : popularLists.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={List}
                  title="No lists yet"
                  description="Create the first list and share your favorite race collections"
                />
              </div>
            ) : (() => {
                // Sort lists based on selected filter
                const sortedLists = [...popularLists].sort((a, b) => {
                  if (listFilter === 'recent') {
                    // Sort by creation date (newest first)
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
                    return dateB - dateA;
                  } else if (listFilter === 'liked') {
                    // Sort by likes count (most liked first)
                    return (b.likesCount || 0) - (a.likesCount || 0);
                  } else {
                    // Sort by items count (most items first)
                    const itemsA = a.listType === 'drivers'
                      ? (a.drivers?.length || 0) + (a.pairings?.length || 0)
                      : (a.races?.length || 0);
                    const itemsB = b.listType === 'drivers'
                      ? (b.drivers?.length || 0) + (b.pairings?.length || 0)
                      : (b.races?.length || 0);
                    return itemsB - itemsA;
                  }
                });

                return (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {sortedLists.slice(0, listsToShow).map((list) => (
                        <Card
                          key={list.id}
                          onClick={() => navigate(`/list/${list.id}`)}
                          className="group bg-black/90 border-2 border-red-900/40 hover:border-racing-red transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-red-500/30 cursor-pointer"
                        >
                      {/* Racing accent line */}
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

                      {/* List Cover Image (if exists) */}
                      {list.listImageUrl && (
                        <div className="relative w-full h-32 overflow-hidden bg-black/50">
                          <img
                            src={list.listImageUrl}
                            alt={list.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70 pointer-events-none" />
                          {/* List badge on image */}
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-racing-red border-2 border-black flex items-center justify-center shadow-lg">
                            <List className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="p-3 sm:p-4">
                        {/* Show avatar only if no cover image */}
                        {!list.listImageUrl && (
                          <div className="flex gap-3 mb-3">
                            <div className="flex-shrink-0">
                              <div className="relative">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border-2 border-gray-700 group-hover:border-racing-red transition-all duration-300 overflow-hidden ring-2 ring-black/50">
                                  {list.userAvatar ? (
                                    <img
                                      src={list.userAvatar}
                                      alt={list.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-base font-black text-white drop-shadow-lg uppercase">
                                      {list.username?.charAt(0)?.toUpperCase() || 'U'}
                                    </span>
                                  )}
                                </div>
                                {/* List badge */}
                                <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-racing-red border-2 border-black flex items-center justify-center shadow-lg">
                                  <List className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Content */}
                        <div className="space-y-1.5">
                          {/* Title */}
                          <h3 className="font-bold text-white text-sm sm:text-base leading-tight line-clamp-2">
                            {list.title}
                          </h3>

                          {/* Creator */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <span>by</span>
                            <span className="font-medium text-gray-300">{list.username}</span>
                          </div>

                          {/* Description if exists */}
                          {list.description && (
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                              {list.description}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {list.listType === 'drivers'
                                ? `${(list.drivers?.length || 0) + (list.pairings?.length || 0)} ${((list.drivers?.length || 0) + (list.pairings?.length || 0)) === 1 ? 'item' : 'items'}`
                                : `${list.races?.length || 0} ${(list.races?.length || 0) === 1 ? 'race' : 'races'}`
                              }
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3 fill-racing-red text-racing-red" />
                              {list.likesCount || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                        </Card>
                      ))}
                    </div>

                    {/* View More Button */}
                    {sortedLists.length > listsToShow && (
                      <div className="flex justify-center mt-6">
                        <Button
                          onClick={() => setListsToShow(prev => prev + 10)}
                          variant="outline"
                          className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-black uppercase tracking-wider"
                        >
                          <ArrowRight className="w-4 h-4 mr-2" />
                          View More Lists ({sortedLists.length - listsToShow} remaining)
                        </Button>
                      </div>
                    )}
                  </>
                );
              })()}
          </TabsContent>
        </Tabs>
      </main>
      {/* Rate Season Dialog */}
      <RateSeasonDialog
        open={rateSeasonDialogOpen}
        onOpenChange={setRateSeasonDialogOpen}
        year={selectedSeason}
        onRatingSubmitted={async () => {
          // Reload season ratings
          const [avgRating, userRating] = await Promise.all([
            getSeasonAverageRating(selectedSeason),
            auth.currentUser ? getUserSeasonRating(auth.currentUser.uid, selectedSeason) : Promise.resolve(null)
          ]);
          setSeasonRating(avgRating);
          setUserSeasonRating(userRating?.rating || null);
        }}
      />
    </div>
  );
};

export default Explore;
