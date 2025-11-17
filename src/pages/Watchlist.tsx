import { Header } from "@/components/Header";
import { RaceCard } from "@/components/RaceCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { getUserWatchlist } from "@/services/watchlist";
import { getRacesBySeason as getFirestoreRacesBySeason } from "@/services/f1Calendar";
import { onAuthStateChanged } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Watchlist = () => {
  const { user } = useAuth();
  const [upcomingRaces, setUpcomingRaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterValue, setFilterValue] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    // Wait for auth state to be ready
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('[Watchlist Page] Auth state changed, user logged in:', user.uid);
        loadWatchlist();
      } else {
        console.log('[Watchlist Page] Auth state changed, no user');
        setLoading(false);
        setUpcomingRaces([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadWatchlist = async () => {
    if (!user) {
      console.log('[Watchlist Page] No user authenticated');
      setLoading(false);
      return;
    }

    console.log('[Watchlist Page] Loading watchlist for user:', user.uid);
    setLoading(true);
    try {
      const items = await getUserWatchlist(user.uid);
      console.log('[Watchlist Page] Received items:', items.length);

      // Group items by year to minimize API calls
      const yearMap = new Map<number, any[]>();
      items.forEach(item => {
        if (!yearMap.has(item.raceYear)) {
          yearMap.set(item.raceYear, []);
        }
        yearMap.get(item.raceYear)!.push(item);
      });

      // Fetch F1 data for each year from Firestore
      const yearRacesMap = new Map<number, any[]>();
      for (const year of yearMap.keys()) {
        try {
          const firestoreRaces = await getFirestoreRacesBySeason(year);
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
          yearRacesMap.set(year, races);
        } catch (error) {
          console.warn(`[Watchlist Page] Failed to fetch F1 data for year ${year}:`, error);
          yearRacesMap.set(year, []);
        }
      }

      const formattedRaces = items.map((item, index) => {
        // Handle both Timestamp and Date objects
        let dateString: string;
        if (item.raceDate && typeof item.raceDate === 'object' && 'toDate' in item.raceDate) {
          // It's a Firestore Timestamp
          dateString = item.raceDate.toDate().toISOString();
        } else if (item.raceDate instanceof Date) {
          // It's a Date object
          dateString = item.raceDate.toISOString();
        } else {
          // Fallback to string representation
          dateString = item.raceDate.toString();
        }

        // Try to find the race in F1 API data to get the correct round number
        const yearRaces = yearRacesMap.get(item.raceYear) || [];
        const matchedRace = yearRaces.find(r =>
          r.meeting_name.toLowerCase().includes(item.raceName.toLowerCase()) ||
          item.raceName.toLowerCase().includes(r.meeting_name.toLowerCase())
        );

        const formattedRace = {
          // Don't pass id so RaceCard uses season/round for navigation
          season: item.raceYear,
          round: matchedRace?.round || index + 1, // Use F1 API round if available, otherwise use index
          gpName: item.raceName,
          circuit: item.raceLocation,
          date: dateString,
          country: matchedRace?.country_code,
        };

        console.log('[Watchlist Page] Formatted race:', formattedRace);
        return formattedRace;
      });

      console.log('[Watchlist Page] Setting races:', formattedRaces);
      setUpcomingRaces(formattedRaces);
    } catch (error) {
      console.error('[Watchlist Page] Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    toast({ title: "Refreshing watchlist..." });
    await loadWatchlist();
    toast({ title: "Watchlist refreshed" });
  };

  // Filter races based on selected year
  const filteredRaces = filterValue === "all"
    ? upcomingRaces
    : upcomingRaces.filter(race => race.season.toString() === filterValue);

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b-2 border-red-900/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-12 bg-racing-red rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full">
                <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">WATCHLIST</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">UPCOMING RACES</h1>
            <p className="text-sm sm:text-base text-gray-300 mt-2 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {filteredRaces.length} {filterValue !== "all" ? `${filterValue} ` : ''}RACE{filteredRaces.length === 1 ? '' : 'S'} QUEUED
            </p>
          </div>

          <div className="flex flex-col xs:flex-row gap-2 self-start sm:self-auto">
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="w-full xs:w-[140px] sm:w-[180px] bg-black/60 border-2 border-red-900/50 text-white font-bold hover:border-racing-red">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-2 border-red-900/50">
                <SelectItem value="all" className="text-white font-bold uppercase">All Races</SelectItem>
                <SelectItem value="2025" className="text-white font-bold uppercase">2025 Season</SelectItem>
                <SelectItem value="2024" className="text-white font-bold uppercase">2024 Season</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 flex-1 xs:flex-initial bg-black/60 border-2 border-red-900/50 text-white hover:bg-racing-red hover:text-white hover:border-racing-red font-black uppercase tracking-wider" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden xs:inline">Refresh</span>
              </Button>

              <Button variant="outline" className="gap-2 flex-1 xs:flex-initial bg-black/60 border-2 border-red-900/50 text-white hover:bg-racing-red hover:text-white hover:border-racing-red font-black uppercase tracking-wider">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-300 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Loading...</div>
        ) : filteredRaces.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{filterValue === "all" ? "YOUR WATCHLIST IS EMPTY" : `NO RACES FROM ${filterValue} SEASON`}</p>
            <p className="text-sm mt-2 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{filterValue === "all" ? "Add races you want to watch!" : "Try selecting a different season"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredRaces.map((race, idx) => (
              <RaceCard key={idx} {...race} showWatchlistButton={false} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Watchlist;
