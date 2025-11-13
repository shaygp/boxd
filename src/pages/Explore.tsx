import { Header } from "@/components/Header";
import { RaceCard } from "@/components/RaceCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, Star, List, Calendar, History } from "lucide-react";
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
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
          .slice(0, 6);

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
                <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
              ) : topReviews.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="No reviews yet"
                  description="Be the first to write a review and share your thoughts on F1 races"
                />
              ) : (
                topReviews.map((review) => (
                  <Card
                    key={review.id}
                    className="p-6 space-y-4 hover:ring-2 hover:ring-racing-red border-2 border-red-900/40 bg-black/90 backdrop-blur transition-all cursor-pointer"
                    onClick={() => navigate(`/race/${review.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-black/80 border-2 border-racing-red/40 flex items-center justify-center font-bold overflow-hidden shadow-lg">
                        {review.userAvatar ? (
                          <img
                            src={review.userAvatar}
                            alt={review.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{review.username?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-black text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{review.username}</span>
                          <span className="text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">reviewed</span>
                          <span className="font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{review.raceName} {review.raceYear}</span>
                          <div className="flex items-center gap-1 ml-auto">
                            <Star className="w-4 h-4 fill-racing-red text-racing-red" />
                            <span className="text-sm font-black text-racing-red drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-200 font-medium mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                          {review.review.substring(0, 200)}...
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                          <span>❤️ {review.likesCount || 0} likes</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="lists" className="space-y-4">
            <div>
              <div className="inline-block px-4 py-1 bg-racing-red/20 border border-racing-red rounded-full mb-2">
                <span className="text-racing-red font-black text-xs tracking-widest">COLLECTIONS</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2">POPULAR LISTS</h2>
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
                <div className="grid md:grid-cols-2 gap-4">
                  {popularLists.map((list) => (
                    <Card key={list.id} className="p-6 space-y-4 hover:ring-2 hover:ring-racing-red border-2 border-red-900/40 bg-black/90 backdrop-blur transition-all cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-racing-red/20 rounded-lg flex items-center justify-center border-2 border-racing-red/40 shadow-lg shadow-red-500/30">
                          <List className="w-6 h-6 text-racing-red drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-white text-lg mb-1 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{list.title}</h3>
                          <p className="text-sm text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                            by {list.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-300 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                        <span>{list.races?.length || 0} races</span>
                        <span>❤️ {list.likesCount || 0} likes</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Explore;
