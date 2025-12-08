import { Header } from "@/components/Header";
import { RaceCard } from "@/components/RaceCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { CreateListDialog } from "@/components/CreateListDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, List, Calendar, History, MessageCircle, Heart, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicRaceLogs } from "@/services/raceLogs";
import { getPublicLists } from "@/services/lists";
import { getPosterUrl } from "@/services/f1Api";
import { getCurrentSeasonRaces as getFirestoreRaces, getRacesBySeason as getFirestoreRacesBySeason } from "@/services/f1Calendar";

const Explore = () => {
  const navigate = useNavigate();
  const [trendingRaces, setTrendingRaces] = useState<any[]>([]);
  const [topReviews, setTopReviews] = useState<any[]>([]);
  const [popularLists, setPopularLists] = useState<any[]>([]);
  const [upcomingRaces, setUpcomingRaces] = useState<any[]>([]);
  const [selectedSeason, setSelectedSeason] = useState(new Date().getFullYear());
  const [seasonRaces, setSeasonRaces] = useState<any[]>([]);
  const [seasonLoading, setSeasonLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listsToShow, setListsToShow] = useState(10);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [logs, lists, firestoreRaces] = await Promise.all([
          getPublicRaceLogs(50),
          getPublicLists(),
          getFirestoreRaces()
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

        const sortedLists = lists
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));

        setPopularLists(sortedLists);

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

  useEffect(() => {
    const loadSeasonRaces = async () => {
      setSeasonLoading(true);
      try {
        const firestoreRaces = await getFirestoreRacesBySeason(selectedSeason);
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
      } catch (error) {
        console.error('Error loading season races:', error);
        setSeasonRaces([]);
      } finally {
        setSeasonLoading(false);
      }
    };

    loadSeasonRaces();
  }, [selectedSeason]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8 pb-4 border-b-2 border-red-900/30">
          <div className="inline-block px-4 py-1 bg-racing-red/20 border border-racing-red rounded-full mb-2">
            <span className="text-racing-red font-black text-xs tracking-widest">TRACK BROWSER</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">EXPLORE RACES</h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 font-bold uppercase tracking-wider">
            Browse seasons · Trending · Reviews · Lists
          </p>
        </div>

        <Tabs defaultValue="seasons" className="space-y-6">
          <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="w-full sm:w-auto inline-flex min-w-max border-2 border-red-900/30 bg-black/50">
              <TabsTrigger value="seasons" className="gap-1 sm:gap-2 text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3 font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Browse </span>Seasons
              </TabsTrigger>
              <TabsTrigger value="trending" className="gap-1 sm:gap-2 text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3 font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Trending</span>
                <span className="xs:hidden">Trend</span>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-1 sm:gap-2 text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3 font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">
                <Star className="w-3 h-3 sm:w-4 sm:h-4" />
                Reviews
              </TabsTrigger>
              <TabsTrigger value="lists" className="gap-1 sm:gap-2 text-[10px] sm:text-xs whitespace-nowrap px-2 sm:px-3 font-black uppercase tracking-wider data-[state=active]:bg-racing-red data-[state=active]:text-white">
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
                Lists
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="seasons" className="space-y-6">
            <div>
              <div className="inline-block px-4 py-1 bg-racing-red/20 border border-racing-red rounded-full mb-2">
                <span className="text-racing-red font-black text-xs tracking-widest">SEASON ARCHIVE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">BROWSE BY SEASON</h2>
              <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider mb-6">Select a season to view all races</p>

              <div className="flex flex-wrap gap-2 mb-6">
                {[2025, 2024, 2023, 2022, 2021, 2020].map((year) => (
                  <Button
                    key={year}
                    variant={selectedSeason === year ? "default" : "outline"}
                    onClick={() => setSelectedSeason(year)}
                    className={`min-w-[4rem] font-black uppercase tracking-wider ${
                      selectedSeason === year
                        ? 'bg-racing-red hover:bg-red-600 border-2 border-red-400 shadow-lg shadow-red-500/30'
                        : 'border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {year}
                  </Button>
                ))}
              </div>

              {seasonLoading ? (
                <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading {selectedSeason} season...</div>
              ) : seasonRaces.length === 0 ? (
                <EmptyState
                  icon={History}
                  title={`No races found for ${selectedSeason}`}
                  description="Try selecting a different season or check back later"
                />
              ) : (
                <>
                  <p className="text-xs text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)] mb-2">Showing {seasonRaces.length} races for {selectedSeason}</p>
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
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trending" className="space-y-6">
            <div>
              <div className="inline-block px-4 py-1 bg-racing-red/20 border border-racing-red rounded-full mb-2">
                <span className="text-racing-red font-black text-xs tracking-widest">HOT LAPS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">TRENDING RACES</h2>
              <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider mb-6">Most logged races in the paddock</p>
              {loading ? (
                <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
              ) : trendingRaces.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No trending races yet"
                  description="Start logging races to see what's trending in the community"
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
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
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div>
              <div className="inline-block px-4 py-1 bg-racing-red/20 border border-racing-red rounded-full mb-2">
                <span className="text-racing-red font-black text-xs tracking-widest">RACE ANALYSIS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">TOP REVIEWS</h2>
              <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider mb-6">Most liked race reviews</p>

              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse" />
                    <span className="text-sm">Loading reviews...</span>
                  </div>
                </div>
              ) : topReviews.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  description="Be the first to write a review and share your thoughts on F1 races"
                />
              ) : (
                <div className="space-y-3 sm:space-y-4 md:space-y-5 max-w-3xl mx-auto">
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
            </div>
          </TabsContent>

          <TabsContent value="lists" className="space-y-4">
            <div>
              <div className="inline-block px-4 py-1 bg-racing-red/20 border border-racing-red rounded-full mb-2">
                <span className="text-racing-red font-black text-xs tracking-widest">COLLECTIONS</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">POPULAR LISTS</h2>
                <CreateListDialog
                  trigger={
                    <Button className="bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-500/30">
                      <Plus className="w-4 h-4 mr-2" />
                      Create List
                    </Button>
                  }
                  onSuccess={(listId) => {
                    // Navigate to the newly created list
                    navigate(`/list/${listId}`);
                  }}
                />
              </div>
              <p className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider mb-6">Top rated race collections</p>

              {loading ? (
                <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
              ) : popularLists.length === 0 ? (
                <EmptyState
                  icon={List}
                  title="No lists yet"
                  description="Create the first list and share your favorite race collections"
                />
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {popularLists.slice(0, listsToShow).map((list) => (
                      <Card
                        key={list.id}
                        onClick={() => navigate(`/list/${list.id}`)}
                        className="group bg-black/90 border-2 border-red-900/40 hover:border-racing-red transition-all duration-300 relative overflow-hidden backdrop-blur-sm shadow-lg hover:shadow-xl hover:shadow-red-500/30 cursor-pointer"
                      >
                      {/* Racing accent line */}
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

                      {/* List Cover Image (if exists) */}
                      {list.listImageUrl && (
                        <div className="relative w-full h-32 overflow-hidden">
                          <img
                            src={list.listImageUrl}
                            alt={list.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70" />
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
                              {list.races?.length || 0} races
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
                {popularLists.length > listsToShow && (
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={() => setListsToShow(prev => prev + 10)}
                      variant="outline"
                      className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase tracking-wider"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      View More Lists ({popularLists.length - listsToShow} remaining)
                    </Button>
                  </div>
                )}
              </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Explore;
