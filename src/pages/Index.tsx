import { Header } from "@/components/Header";
import { RaceCard } from "@/components/RaceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getPublicRaceLogs } from "@/services/raceLogs";
import { getPosterUrl, getRaceWinner } from "@/services/f1Api";
import { getCurrentSeasonRaces as getFirestoreRaces } from "@/services/f1Calendar";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getGlobalActivity, Activity } from "@/services/activity";

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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get races from Firestore instead of external APIs
        const f1Races = await getFirestoreRaces();
        console.log('[Index] getFirestoreRaces returned:', f1Races.length, 'races');

        if (Array.isArray(f1Races) && f1Races.length > 0) {
          // Sort races by date in descending order (most recent first)
          const sortedRaces = [...f1Races].sort((a, b) =>
            new Date(b.dateStart).getTime() - new Date(a.dateStart).getTime()
          );

          // Take the 6 most recent races
          const racesToShow = sortedRaces.slice(0, 6);
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

            const winnerPromises = convertedRaces
              .filter(race => new Date(race.date_start) < today)
              .map(async (race) => {
                try {
                  const winner = await getRaceWinner(race.year, race.round);
                  if (winner) {
                    return { key: `${race.year}-${race.round}`, winner };
                  }
                } catch (error) {
                  console.error(`Error fetching winner for ${race.year} round ${race.round}:`, error);
                }
                return null;
              });

            try {
              const winnerResults = await Promise.all(winnerPromises);
              winnerResults.forEach(result => {
                if (result) {
                  winnersMap[result.key] = result.winner;
                }
              });
              setWinners(winnersMap);
            } catch (error) {
              console.error('Error fetching winners:', error);
              // Still set empty winners map so cards display without winners
              setWinners({});
            }
          };

          // Fetch winners in background, don't await
          fetchWinners();
        } else {
          // No races returned from API - set empty array so UI shows "No races available"
          console.log('[Index] No races returned from API');
          setCurrentRaces([]);
        }

        try {
          // Fetch activities
          const activityFeed = await getGlobalActivity(50);
          console.log('[Index] Loaded activities:', activityFeed.length);
          setActivities(activityFeed);

          // Also fetch public logs for the race cards
          const publicLogs = await getPublicRaceLogs(100);
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
        } catch (logError) {
          console.error('Error loading public logs:', logError);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tagFilter]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10 space-y-8 sm:space-y-12 md:space-y-16">
        {/* Hero Section */}
        <section className="relative text-center space-y-4 py-12 sm:py-20 md:py-24 px-3 sm:px-6 md:px-8 rounded-2xl overflow-hidden border-2 border-red-900/50">
          {/* Background Image */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${import.meta.env.BASE_URL}ferrari-f1.jpg)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center center',
              opacity: 0.55,
              filter: 'grayscale(0%) brightness(1.0)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80 z-0" />

          {/* Racing stripes */}
          <div className="absolute left-0 top-0 w-1 h-full bg-racing-red z-0" />
          <div className="absolute right-0 top-0 w-1 h-full bg-racing-red z-0" />

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
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">RECENT & UPCOMING GRAND PRIX</h2>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Recent & Upcoming F1 Races</p>
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
              <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-wider">Showing {currentRaces.length} races</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
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

        <section className="space-y-6">
          <div className="pb-2 border-b-2 border-red-900/50">
            <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-2">
              <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">
                {tagFilter ? `#${tagFilter.toUpperCase()}` : 'COMMUNITY'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {tagFilter ? `TAGGED RACES` : 'RECENTLY LOGGED'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {tagFilter ? `${popularRaces.length} Race${popularRaces.length === 1 ? '' : 's'} Found` : 'Latest from the Paddock'}
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
              <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No races logged yet</p>
              <p className="text-sm mt-2 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Be the first to log a race!</p>
            </div>
          )}
        </section>

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
