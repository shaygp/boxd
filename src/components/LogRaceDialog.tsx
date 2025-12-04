import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { StarRating } from "@/components/StarRating";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Plus, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { createRaceLog, updateRaceLog } from "@/services/raceLogs";
import { createActivity } from "@/services/activity";
import { getUserProfile } from "@/services/auth";
import { getCountryCodeFromName, getRaceWinner } from "@/services/f1Api";
import { getRaceByNameAndYear } from "@/services/f1Calendar";
import { useToast } from "@/hooks/use-toast";
import { Timestamp } from "firebase/firestore";

interface LogRaceDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  existingLog?: any; // Existing log data for editing
  editMode?: boolean;
  defaultCircuit?: string; // Pre-fill circuit
  defaultRaceName?: string; // Pre-fill race name
  defaultYear?: number; // Pre-fill year
  defaultCountryCode?: string; // Pre-fill country code
}

export const LogRaceDialog = ({
  trigger,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
  existingLog,
  editMode = false,
  defaultCircuit,
  defaultRaceName,
  defaultYear,
  defaultCountryCode,
}: LogRaceDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [date, setDate] = useState<Date>(new Date());
  const [rating, setRating] = useState(0);
  const [spoiler, setSpoiler] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [raceLocation, setRaceLocation] = useState("");
  const [selectedCircuitId, setSelectedCircuitId] = useState("");
  const [raceYear, setRaceYear] = useState(new Date().getFullYear());
  const [sessionType, setSessionType] = useState<'race' | 'sprint' | 'qualifying' | 'sprintQualifying'>('race');
  const [watchMode, setWatchMode] = useState<'live' | 'replay' | 'tvBroadcast' | 'highlights' | 'attendedInPerson'>('live');
  const [review, setReview] = useState("");
  const [companions, setCompanions] = useState<string[]>([]);
  const [companionInput, setCompanionInput] = useState("");
  const [visibility, setVisibility] = useState<'public' | 'private' | 'friends'>('public');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [countryCode, setCountryCode] = useState<string | undefined>(undefined);
  const [driverOfTheDay, setDriverOfTheDay] = useState("");
  const [raceWinner, setRaceWinner] = useState<string>("");
  const [loadingWinner, setLoadingWinner] = useState(false);
  const [historicalRaces, setHistoricalRaces] = useState<any[]>([]);
  const [loadingCircuits, setLoadingCircuits] = useState(false);
  const hasPrefilledRef = useRef(false);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUsername(profile?.username || profile?.name || 'user');
        } catch (error) {
          console.error('Error loading profile:', error);
          setUsername('user');
        }
      }
    };
    loadUserProfile();
  }, [user]);

  // Load existing log data when in edit mode
  useEffect(() => {
    if (editMode && existingLog) {
      console.log('[LogRaceDialog] Loading existing log for editing:', existingLog);
      setRaceName(existingLog.raceName || '');
      setRaceLocation(existingLog.raceLocation || '');
      setRaceYear(existingLog.raceYear || new Date().getFullYear());
      setRating(existingLog.rating || 0);
      setReview(existingLog.review || '');
      setSessionType(existingLog.sessionType || 'race');
      setWatchMode(existingLog.watchMode || 'live');
      setVisibility(existingLog.visibility || 'public');
      setCompanions(existingLog.companions || []);
      setSpoiler(existingLog.hasSpoilers || false);
      setCountryCode(existingLog.countryCode);
      setDriverOfTheDay(existingLog.driverOfTheDay || '');
      setRaceWinner(existingLog.raceWinner || '');

      // Handle date conversion
      if (existingLog.dateWatched) {
        const logDate = existingLog.dateWatched instanceof Date
          ? existingLog.dateWatched
          : existingLog.dateWatched.toDate?.() || new Date();
        setDate(logDate);
      }
    }
  }, [editMode, existingLog]);

  // Pre-fill with default values when dialog opens and circuits are loaded
  useEffect(() => {
    if (open && !editMode && historicalRaces.length > 0 && defaultRaceName && !hasPrefilledRef.current) {
      // Build circuits list from historical races
      const circuitsList = historicalRaces.map(race => ({
        name: race.meeting_name,
        location: race.circuit_short_name,
        country: race.country_name,
        uniqueId: `${race.meeting_name}-${race.circuit_short_name}`
      }));

      // Find the matching circuit from the loaded circuits array
      const matchingCircuit = circuitsList.find(c =>
        c.location === defaultCircuit || c.name === defaultRaceName
      );

      if (matchingCircuit) {
        setSelectedCircuitId(matchingCircuit.uniqueId);
        setRaceName(matchingCircuit.name);
        setRaceLocation(matchingCircuit.location);
        setCountryCode(getCountryCodeFromName(matchingCircuit.country));
        hasPrefilledRef.current = true; // Mark as prefilled
      }

      if (defaultYear) setRaceYear(defaultYear);
    }

    // Reset the ref when dialog closes
    if (!open) {
      hasPrefilledRef.current = false;
    }
  }, [open, defaultRaceName, defaultCircuit, defaultYear, editMode, historicalRaces]);

  const drivers2025 = [
    { id: "verstappen", name: "Max Verstappen", team: "Red Bull Racing" },
    { id: "tsunoda", name: "Yuki Tsunoda", team: "Red Bull Racing" },
    { id: "leclerc", name: "Charles Leclerc", team: "Ferrari" },
    { id: "hamilton", name: "Lewis Hamilton", team: "Ferrari" },
    { id: "russell", name: "George Russell", team: "Mercedes" },
    { id: "antonelli", name: "Kimi Antonelli", team: "Mercedes" },
    { id: "norris", name: "Lando Norris", team: "McLaren" },
    { id: "piastri", name: "Oscar Piastri", team: "McLaren" },
    { id: "alonso", name: "Fernando Alonso", team: "Aston Martin" },
    { id: "stroll", name: "Lance Stroll", team: "Aston Martin" },
    { id: "gasly", name: "Pierre Gasly", team: "Alpine" },
    { id: "colapinto", name: "Franco Colapinto", team: "Alpine" },
    { id: "albon", name: "Alex Albon", team: "Williams" },
    { id: "sainz", name: "Carlos Sainz", team: "Williams" },
    { id: "hadjar", name: "Isack Hadjar", team: "RB" },
    { id: "lawson", name: "Liam Lawson", team: "RB" },
    { id: "bearman", name: "Oliver Bearman", team: "Haas" },
    { id: "ocon", name: "Esteban Ocon", team: "Haas" },
    { id: "hulkenberg", name: "Nico Hülkenberg", team: "Sauber" },
    { id: "bortoleto", name: "Gabriel Bortoleto", team: "Sauber" },
  ];

  const allCircuits = [
    // Current/Recent Circuits
    { name: "Monaco Grand Prix", location: "Circuit de Monaco", country: "Monaco" },
    { name: "Italian Grand Prix", location: "Autodromo Nazionale di Monza", country: "Italy" },
    { name: "British Grand Prix", location: "Silverstone Circuit", country: "United Kingdom" },
    { name: "Belgian Grand Prix", location: "Circuit de Spa-Francorchamps", country: "Belgium" },
    { name: "Japanese Grand Prix", location: "Suzuka Circuit", country: "Japan" },
    { name: "Brazilian Grand Prix", location: "Autódromo José Carlos Pace", country: "Brazil" },
    { name: "São Paulo Grand Prix", location: "Autódromo José Carlos Pace", country: "Brazil" },
    { name: "Australian Grand Prix", location: "Albert Park Circuit", country: "Australia" },
    { name: "Austrian Grand Prix", location: "Red Bull Ring", country: "Austria" },
    { name: "Canadian Grand Prix", location: "Circuit Gilles Villeneuve", country: "Canada" },
    { name: "Singapore Grand Prix", location: "Marina Bay Street Circuit", country: "Singapore" },
    { name: "Abu Dhabi Grand Prix", location: "Yas Marina Circuit", country: "United Arab Emirates" },
    { name: "Bahrain Grand Prix", location: "Bahrain International Circuit", country: "Bahrain" },
    { name: "Saudi Arabian Grand Prix", location: "Jeddah Corniche Circuit", country: "Saudi Arabia" },
    { name: "Miami Grand Prix", location: "Miami International Autodrome", country: "United States" },
    { name: "United States Grand Prix", location: "Circuit of the Americas", country: "United States" },
    { name: "Las Vegas Grand Prix", location: "Las Vegas Street Circuit", country: "United States" },
    { name: "Mexico City Grand Prix", location: "Autódromo Hermanos Rodríguez", country: "Mexico" },
    { name: "Spanish Grand Prix", location: "Circuit de Barcelona-Catalunya", country: "Spain" },
    { name: "Hungarian Grand Prix", location: "Hungaroring", country: "Hungary" },
    { name: "Dutch Grand Prix", location: "Circuit Zandvoort", country: "Netherlands" },
    { name: "Azerbaijan Grand Prix", location: "Baku City Circuit", country: "Azerbaijan" },
    { name: "French Grand Prix", location: "Circuit Paul Ricard", country: "France" },
    { name: "Portuguese Grand Prix", location: "Algarve International Circuit", country: "Portugal" },
    { name: "Turkish Grand Prix", location: "Istanbul Park", country: "Turkey" },
    { name: "Chinese Grand Prix", location: "Shanghai International Circuit", country: "China" },
    { name: "Qatar Grand Prix", location: "Lusail International Circuit", country: "Qatar" },
    { name: "Emilia Romagna Grand Prix", location: "Autodromo Enzo e Dino Ferrari", country: "Italy" },

    // Historic/Alternate Circuits
    { name: "German Grand Prix", location: "Hockenheimring", country: "Germany" },
    { name: "German Grand Prix", location: "Nürburgring", country: "Germany" },
    { name: "Eifel Grand Prix", location: "Nürburgring", country: "Germany" },
    { name: "Malaysian Grand Prix", location: "Sepang International Circuit", country: "Malaysia" },
    { name: "Indian Grand Prix", location: "Buddh International Circuit", country: "India" },
    { name: "Korean Grand Prix", location: "Korea International Circuit", country: "South Korea" },
    { name: "Russian Grand Prix", location: "Sochi Autodrom", country: "Russia" },
    { name: "European Grand Prix", location: "Valencia Street Circuit", country: "Spain" },
    { name: "European Grand Prix", location: "Baku City Circuit", country: "Azerbaijan" },
    { name: "Pacific Grand Prix", location: "TI Circuit Aida", country: "Japan" },
    { name: "San Marino Grand Prix", location: "Autodromo Enzo e Dino Ferrari", country: "Italy" },
    { name: "Luxembourg Grand Prix", location: "Nürburgring", country: "Germany" },
    { name: "Styrian Grand Prix", location: "Red Bull Ring", country: "Austria" },
    { name: "70th Anniversary Grand Prix", location: "Silverstone Circuit", country: "United Kingdom" },
    { name: "Tuscan Grand Prix", location: "Autodromo Internazionale del Mugello", country: "Italy" },
    { name: "Sakhir Grand Prix", location: "Bahrain International Circuit", country: "Bahrain" },
    { name: "Argentine Grand Prix", location: "Autódromo Oscar Alfredo Gálvez", country: "Argentina" },
    { name: "South African Grand Prix", location: "Kyalami", country: "South Africa" },

    // Classic Historic Circuits (pre-2000)
    { name: "Mexican Grand Prix", location: "Autódromo Hermanos Rodríguez", country: "Mexico" },
    { name: "United States Grand Prix", location: "Indianapolis Motor Speedway", country: "United States" },
    { name: "United States Grand Prix", location: "Watkins Glen", country: "United States" },
    { name: "United States Grand Prix West", location: "Long Beach", country: "United States" },
    { name: "Detroit Grand Prix", location: "Detroit Street Circuit", country: "United States" },
    { name: "Dallas Grand Prix", location: "Fair Park", country: "United States" },
    { name: "Caesar's Palace Grand Prix", location: "Caesar's Palace", country: "United States" },
    { name: "Phoenix Grand Prix", location: "Phoenix Street Circuit", country: "United States" },
  ];

  // Fetch circuits for selected year from Firestore
  useEffect(() => {
    if (!open) return; // Don't fetch if dialog is closed

    const fetchCircuitsForYear = async () => {
      if (!raceYear) return;

      setLoadingCircuits(true);
      try {
        // Try Firestore first (more reliable)
        const { getRacesBySeason: getFirestoreRaces } = await import('@/services/f1Calendar');
        const firestoreRaces = await getFirestoreRaces(raceYear);

        if (firestoreRaces && firestoreRaces.length > 0) {
          console.log(`[LogRaceDialog] Loaded ${firestoreRaces.length} races from Firestore for ${raceYear}`);
          // Convert Firestore F1Race format to the format we need
          setHistoricalRaces(firestoreRaces.map(race => ({
            meeting_name: race.raceName,
            circuit_short_name: race.circuitName,
            country_name: race.countryName,
            country_code: race.countryCode,
            round: race.round,
            year: race.year,
            location: race.location
          })));
        } else {
          // Fallback to API if Firestore has no data
          console.log(`[LogRaceDialog] No Firestore data for ${raceYear}, trying API...`);
          const { getRacesBySeason: getApiRaces } = await import('@/services/f1Api');
          const apiRaces = await getApiRaces(raceYear);
          setHistoricalRaces(apiRaces);
        }
      } catch (error) {
        console.error('Error fetching circuits for year:', error);
        // Fallback to default circuits if both fail
        setHistoricalRaces([]);
      } finally {
        setLoadingCircuits(false);
      }
    };

    fetchCircuitsForYear();
  }, [raceYear, open]);

  // Sort circuits with default circuit at the top
  const circuits = useMemo(() => {
    let circuitsList;

    // If we have historical races for this year, use them
    if (historicalRaces.length > 0) {
      circuitsList = historicalRaces.map(race => ({
        name: race.meeting_name,
        location: race.circuit_short_name,
        country: race.country_name,
        uniqueId: `${race.meeting_name}-${race.circuit_short_name}` // Unique key for races at same circuit
      }));
    } else {
      // Otherwise, show all possible circuits (comprehensive list)
      // This ensures users can log races even when API fails or data is missing
      circuitsList = allCircuits.map((circuit, idx) => ({
        ...circuit,
        uniqueId: `${circuit.name}-${circuit.location}-${idx}`
      }));
    }

    const sorted = [...circuitsList].sort((a, b) => a.name.localeCompare(b.name));
    if (defaultCircuit || defaultRaceName) {
      const defaultIndex = sorted.findIndex(c =>
        c.location === defaultCircuit || c.name === defaultRaceName
      );
      if (defaultIndex > -1) {
        const [defaultCircuitItem] = sorted.splice(defaultIndex, 1);
        return [defaultCircuitItem, ...sorted];
      }
    }
    return sorted;
  }, [historicalRaces, defaultCircuit, defaultRaceName]);

  const addCompanion = (name: string) => {
    if (name && companions.length < 2 && !companions.includes(name)) {
      setCompanions([...companions, name]);
      setCompanionInput("");
    } else if (companions.length >= 2) {
      toast({
        title: "Maximum reached",
        description: "You can only tag up to 2 people",
        variant: "destructive"
      });
    }
  };

  const removeCompanion = (name: string) => {
    setCompanions(companions.filter(c => c !== name));
  };

  const handleSubmit = async () => {
    if (!user || !raceName || !raceLocation || !driverOfTheDay) {
      toast({
        title: "Missing fields",
        description: "Please fill in race name, location, and driver of the day",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('[LogRaceDialog] Submitting race log:', {
        editMode,
        existingLogId: existingLog?.id,
        raceName,
        raceYear,
        dateWatched: date,
        rating,
        sessionType,
        watchMode,
      });

      // Try to fetch the round number from the F1 calendar
      let round: number | undefined;
      try {
        const raceInfo = await getRaceByNameAndYear(raceName, raceYear);
        if (raceInfo) {
          round = raceInfo.round;
          console.log('[LogRaceDialog] Found round number:', round);
        }
      } catch (error) {
        console.warn('[LogRaceDialog] Could not fetch round number:', error);
      }

      const logData: any = {
        userId: user.uid,
        username: username,
        raceYear,
        raceName,
        raceLocation,
        countryCode,
        dateWatched: date,
        sessionType,
        watchMode,
        rating,
        review,
        companions,
        driverOfTheDay,
        raceWinner,
        mediaUrls: [],
        spoilerWarning: spoiler,
        visibility,
      };

      // Only add round if it's defined (Firestore doesn't accept undefined values)
      if (round !== undefined) {
        logData.round = round;
      }

      let logId: string;

      if (editMode && existingLog?.id) {
        // Update existing log
        await updateRaceLog(existingLog.id, logData);
        logId = existingLog.id;
        console.log('[LogRaceDialog] Race log updated successfully:', logId);
        toast({ title: "Race log updated successfully!" });
      } else {
        // Create new log
        logId = await createRaceLog(logData);
        console.log('[LogRaceDialog] Race log created successfully with ID:', logId);
        toast({ title: "Race logged successfully!" });

        // Only create activity for new public logs
        if (visibility === 'public') {
          try {
            const activityData: any = {
              type: review && review.length > 0 ? 'review' : 'log',
              targetId: logId,
              targetType: 'raceLog',
              raceName,
              raceYear,
              raceLocation,
              rating,
            };

            // Only add content if review exists (Firestore doesn't allow undefined values)
            if (review && review.length > 0) {
              activityData.content = review.substring(0, 200);
            }

            // Only add round if it exists (Firestore doesn't allow undefined values)
            if (round !== undefined) {
              activityData.round = round;
            }

            await createActivity(activityData);
            console.log('[LogRaceDialog] Activity created successfully');
          } catch (activityError) {
            console.error('Failed to create activity:', activityError);
          }
        }
      }

      setOpen(false);
      onSuccess?.();

      // Reset form
      setRaceName("");
      setRaceLocation("");
      setCountryCode(undefined);
      setRating(0);
      setReview("");
      setCompanions([]);
      setCompanionInput("");
      setDriverOfTheDay("");
      setRaceWinner("");
    } catch (error: any) {
      console.error('[LogRaceDialog] Error saving race log:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Log Race
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col bg-[#0a0a0a] border-2 border-racing-red/40 w-[95vw] sm:w-full p-0">
        <DialogHeader className="border-b-2 border-red-900/50 pb-3 px-4 sm:px-6 pt-4 sm:pt-6 flex-shrink-0">
          <DialogTitle className="text-base sm:text-xl font-black flex items-center gap-2 uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="w-1 h-6 bg-racing-red rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            {editMode ? 'Edit Race Log' : 'Log a Race'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 px-4 sm:px-6 overflow-y-auto flex-1 overscroll-contain">
          {/* Race Info Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Race Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Select Circuit *</Label>
                <Select
                  value={selectedCircuitId}
                  disabled={loadingCircuits}
                  onValueChange={async (value) => {
                    const circuit = circuits.find(c => c.uniqueId === value);
                    if (circuit) {
                      setSelectedCircuitId(value);
                      setRaceLocation(circuit.location);
                      setRaceName(circuit.name);
                      setCountryCode(getCountryCodeFromName(circuit.country));

                      // Fetch race winner if we have a year
                      if (raceYear) {
                        setLoadingWinner(true);
                        try {
                          // Find the round number for this race
                          const raceData = historicalRaces.find(r => r.meeting_name === circuit.name);

                          if (raceData && raceData.round) {
                            const winner = await getRaceWinner(raceYear, raceData.round);
                            if (winner) {
                              setRaceWinner(winner);
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching winner:', error);
                        } finally {
                          setLoadingWinner(false);
                        }
                      }
                    }
                  }}
                >
                  <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white">
                    <SelectValue placeholder={loadingCircuits ? "Loading circuits..." : "Choose a circuit..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-black/95 border-2 border-red-900/40">
                    {loadingCircuits ? (
                      <SelectItem value="loading" disabled className="text-gray-400">
                        Loading circuits for {raceYear}...
                      </SelectItem>
                    ) : circuits.length === 0 ? (
                      <SelectItem value="no-data" disabled className="text-gray-400">
                        No races found for {raceYear}
                      </SelectItem>
                    ) :
                      circuits.map((circuit) => (
                        <SelectItem
                          key={circuit.uniqueId}
                          value={circuit.uniqueId}
                          className="text-white hover:bg-racing-red/20 cursor-pointer"
                        >
                          {circuit.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {raceName && (
                <div className="bg-racing-red/10 rounded-md p-3 border-2 border-racing-red/30">
                  <div className="flex items-start gap-2">
                    <div className="text-2xl">🏁</div>
                    <div className="flex-1">
                      <p className="font-black text-sm text-white uppercase tracking-wider">{raceName}</p>
                      <p className="text-xs text-gray-300 font-bold">{raceLocation}</p>
                      {loadingWinner && (
                        <p className="text-xs text-gray-400 mt-1 font-bold">Loading winner...</p>
                      )}
                      {raceWinner && !loadingWinner && (
                        <p className="text-xs font-black text-racing-red mt-1 drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">🏆 Winner: {raceWinner}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Year *</Label>
              <Select
                value={raceYear.toString()}
                onValueChange={(value) => setRaceYear(parseInt(value))}
              >
                <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white max-w-xs">
                  <SelectValue placeholder="Select year..." />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-2 border-red-900/40">
                  {(() => {
                    // Only show years 2020-2025 (years with seeded data)
                    const currentYear = new Date().getFullYear();
                    const minYear = 2020;
                    const maxYear = Math.max(2025, currentYear);
                    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

                    // Put default year at the top if it exists and is different from current year
                    if (defaultYear && defaultYear !== currentYear && !years.includes(defaultYear)) {
                      years.unshift(defaultYear);
                    } else if (defaultYear && defaultYear !== years[0]) {
                      const index = years.indexOf(defaultYear);
                      if (index > -1) {
                        years.splice(index, 1);
                        years.unshift(defaultYear);
                      }
                    }

                    return years.map((year) => (
                      <SelectItem key={year} value={year.toString()} className="text-white hover:bg-racing-red/20 cursor-pointer">
                        {year}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Session *</Label>
              <Select value={sessionType} onValueChange={(v: any) => setSessionType(v)}>
                <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black border-2 border-racing-red/60 shadow-xl">
                  <SelectItem value="race" className="text-white hover:bg-racing-red/30 focus:bg-racing-red/30 cursor-pointer">🏁 Race</SelectItem>
                  <SelectItem value="sprint" className="text-white hover:bg-racing-red/30 focus:bg-racing-red/30 cursor-pointer">⚡ Sprint</SelectItem>
                  <SelectItem value="qualifying" className="text-white hover:bg-racing-red/30 focus:bg-racing-red/30 cursor-pointer">🏎️ Qualifying</SelectItem>
                  <SelectItem value="sprintQualifying" className="text-white hover:bg-racing-red/30 focus:bg-racing-red/30 cursor-pointer">🏁 Sprint Qualifying</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rating Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Your Rating
            </h3>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>

          {/* Review Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Review (Optional)
            </h3>
            <Textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your thoughts about this race... What made it memorable?"
              className="min-h-[120px] border-2 border-red-900/40 focus:border-racing-red bg-black/60 text-white resize-none"
            />
            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={spoiler}
                onCheckedChange={setSpoiler}
                id="spoiler"
              />
              <Label htmlFor="spoiler" className="text-sm font-bold text-gray-300 cursor-pointer uppercase tracking-wider">
                ⚠️ Contains spoilers
              </Label>
            </div>
          </div>

          {/* Driver of the Day Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Driver of the Day *
            </h3>
            <Select
              value={driverOfTheDay}
              onValueChange={setDriverOfTheDay}
              required
            >
              <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white">
                <SelectValue placeholder="Select a driver..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px] bg-black/95 border-2 border-red-900/40">
                {drivers2025.map((driver) => (
                  <SelectItem key={driver.id} value={driver.name} className="text-white hover:bg-racing-red/20">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{driver.name}</span>
                      <span className="text-xs text-gray-400">{driver.team}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 font-bold">Who impressed you most during this race?</p>
          </div>

          {/* Watched With Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-3 sm:p-6 space-y-3 sm:space-y-4">
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 mb-1 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                Watched With
              </h3>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Tag up to 2 people</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {companions.map(companion => (
                <Badge key={companion} variant="secondary" className="gap-1 hover:bg-racing-red hover:text-white hover:border-racing-red transition-colors border-2 bg-black/60 font-bold uppercase">
                  @{companion}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => removeCompanion(companion)}
                  />
                </Badge>
              ))}
            </div>
            {companions.length < 2 && (
              <div className="flex gap-2">
                <Input
                  placeholder="Username"
                  value={companionInput}
                  onChange={(e) => setCompanionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCompanion(companionInput);
                    }
                  }}
                  className="border-2 border-red-900/40 focus:border-racing-red bg-black/60 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addCompanion(companionInput)}
                  disabled={!companionInput.trim()}
                  className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase"
                >
                  Add
                </Button>
              </div>
            )}
          </div>

        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t-2 border-red-900/50 flex-shrink-0 bg-[#0a0a0a]">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="order-2 sm:order-1 border-2 border-red-900/40 bg-black/60 text-white hover:bg-red-900/20 font-bold uppercase tracking-wider h-11 px-6 w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="order-1 sm:order-2 bg-racing-red hover:bg-red-600 text-white shadow-lg shadow-red-500/50 border-2 border-red-400 font-black uppercase tracking-wider h-11 px-6 w-full sm:w-auto"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              editMode ? 'Update' : 'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
