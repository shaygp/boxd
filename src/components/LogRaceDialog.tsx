import { useState, useEffect, useMemo } from "react";
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [spoiler, setSpoiler] = useState(false);
  const [raceName, setRaceName] = useState("");
  const [raceLocation, setRaceLocation] = useState("");
  const [raceYear, setRaceYear] = useState(new Date().getFullYear());
  const [sessionType, setSessionType] = useState<'race' | 'sprint' | 'qualifying' | 'highlights'>('race');
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

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          setUsername(profile?.username || profile?.name || user.email?.split('@')[0] || 'user');
        } catch (error) {
          console.error('Error loading profile:', error);
          setUsername(user.email?.split('@')[0] || 'user');
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
      setTags(existingLog.tags || []);
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

  // Pre-fill with default values when dialog opens
  useEffect(() => {
    if (open && !editMode) {
      // Find the matching circuit from the circuits array
      const matchingCircuit = allCircuits.find(c =>
        c.location === defaultCircuit || c.name === defaultRaceName
      );

      if (matchingCircuit) {
        setRaceName(matchingCircuit.name);
        setRaceLocation(matchingCircuit.location);
        setCountryCode(getCountryCodeFromName(matchingCircuit.country));
      }

      if (defaultYear) setRaceYear(defaultYear);
    }
  }, [open, defaultRaceName, defaultCircuit, defaultYear, defaultCountryCode, editMode]);

  const suggestedTags = ["rain", "safety-car", "overtake", "pitstop-chaos", "attended", "late-drama", "dnf"];

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
    { name: "Monaco Grand Prix", location: "Circuit de Monaco", country: "Monaco" },
    { name: "Italian Grand Prix", location: "Autodromo Nazionale di Monza", country: "Italy" },
    { name: "British Grand Prix", location: "Silverstone Circuit", country: "United Kingdom" },
    { name: "Belgian Grand Prix", location: "Circuit de Spa-Francorchamps", country: "Belgium" },
    { name: "Japanese Grand Prix", location: "Suzuka Circuit", country: "Japan" },
    { name: "Brazilian Grand Prix", location: "Autódromo José Carlos Pace", country: "Brazil" },
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
  ];

  // Sort circuits with default circuit at the top
  const circuits = useMemo(() => {
    const sorted = [...allCircuits].sort((a, b) => a.name.localeCompare(b.name));
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
  }, [defaultCircuit, defaultRaceName]);

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

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
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

      const logData = {
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
        tags,
        companions,
        driverOfTheDay,
        raceWinner,
        mediaUrls: [],
        spoilerWarning: spoiler,
        visibility,
      };

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
          console.log('[LogRaceDialog] Creating activity for public log');
          await createActivity({
            type: review && review.length > 0 ? 'review' : 'log',
            targetId: logId,
            targetType: 'raceLog',
            content: review && review.length > 0 ? review.substring(0, 100) : `${raceName} - ${raceYear}`,
          });
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
      setTags([]);
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-2 border-racing-red/40 w-[95vw] sm:w-full">
        <DialogHeader className="border-b-2 border-red-900/50 pb-4">
          <DialogTitle className="text-2xl font-black flex items-center gap-2 uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="w-1 h-8 bg-racing-red rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            {editMode ? 'Edit Race Log' : 'Log a Race'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Race Info Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-6 space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Race Information
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Select Circuit *</Label>
                <Select
                  value={raceLocation}
                  onValueChange={async (value) => {
                    const circuit = circuits.find(c => c.location === value);
                    if (circuit) {
                      setRaceLocation(circuit.location);
                      setRaceName(circuit.name);
                      setCountryCode(getCountryCodeFromName(circuit.country));

                      // Fetch race winner if we have a year
                      if (raceYear) {
                        setLoadingWinner(true);
                        try {
                          // Find the round number for this race
                          const { getRacesBySeason } = await import('@/services/f1Api');
                          const races = await getRacesBySeason(raceYear);
                          const raceData = races.find(r => r.meeting_name === circuit.name);

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
                    <SelectValue placeholder="Choose a circuit..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] bg-black/95 border-2 border-red-900/40">
                    {circuits.map((circuit) => (
                      <SelectItem key={circuit.location} value={circuit.location}>
                        <div className="flex flex-col">
                          <span className="font-medium">{circuit.name}</span>
                          <span className="text-xs text-muted-foreground">{circuit.location}</span>
                        </div>
                      </SelectItem>
                    ))}
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
                    const currentYear = new Date().getFullYear();
                    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

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
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Viewing Details Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-6 space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Viewing Details
            </h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Date Watched *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white",
                        !date && "text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black/95 border-2 border-red-900/40" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Session</Label>
                <Select value={sessionType} onValueChange={(v: any) => setSessionType(v)}>
                  <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-2 border-red-900/40">
                    <SelectItem value="race">🏁 Race</SelectItem>
                    <SelectItem value="sprint">⚡ Sprint</SelectItem>
                    <SelectItem value="qualifying">🏎️ Qualifying</SelectItem>
                    <SelectItem value="highlights">📺 Highlights</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-300 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Watch Mode</Label>
                <Select value={watchMode} onValueChange={(v: any) => setWatchMode(v)}>
                  <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-black/95 border-2 border-red-900/40">
                    <SelectItem value="live">🔴 Live</SelectItem>
                    <SelectItem value="replay">▶️ Replay</SelectItem>
                    <SelectItem value="tvBroadcast">📡 TV Broadcast</SelectItem>
                    <SelectItem value="highlights">✨ Highlights</SelectItem>
                    <SelectItem value="attendedInPerson">🎟️ Attended in Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-6 space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Your Rating
            </h3>
            <StarRating rating={rating} onRatingChange={setRating} />
          </div>

          {/* Driver of the Day Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-6 space-y-4">
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
                  <SelectItem key={driver.id} value={driver.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{driver.name}</span>
                      <span className="text-xs text-muted-foreground">{driver.team}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 font-bold">Who impressed you most during this race?</p>
          </div>

          {/* Review Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-6 space-y-4">
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

          {/* Tags & Social Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
                <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1 hover:bg-racing-red hover:text-white hover:border-racing-red transition-colors border-2 bg-black/60 font-bold uppercase">
                    #{tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add custom tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(tagInput);
                    }
                  }}
                  className="border-2 border-red-900/40 focus:border-racing-red bg-black/60 text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addTag(tagInput)}
                  className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <p className="text-xs text-gray-400 w-full mb-1 font-bold uppercase tracking-wider">Quick tags:</p>
                {suggestedTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-racing-red hover:text-white hover:border-racing-red transition-colors border-2 border-red-900/40 bg-black/40 font-bold uppercase"
                    onClick={() => addTag(tag)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t-2 border-red-900/50 pt-6 space-y-4">
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

          {/* Visibility Section */}
          <div className="bg-black/90 backdrop-blur-sm border-2 border-red-900/40 rounded-lg p-6 space-y-4">
            <h3 className="font-black text-sm uppercase tracking-wider text-racing-red flex items-center gap-2 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
              <div className="w-2 h-2 bg-racing-red rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              Privacy
            </h3>
            <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
              <SelectTrigger className="border-2 border-red-900/40 hover:border-racing-red bg-black/60 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-black/95 border-2 border-red-900/40">
                <SelectItem value="public">🌍 Public - Everyone can see</SelectItem>
                <SelectItem value="friends">👥 Friends Only</SelectItem>
                <SelectItem value="private">🔒 Private - Only you</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t-2 border-red-900/50">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="border-2 border-red-900/40 bg-black/60 text-white hover:bg-red-900/20 font-bold uppercase tracking-wider"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-racing-red hover:bg-red-600 text-white min-w-[120px] shadow-lg shadow-red-500/50 border-2 border-red-400 font-black uppercase tracking-wider"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              editMode ? '💾 Update Log' : '🏁 Save Log'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
