import { Header } from "@/components/Header";
import { RaceCard } from "@/components/RaceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowRight, X, Sparkles, Star } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { getPublicRaceLogs } from "@/services/raceLogs";
import { getPosterUrl } from "@/services/f1Api";
import { getRaceWinner } from "@/data/raceWinners2010-2019";
import { getCurrentSeasonRaces as getFirestoreRaces } from "@/services/f1Calendar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getGlobalActivity, Activity } from "@/services/activity";
import { getSeasonAverageRating } from "@/services/seasonRatings";

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag');
  const [currentRaces, setCurrentRaces] = useState<any[]>([]);
  const [popularRaces, setPopularRaces] = useState<any[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [winners, setWinners] = useState<{ [key: string]: string }>({});
  const lastFetchTime = useRef<number>(0);
  const [seasonRatings, setSeasonRatings] = useState<{ year: number; average: number; count: number }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Check if we have fresh data (less than 5 minutes old)
      const now = Date.now();
      const useCache = now - lastFetchTime.current < CACHE_DURATION && currentRaces.length > 0;

      if (useCache) {
        console.log('[Index] Using cached data for races, but refreshing season ratings');
        // Still refresh season ratings even when using cache
        try {
          const seasonRatingsData = await Promise.all([2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010].map(async (year) => {
            const rating = await getSeasonAverageRating(year);
            return { year, ...rating };
          }));
          console.log('[Index] Season ratings refreshed:', seasonRatingsData);
          setSeasonRatings(seasonRatingsData.sort((a, b) => b.average - a.average));
        } catch (err) {
          console.error('Error refreshing season ratings:', err);
        }
        return;
      }

      try {
        lastFetchTime.current = now;

        // Load races, activities, public logs, and season ratings in parallel
        const [f1Races, activityFeed, publicLogs, seasonRatingsData] = await Promise.all([
          getFirestoreRaces().catch(err => {
            console.error('Error loading races:', err);
            return [];
          }),
          getGlobalActivity(50).catch(err => {
            console.error('Error loading activities:', err);
            return [];
          }),
          getPublicRaceLogs(100).catch(err => {
            console.error('Error loading public logs:', err);
            return [];
          }),
          Promise.all([2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010].map(async (year) => {
            const rating = await getSeasonAverageRating(year);
            return { year, ...rating };
          })).catch(err => {
            console.error('Error loading season ratings:', err);
            return [];
          })
        ]);

        console.log('[Index] getFirestoreRaces returned:', f1Races.length, 'races');
        console.log('[Index] Loaded activities:', activityFeed.length);

        if (Array.isArray(f1Races) && f1Races.length > 0) {
          // Sort races by date in descending order (most recent first)
          const sortedRaces = [...f1Races].sort((a, b) =>
            new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
          );

          // Take the 4 most recent races
          const racesToShow = sortedRaces.slice(0, 4);
          console.log('[Index] Setting currentRaces:', racesToShow.length);

          // Convert to expected format
          const convertedRaces = racesToShow.map(race => ({
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

          setCurrentRaces(convertedRaces);

          // Fetch winners for past races asynchronously (don't block card rendering)
          const fetchWinners = async () => {
            const today = new Date();
            const winnersMap: { [key: string]: string } = {};

            // Get winners from hardcoded data (instant, no API calls)
            convertedRaces
              .filter(race => new Date(race.date_start) < today)
              .forEach((race) => {
                const winner = getRaceWinner(race.year, race.round);
                if (winner) {
                  winnersMap[`${race.year}-${race.round}`] = winner;
                }
              });

            setWinners(winnersMap);
          };

          // Fetch winners in background, don't await
          fetchWinners();
        } else {
          // No races returned from API - set empty array so UI shows "No races available"
          console.log('[Index] No races returned from API');
          setCurrentRaces([]);
        }

        // Set activities
        setActivities(activityFeed);

        // Set public logs
        if (Array.isArray(publicLogs) && publicLogs.length > 0) {
          // Filter by tag if present
          if (tagFilter) {
            const filtered = publicLogs.filter(log =>
              log.tags && log.tags.includes(tagFilter)
            );
            setPopularRaces(filtered);
          } else {
            setPopularRaces(publicLogs.slice(0, 6));
          }
        }

        // Set season ratings sorted by average rating
        console.log('[Index] Season ratings loaded:', seasonRatingsData);
        const sortedRatings = seasonRatingsData.sort((a, b) => b.average - a.average);
        console.log('[Index] Sorted season ratings:', sortedRatings);
        console.log('[Index] Ratings with count > 0:', sortedRatings.filter(s => s.count > 0));
        setSeasonRatings(sortedRatings);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Listen for visibility change to prevent unnecessary refetches
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Only refetch if data is stale
        const now = Date.now();
        if (now - lastFetchTime.current >= CACHE_DURATION) {
          console.log('[Index] Page became visible and data is stale, refetching...');
          loadData();
        } else {
          console.log('[Index] Page became visible but data is fresh, skipping refetch');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tagFilter]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 space-y-8 sm:space-y-12 md:space-y-16">
        {/* Hero Section */}
        <section className="relative text-center space-y-4 py-12 sm:py-20 md:py-24 px-3 sm:px-6 md:px-8 rounded-2xl overflow-hidden">
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(/ferrari-f1.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              opacity: 0.55,
              filter: 'grayscale(0%) brightness(1.0)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80 z-0" />

          {/* Content */}
          <div className="relative z-10">
            <div className="inline-block px-4 py-1.5 sm:px-6 sm:py-2 bg-black/70 backdrop-blur-sm border-2 border-racing-red rounded-full mb-4 sm:mb-6">
              <span className="text-racing-red font-black text-[10px] sm:text-xs tracking-widest drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">RACE CONTROL</span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 sm:mb-6 leading-tight tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              <span className="block">TRACK <span className="text-racing-red drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]">EVERY</span></span>
              <span className="block text-racing-red drop-shadow-[0_0_12px_rgba(220,38,38,0.8)]">RACE</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-white max-w-2xl mx-auto px-2 sm:px-4 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Your personal <span className="text-racing-red drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">F1 TELEMETRY</span>
              <span className="hidden sm:inline">. Log races, track stats, dominate leaderboards.</span> 🏎️
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-6 sm:pt-8 px-4">
              <Button
                size="lg"
                className="gap-2 w-full sm:w-auto bg-racing-red hover:bg-red-600 shadow-xl shadow-red-500/50 border-2 border-red-400 font-black uppercase tracking-wider text-sm sm:text-base"
                onClick={() => navigate('/diary')}
              >
                Lights Out <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-racing-red bg-black/70 text-white hover:bg-racing-red/20 font-bold uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-sm sm:text-base"
                onClick={() => navigate('/explore')}
              >
                Pit Stop
              </Button>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="relative text-center py-6 sm:py-8 px-4 sm:px-6 rounded-xl border-2 border-racing-red/30 bg-black/40 backdrop-blur-sm">
          <div className="space-y-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
              How to support <span className="text-racing-red">BoxBoxd</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
              Help us keep the lights on and keep BoxBoxd ad free
            </p>
            <a
              href="https://buymeacoffee.com/shaygrandpx"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-400 text-black font-bold rounded-lg transition-all duration-300 shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 text-sm sm:text-base"
            >
              <span>☕</span>
              <span>Buy me a coffee</span>
            </a>
          </div>
        </section>

        {tagFilter && (
          <div className="flex flex-wrap items-center gap-2 p-3 sm:p-4 bg-racing-red/10 border border-racing-red/20 rounded-lg">
            <span className="text-xs sm:text-sm font-medium">Filtering by tag:</span>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              #{tagFilter}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-8 gap-1.5"
              onClick={() => navigate('/home')}
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="text-xs sm:text-sm">Clear</span>
            </Button>
          </div>
        )}

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b-2 border-red-900/50">
            <div>
              <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-2">
                <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">LATEST RACES</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">RECENT GRAND PRIX</h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Recent F1 Races</p>
            </div>
            <Button
              variant="outline"
              className="gap-2 self-start sm:self-auto border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
              onClick={() => navigate('/explore')}
            >
              View All <ArrowRight className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
            </Button>
          </div>

          {error ? (
            <div className="text-center py-12 text-racing-red font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Error: {error}</div>
          ) : loading ? (
            <div className="text-center py-12 text-gray-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Loading races...</div>
          ) : currentRaces.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {currentRaces.map((race) => {
                  const posterUrl = getPosterUrl(race.circuit_short_name || race.circuit_key);
                  const winnerKey = `${race.year}-${race.round}`;
                  const winner = winners[winnerKey];
                  return (
                    <RaceCard
                      key={race.meeting_key}
                      season={race.year}
                      round={race.round}
                      gpName={race.meeting_name}
                      circuit={race.circuit_short_name}
                      date={race.date_start}
                      country={race.country_code}
                      posterUrl={posterUrl || undefined}
                      winner={winner}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No races available</div>
          )}
        </section>

        {/* Season Leaderboard */}
        {!tagFilter && seasonRatings.filter(s => s.count > 0).length > 0 && (
          <section className="space-y-6 bg-gradient-to-b from-black/80 via-racing-red/5 to-black/80 p-6 rounded-xl border-2 border-racing-red/20 backdrop-blur-sm shadow-[0_0_40px_rgba(220,38,38,0.1)]">
            {/* Section Header with Racing Flair */}
            <div className="relative overflow-hidden bg-gradient-to-r from-black via-racing-red/10 to-black p-4 rounded-lg border-2 border-racing-red/30">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(220,38,38,0.05)_10px,rgba(220,38,38,0.05)_20px)]" />
              <div className="relative flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-1 w-8 bg-racing-red shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                    <div className="h-1 w-8 bg-white" />
                    <div className="h-1 w-8 bg-racing-red shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase">
                    BEST RATED <span className="text-racing-red drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]">SEASONS</span>
                  </h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Championship Standings</p>
                </div>
                <Star className="w-12 h-12 text-racing-red/20" />
              </div>
            </div>

            {/* Podium Display - Top 3 */}
            <div className="relative">
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                {/* 2nd Place */}
                {seasonRatings.filter(s => s.count > 0)[1] && (() => {
                  const season = seasonRatings.filter(s => s.count > 0)[1];
                  const percentage = (season.average / 5) * 100;
                  return (
                    <div
                      className="flex flex-col items-center flex-1 max-w-[160px] cursor-pointer group"
                      onClick={() => navigate(`/explore?tab=seasons&season=${season.year}`)}
                    >
                      {/* Position indicator */}
                      <div className="mb-4">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded opacity-20 blur-sm" />
                          <div className="relative w-10 h-10 bg-gradient-to-br from-gray-700 to-gray-900 border border-gray-600/50 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                            <span className="text-xl font-black text-gray-400">2</span>
                          </div>
                        </div>
                      </div>

                      {/* Season year */}
                      <div className="mb-2 text-center">
                        <div className="text-2xl font-black text-white group-hover:text-gray-400 transition-colors tracking-tight">
                          {season.year}
                        </div>
                        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">
                          Season
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="mb-3 bg-black/40 px-4 py-2 rounded border border-gray-800/50 text-center">
                        <div className="text-3xl font-black text-gray-400 tracking-tighter leading-none">
                          {season.average.toFixed(1)}
                        </div>
                      </div>

                      {/* Podium block */}
                      <div className="w-full relative">
                        <div className="h-28 bg-gradient-to-b from-gray-800 to-gray-900 border-t-2 border-gray-700/50 relative overflow-hidden group-hover:border-gray-600 transition-colors">
                          {/* Vertical accent line */}
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent" />
                          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-600 to-transparent" />

                          {/* Position number on podium */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl font-black text-gray-700/30">
                            2
                          </div>

                          {/* Performance indicator */}
                          <div className="absolute bottom-0 left-0 right-0">
                            <div className="h-1 bg-gray-950">
                              <div
                                className="h-full bg-gradient-to-r from-gray-600 to-gray-700 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 1st Place - Taller */}
                {seasonRatings.filter(s => s.count > 0)[0] && (() => {
                  const season = seasonRatings.filter(s => s.count > 0)[0];
                  const percentage = (season.average / 5) * 100;
                  return (
                    <div
                      className="flex flex-col items-center flex-1 max-w-[160px] cursor-pointer group"
                      onClick={() => navigate(`/explore?tab=seasons&season=${season.year}`)}
                    >
                      {/* Position indicator */}
                      <div className="mb-4">
                        <div className="relative w-14 h-14 flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-racing-red to-red-900 rounded opacity-30 blur-md" />
                          <div className="relative w-12 h-12 bg-gradient-to-br from-racing-red to-red-900 border border-racing-red/50 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                            <span className="text-2xl font-black text-white">1</span>
                          </div>
                        </div>
                      </div>

                      {/* Season year */}
                      <div className="mb-2 text-center">
                        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-racing-red group-hover:to-white transition-all tracking-tight">
                          {season.year}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                          Champion Season
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="mb-3 bg-racing-red/10 px-4 py-2 rounded border border-racing-red/30 text-center">
                        <div className="text-4xl font-black text-racing-red tracking-tighter leading-none">
                          {season.average.toFixed(1)}
                        </div>
                      </div>

                      {/* Podium block - Tallest */}
                      <div className="w-full relative">
                        <div className="h-36 bg-gradient-to-b from-red-950 to-black border-t-2 border-racing-red/50 relative overflow-hidden group-hover:border-racing-red transition-colors">
                          {/* Vertical accent lines */}
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-racing-red/40 to-transparent" />
                          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-racing-red/40 to-transparent" />

                          {/* Center accent */}
                          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-px h-full bg-gradient-to-b from-racing-red/20 via-transparent to-transparent" />

                          {/* Position number on podium */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 text-5xl font-black text-racing-red/20">
                            1
                          </div>

                          {/* Performance indicator */}
                          <div className="absolute bottom-0 left-0 right-0">
                            <div className="h-1 bg-gray-950">
                              <div
                                className="h-full bg-gradient-to-r from-racing-red to-red-600 transition-all duration-500 shadow-[0_0_8px_rgba(220,38,38,0.5)]"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3rd Place */}
                {seasonRatings.filter(s => s.count > 0)[2] && (() => {
                  const season = seasonRatings.filter(s => s.count > 0)[2];
                  const percentage = (season.average / 5) * 100;
                  return (
                    <div
                      className="flex flex-col items-center flex-1 max-w-[160px] cursor-pointer group"
                      onClick={() => navigate(`/explore?tab=seasons&season=${season.year}`)}
                    >
                      {/* Position indicator */}
                      <div className="mb-4">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-900 to-orange-950 rounded opacity-20 blur-sm" />
                          <div className="relative w-10 h-10 bg-gradient-to-br from-orange-900 to-orange-950 border border-orange-800/50 flex items-center justify-center" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                            <span className="text-xl font-black text-orange-700">3</span>
                          </div>
                        </div>
                      </div>

                      {/* Season year */}
                      <div className="mb-2 text-center">
                        <div className="text-2xl font-black text-white group-hover:text-orange-700 transition-colors tracking-tight">
                          {season.year}
                        </div>
                        <div className="text-[10px] text-gray-600 font-bold uppercase tracking-wider mt-0.5">
                          Season
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="mb-3 bg-black/40 px-4 py-2 rounded border border-orange-900/30 text-center">
                        <div className="text-3xl font-black text-orange-700 tracking-tighter leading-none">
                          {season.average.toFixed(1)}
                        </div>
                      </div>

                      {/* Podium block - Shortest */}
                      <div className="w-full relative">
                        <div className="h-20 bg-gradient-to-b from-orange-950 to-black border-t-2 border-orange-900/50 relative overflow-hidden group-hover:border-orange-800 transition-colors">
                          {/* Vertical accent lines */}
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-orange-900/40 to-transparent" />
                          <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-orange-900/40 to-transparent" />

                          {/* Position number on podium */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-3xl font-black text-orange-900/30">
                            3
                          </div>

                          {/* Performance indicator */}
                          <div className="absolute bottom-0 left-0 right-0">
                            <div className="h-1 bg-gray-950">
                              <div
                                className="h-full bg-gradient-to-r from-orange-800 to-orange-900 transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Podium platform */}
              <div className="w-full h-3 bg-gradient-to-b from-gray-900 to-black border-t border-red-900/30 mt-0" />
            </div>
          </section>
        )}

        {/* Formula Wrapped Section */}
        <section
          className="relative overflow-hidden rounded-2xl border-2 border-racing-red/60 bg-gradient-to-br from-racing-red/20 via-black to-black cursor-pointer group hover:border-racing-red transition-all duration-300"
          onClick={() => navigate('/wrapped')}
        >
          {/* Animated background effects */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-full h-1 bg-racing-red animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-racing-red animate-pulse" />
            <div className="absolute top-1/4 -left-full w-full h-16 bg-gradient-to-r from-transparent via-racing-red to-transparent skew-y-12 animate-[slide_3s_ease-in-out_infinite]" />
          </div>

          {/* Checkered flag pattern */}
          <div className="absolute top-4 right-4 w-12 h-12 opacity-20 group-hover:opacity-30 transition-opacity" style={{
            backgroundImage: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
            backgroundPosition: '0 0, 8px 8px',
            backgroundSize: '16px 16px'
          }} />

          <div className="relative z-10 p-8 sm:p-12 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-racing-red/20 backdrop-blur-sm border-2 border-racing-red rounded-full mb-2">
              <Sparkles className="w-4 h-4 text-racing-red animate-pulse" />
              <span className="text-racing-red font-black text-xs tracking-widest">YOUR 2025 WRAPPED</span>
              <Sparkles className="w-4 h-4 text-racing-red animate-pulse" />
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              FORMULA <span className="text-racing-red drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">WRAPPED</span>
            </h2>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto font-bold">
              From a calm season to a three contenders finale. How was your 2025?
            </p>

            <div className="flex gap-2 justify-center my-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className={`h-1 w-3 ${i % 2 === 0 ? 'bg-racing-red' : 'bg-white'}`} />
              ))}
            </div>

            <Button
              size="lg"
              className="gap-2 bg-racing-red hover:bg-red-600 shadow-xl shadow-red-500/50 border-2 border-red-400 font-black uppercase tracking-wider group-hover:scale-105 transition-transform"
            >
              <Sparkles className="w-5 h-5" />
              View Your Wrapped
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </section>

        {tagFilter && (
          <section className="space-y-6">
            <div className="pb-2 border-b-2 border-red-900/50">
              <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-2">
                <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">
                  #{tagFilter.toUpperCase()}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                TAGGED RACES
              </h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {popularRaces.length} Race${popularRaces.length === 1 ? '' : 's'} Found
              </p>
            </div>

          {loading ? (
            <div className="text-center py-12 text-gray-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Loading...</div>
          ) : popularRaces.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {popularRaces.map((race) => (
                <RaceCard
                  key={race.id}
                  id={race.id}
                  season={race.raceYear}
                  round={1}
                  gpName={race.raceName}
                  circuit={race.raceLocation}
                  date={race.dateWatched?.toDate?.()?.toISOString() || ''}
                  rating={race.rating}
                  watched={true}
                  country={race.countryCode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No races found with this tag</p>
              <p className="text-sm mt-2 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Try a different tag</p>
            </div>
          )}
          </section>
        )}

        {/* Footer */}
        <footer className="border-t-2 border-red-900/50 mt-16 pt-8 pb-12">
          <div className="text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <a href="/support" className="text-gray-400 hover:text-racing-red transition-colors font-bold uppercase tracking-wider">
                Support
              </a>
              <span className="text-red-900">•</span>
              <a href="/privacy-policy" className="text-gray-400 hover:text-racing-red transition-colors font-bold uppercase tracking-wider">
                Privacy
              </a>
              <span className="text-red-900">•</span>
              <a href="/terms-of-service" className="text-gray-400 hover:text-racing-red transition-colors font-bold uppercase tracking-wider">
                Terms
              </a>
            </div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              © 2025 BoxBoxd. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
