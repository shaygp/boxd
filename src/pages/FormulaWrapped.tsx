import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserRaceLogs, calculateTotalHoursWatched } from "@/services/raceLogs";
import { useNavigate } from "react-router-dom";
import { ChevronRight, X, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface RaceLog {
  id?: string;
  raceName: string;
  raceLocation: string;
  raceYear: number;
  countryCode?: string;
  rating: number;
  sessionType: string;
  driverOfTheDay?: string;
  review: string;
  dateWatched: Date;
  watchMode?: string;
}

export const FormulaWrapped = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [logs, setLogs] = useState<RaceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalHours: 0,
    totalRaces: 0,
    sessionBreakdown: { race: 0, qualifying: 0, sprint: 0, highlights: 0 },
    mostWatchedCircuit: { name: "", location: "", count: 0, countryCode: "" },
    topRaces: [] as RaceLog[],
    topDriver: "",
    watchStyle: "",
    reviewCount: 0,
    personality: "",
    roast: "",
  });

  useEffect(() => {
    loadWrappedData();
  }, [user]);

  const loadWrappedData = async () => {
    if (!user) {
      console.log("No user found");
      setLoading(false);
      return;
    }

    try {
      console.log("Loading wrapped data for user:", user.uid);
      const userLogs = await getUserRaceLogs(user.uid);
      console.log("Fetched logs:", userLogs.length);
      console.log('[FormulaWrapped] All user logs:', userLogs.map(l => ({ year: l.raceYear, name: l.raceName, rating: l.rating })));
      setLogs(userLogs);

      if (userLogs.length === 0) {
        console.log("No logs found");
        setLoading(false);
        return;
      }

      // Calculate stats
      const totalHours = Math.round(calculateTotalHoursWatched(userLogs));
      const totalRaces = userLogs.length;

      // Session breakdown - add debugging and case-insensitive matching
      console.log('[FormulaWrapped] All session types:', userLogs.map(l => l.sessionType));
      const sessionBreakdown = {
        race: userLogs.filter(l => l.sessionType?.toLowerCase() === 'race').length,
        qualifying: userLogs.filter(l => l.sessionType?.toLowerCase() === 'qualifying').length,
        sprint: userLogs.filter(l => l.sessionType?.toLowerCase() === 'sprint').length,
        highlights: userLogs.filter(l => l.sessionType?.toLowerCase() === 'highlights').length,
      };
      console.log('[FormulaWrapped] Session breakdown:', sessionBreakdown);

      // Most watched circuit
      const circuitCounts: { [key: string]: { count: number; location: string; countryCode: string } } = {};
      userLogs.forEach(log => {
        if (!circuitCounts[log.raceName]) {
          circuitCounts[log.raceName] = { count: 0, location: log.raceLocation, countryCode: log.countryCode || '' };
        }
        circuitCounts[log.raceName].count++;
      });
      const mostWatched = Object.entries(circuitCounts).sort((a, b) => b[1].count - a[1].count)[0];
      const mostWatchedCircuit = mostWatched ? {
        name: mostWatched[0],
        location: mostWatched[1].location,
        count: mostWatched[1].count,
        countryCode: mostWatched[1].countryCode
      } : { name: "None", location: "", count: 0, countryCode: "" };

      // Top 5 races by rating - each year+race combination is treated as unique
      // So Monaco 2023 and Monaco 2024 are different races
      const uniqueRaces = new Map<string, RaceLog>();

      [...userLogs]
        .filter(l => l.rating > 0)
        .sort((a, b) => b.rating - a.rating)
        .forEach(log => {
          const raceKey = `${log.raceYear}-${log.raceName}`;
          // Only keep the highest rated entry for each unique year+race combination
          if (!uniqueRaces.has(raceKey) || (uniqueRaces.get(raceKey)?.rating || 0) < log.rating) {
            uniqueRaces.set(raceKey, log);
          }
        });

      const topRaces = Array.from(uniqueRaces.values())
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      console.log('[FormulaWrapped] Top races calculated:', topRaces.length, topRaces.map(r => `${r.raceYear} ${r.raceName} (${r.rating}★)`));

      // Top driver
      const driverCounts: { [key: string]: number } = {};
      userLogs.forEach(log => {
        if (log.driverOfTheDay) {
          driverCounts[log.driverOfTheDay] = (driverCounts[log.driverOfTheDay] || 0) + 1;
        }
      });
      const topDriver = Object.entries(driverCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "None yet";

      // Review count
      const reviewCount = userLogs.filter(l => l.review && l.review.length > 0).length;

      // Better roast logic
      let roast = "";
      let personality = "";

      // Check for specific patterns
      const hasMonaco = topRaces.some(r => r.raceName.toLowerCase().includes("monaco"));
      const has2021 = topRaces.some(r => r.raceYear === 2021 && r.raceName.toLowerCase().includes("abu dhabi"));
      const avgRating = topRaces.length > 0 ? topRaces.reduce((sum, r) => sum + r.rating, 0) / topRaces.length : 0;
      const watchesLive = userLogs.filter(l => l.watchMode === 'live').length > totalRaces * 0.7;
      const watchesHighlights = sessionBreakdown.highlights > totalRaces / 2;
      const lovesQualifying = sessionBreakdown.qualifying > sessionBreakdown.race;

      // Generate funny, human roasts
      if (totalRaces < 3) {
        roast = "you've watched like 2 races and already have opinions on tire strategy";
        personality = "The Overconfident Newbie";
      } else if (has2021) {
        roast = "still not over 2021 and honestly, we get it";
        personality = "Abu Dhabi Survivor";
      } else if (hasMonaco && avgRating > 4) {
        roast = "thinks Monaco is peak racing... bless your heart";
        personality = "Monaco Apologist";
      } else if (watchesHighlights) {
        roast = "watches 5-minute highlights and tweets like you saw the whole thing";
        personality = "The Fake Fan";
      } else if (lovesQualifying) {
        roast = "gets more excited about quali than the actual race (you might have a point)";
        personality = "Saturday Supremacist";
      } else if (totalHours > 150) {
        roast = "spent more time watching F1 than sleeping and we're genuinely concerned";
        personality = "The Addict";
      } else if (avgRating > 4.5) {
        roast = "gives every race 5 stars like you're being paid by Liberty Media";
        personality = "Professional Glazer";
      } else if (avgRating < 2) {
        roast = "hates everything but keeps watching anyway (most relatable person here)";
        personality = "The Hater";
      } else if (reviewCount === 0) {
        roast = "too cool to write reviews but not too cool to log every race";
        personality = "Silent Watcher";
      } else if (reviewCount > totalRaces * 0.8) {
        roast = "writes essays about DRS zones like anyone asked";
        personality = "The Critic";
      } else if (watchesLive) {
        roast = "wakes up at 4am for races and pretends you're not dying at work";
        personality = "Die-Hard Fan";
      } else {
        roast = "your F1 opinions are mid but at least you're consistent";
        personality = "Perfectly Average Fan";
      }

      console.log("Stats calculated:", {
        totalHours,
        totalRaces,
        personality,
        roast
      });

      setStats({
        totalHours,
        totalRaces,
        sessionBreakdown,
        mostWatchedCircuit,
        topRaces,
        topDriver,
        watchStyle: personality,
        reviewCount,
        personality,
        roast,
      });
    } catch (error) {
      console.error("Error loading wrapped data:", error);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleShare = async () => {
    if (!slideContainerRef.current) return;

    setIsCapturing(true);

    try {
      // Get the current slide element
      const slideElement = slideContainerRef.current.querySelector(`[data-slide="${currentSlide}"]`) as HTMLElement;

      if (!slideElement) {
        throw new Error('Could not find slide element');
      }

      // Capture the current slide as an image with better options
      const canvas = await html2canvas(slideElement, {
        backgroundColor: '#000000',
        scale: 2, // Higher quality
        logging: true, // Enable logging to debug
        useCORS: true,
        allowTaint: true,
        width: slideElement.offsetWidth,
        height: slideElement.offsetHeight,
        windowWidth: slideElement.offsetWidth,
        windowHeight: slideElement.offsetHeight,
      });

      // Create a new canvas with branding
      const brandedCanvas = document.createElement('canvas');
      const ctx = brandedCanvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      // Set canvas size with extra space at bottom for branding
      const brandingHeight = 60;
      brandedCanvas.width = canvas.width;
      brandedCanvas.height = canvas.height + brandingHeight;

      // Fill with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, brandedCanvas.width, brandedCanvas.height);

      // Draw the captured slide
      ctx.drawImage(canvas, 0, 0);

      // Add branding at the bottom
      ctx.fillStyle = '#dc2626'; // racing-red
      ctx.fillRect(0, canvas.height, brandedCanvas.width, brandingHeight);

      // Add BoxBoxd text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BoxBoxd', brandedCanvas.width / 2, canvas.height + 40);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        brandedCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png', 1.0);
      });

      const file = new File([blob], 'boxboxd-formula-wrapped.png', { type: 'image/png' });

      // Try to share with native share API (works on mobile)
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'My 2025 Formula Wrapped - BoxBoxd',
          text: '🏁 My 2025 Formula Wrapped 🏁\n\n#FormulaWrapped #F1 #BoxBoxd',
          files: [file],
        });

        toast({
          title: "Shared successfully!",
          description: "Your Formula Wrapped has been shared",
        });
      } else {
        // Fallback: Download the image
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `boxboxd-formula-wrapped-${currentSlide + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Image downloaded!",
          description: "Share your Formula Wrapped on social media",
        });
      }
    } catch (error) {
      console.error('Error capturing/sharing image:', error);
      toast({
        title: "Could not share",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const slides = [
    // Slide 0: Opening
    <div className="relative flex flex-col items-center justify-center h-full text-center px-6 bg-black overflow-hidden">
      {/* Animated racing stripes */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-2 bg-racing-red animate-pulse" />
        <div className="absolute bottom-0 left-0 w-full h-2 bg-racing-red animate-pulse" />
        <div className="absolute top-1/4 -left-full w-full h-24 bg-gradient-to-r from-transparent via-racing-red to-transparent skew-y-12 animate-[slide_3s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 -right-full w-full h-24 bg-gradient-to-r from-transparent via-white to-transparent skew-y-12 animate-[slide_4s_ease-in-out_infinite_reverse]" />
      </div>

      {/* Checkered flag pattern - positioned to avoid text overlap */}
      <div className="absolute top-16 right-4 sm:top-4 sm:right-4 w-12 h-12 sm:w-16 sm:h-16 opacity-30" style={{
        backgroundImage: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
        backgroundPosition: '0 0, 8px 8px',
        backgroundSize: '16px 16px'
      }} />
      <div className="absolute bottom-16 left-4 sm:bottom-4 sm:left-4 w-12 h-12 sm:w-16 sm:h-16 opacity-30" style={{
        backgroundImage: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
        backgroundPosition: '0 0, 8px 8px',
        backgroundSize: '16px 16px'
      }} />

      <div className="relative space-y-6 sm:space-y-8 animate-fade-in z-10 max-w-full">
        <div className="inline-block relative">
          <div className="absolute -inset-8 bg-racing-red/30 blur-3xl animate-pulse" />
          <h1 className="relative text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tighter uppercase px-2" style={{
            textShadow: '0 0 40px rgba(220,38,38,0.8), 0 0 80px rgba(220,38,38,0.4)'
          }}>
            YOUR 2025
          </h1>
          <div className="flex gap-2 mt-3 sm:mt-4 justify-center">
            <div className="h-1.5 sm:h-2 w-12 sm:w-20 bg-racing-red" />
            <div className="h-1.5 sm:h-2 w-12 sm:w-20 bg-white" />
            <div className="h-1.5 sm:h-2 w-12 sm:w-20 bg-racing-red" />
          </div>
        </div>
        <div className="relative px-2 pb-10 sm:pb-12">
          <h2 className="text-3xl sm:text-5xl md:text-7xl font-black uppercase tracking-tight animate-pulse" style={{
            background: 'linear-gradient(90deg, #dc2626 0%, #ffffff 50%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 0 60px rgba(220,38,38,0.5)'
          }}>
            FORMULA WRAPPED
          </h2>
          <div className="absolute -bottom-2 sm:-bottom-4 left-1/2 transform -translate-x-1/2 text-3xl sm:text-5xl md:text-6xl">🏁</div>
        </div>
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-12">
          <div className="h-px w-12 sm:w-16 bg-racing-red" />
          <p className="text-xs sm:text-sm text-racing-red font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] animate-pulse">TAP TO START</p>
          <div className="h-px w-12 sm:w-16 bg-racing-red" />
        </div>
      </div>
    </div>,

    // Slide 1: Total Hours
    <div className="relative flex flex-col items-center justify-center h-full text-center px-6 bg-black overflow-hidden">
      {/* Dramatic speed lines */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-racing-red to-transparent"
            style={{
              top: `${(i + 1) * 8}%`,
              left: '-100%',
              width: '200%',
              animation: `slide ${1.5 + i * 0.2}s linear infinite`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>

      <div className="relative space-y-6 sm:space-y-8 animate-fade-in z-10 max-w-full w-full">
        <p className="text-xs text-gray-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] font-bold px-2">This year you spent</p>

        <div className="space-y-4 sm:space-y-6">
          <div className="relative inline-block">
            <div className="absolute -inset-8 bg-racing-red/30 blur-3xl animate-pulse" />
            <div className="relative space-y-1 sm:space-y-2">
              <div className="flex items-baseline justify-center gap-2">
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-racing-red drop-shadow-[0_0_60px_rgba(220,38,38,0.8)]">
                  {Math.floor(stats.totalHours / 24)}
                </h1>
                <span className="text-xl sm:text-3xl md:text-4xl font-black text-white uppercase">days</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white drop-shadow-[0_0_40px_rgba(220,38,38,0.6)]">
                  {stats.totalHours % 24}
                </h2>
                <span className="text-lg sm:text-2xl md:text-3xl font-black text-gray-400 uppercase">hours</span>
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <h3 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-300 drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                  {((stats.totalHours % 1) * 60).toFixed(0)}
                </h3>
                <span className="text-base sm:text-xl md:text-2xl font-black text-gray-500 uppercase">minutes</span>
              </div>
            </div>
          </div>

          <div className="flex gap-0.5 sm:gap-1 justify-center my-4 sm:my-6">
            {[...Array(15)].map((_, i) => (
              <div key={i} className={`h-0.5 sm:h-1 w-2 sm:w-3 ${i % 2 === 0 ? 'bg-racing-red' : 'bg-white'}`} />
            ))}
          </div>

          <p className="text-lg sm:text-2xl md:text-3xl text-white font-black uppercase tracking-tight px-2">
            Watching Formula 1
          </p>
        </div>

        <div className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 px-2">
          {stats.totalHours > 100 && (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-racing-red/20 to-black border-2 border-racing-red/40 rounded-xl">
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                That's enough time to drive from{' '}
                <span className="text-racing-red font-black">Monaco to Monza</span>{' '}
                {Math.floor(stats.totalHours / 6)} times
              </p>
            </div>
          )}
          {stats.totalHours > 50 && stats.totalHours <= 100 && (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-racing-red/20 to-black border-2 border-racing-red/40 rounded-xl">
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                You could've learned{' '}
                <span className="text-racing-red font-black">Italian, changed your tires</span>, and still had time left over
              </p>
            </div>
          )}
          {stats.totalHours < 50 && stats.totalHours > 0 && (
            <div className="p-4 sm:p-6 bg-gradient-to-br from-racing-red/20 to-black border-2 border-racing-red/40 rounded-xl">
              <p className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed">
                That's{' '}
                <span className="text-racing-red font-black">{Math.floor(stats.totalHours / 2)} full race weekends</span>{' '}
                of pure adrenaline
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,

    // Slide 2: Most Watched Circuit
    <div className="relative flex flex-col items-center justify-center h-full text-center px-6 bg-black overflow-hidden">
      {/* Racing tire marks */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-5 sm:left-10 w-48 sm:w-64 h-1.5 sm:h-2 bg-white transform -rotate-12" />
        <div className="absolute top-24 left-7 sm:left-12 w-48 sm:w-64 h-1.5 sm:h-2 bg-white transform -rotate-12" />
        <div className="absolute bottom-32 right-5 sm:right-10 w-48 sm:w-64 h-1.5 sm:h-2 bg-racing-red transform rotate-12" />
        <div className="absolute bottom-36 right-7 sm:right-12 w-48 sm:w-64 h-1.5 sm:h-2 bg-racing-red transform rotate-12" />
      </div>

      <div className="relative space-y-6 sm:space-y-8 animate-fade-in z-10 max-w-full">
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl">🏁</span>
          <p className="text-xs sm:text-sm text-racing-red uppercase tracking-[0.2em] sm:tracking-[0.3em] font-black">Your Most Watched</p>
          <span className="text-2xl sm:text-3xl">🏁</span>
        </div>

        <div className="space-y-2 sm:space-y-3 mt-6 sm:mt-8 px-2">
          <div className="flex gap-1 sm:gap-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-0.5 sm:h-1 w-8 sm:w-12 ${i % 2 === 0 ? 'bg-racing-red' : 'bg-white'}`} />
            ))}
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-tight px-2" style={{
            textShadow: '0 0 30px rgba(220,38,38,0.6)'
          }}>
            {stats.mostWatchedCircuit.name}
          </h1>
          <div className="flex gap-1 sm:gap-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-0.5 sm:h-1 w-8 sm:w-12 ${i % 2 === 0 ? 'bg-white' : 'bg-racing-red'}`} />
            ))}
          </div>
        </div>

        <p className="text-base sm:text-lg md:text-xl text-gray-400 px-2">{stats.mostWatchedCircuit.location}</p>

        <div className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-2.5 sm:py-3 bg-racing-red border-2 sm:border-4 border-white rounded-lg shadow-xl">
          <span className="text-3xl sm:text-4xl">🏎️</span>
          <div className="text-left">
            <p className="text-white font-black text-xl sm:text-2xl">{stats.mostWatchedCircuit.count}x</p>
            <p className="text-white/80 text-xs uppercase tracking-wider">Laps Watched</p>
          </div>
        </div>
      </div>
    </div>,

    // Slide 4: Top Races
    <div className="relative flex flex-col items-center justify-center h-full text-center px-6 bg-black overflow-hidden py-8 sm:py-12">
      {/* Podium steps background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-32 sm:h-48 bg-racing-red" />
        <div className="absolute bottom-0 left-1/4 w-24 sm:w-32 h-20 sm:h-32 bg-white" />
        <div className="absolute bottom-0 right-1/4 w-24 sm:w-32 h-16 sm:h-24 bg-gray-600" />
      </div>

      <div className="relative space-y-6 sm:space-y-8 animate-fade-in max-w-full w-full z-10 overflow-y-auto max-h-full">
        <div className="space-y-2 sm:space-y-3 sticky top-0 bg-black/80 backdrop-blur-sm pb-3 sm:pb-4 pt-2 px-2">
          <p className="text-xs text-gray-500 uppercase tracking-[0.3em] sm:tracking-[0.5em] font-bold">The races that made you</p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-racing-red uppercase tracking-tight">
            Jump off your seat
          </h1>
          <div className="flex gap-0.5 sm:gap-1 justify-center">
            {[...Array(10)].map((_, i) => (
              <div key={i} className={`h-0.5 w-3 sm:w-4 ${i % 2 === 0 ? 'bg-racing-red' : 'bg-white'}`} />
            ))}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6 pb-6 sm:pb-8">
          {stats.topRaces.map((race, idx) => (
            <div key={idx} className="relative group">
              <div className="absolute inset-0 bg-racing-red/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-gradient-to-r from-black via-racing-red/10 to-black border-2 border-racing-red/40 rounded-lg p-3 sm:p-5 hover:border-racing-red/80 transition-all">
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 bg-racing-red/30 blur-xl" />
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                      <span className="text-2xl sm:text-4xl font-black text-racing-red drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
                        {idx + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 text-left space-y-0.5 sm:space-y-1 min-w-0">
                    <p className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-tight leading-tight truncate">
                      {race.raceName}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{race.raceYear}</p>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 sm:gap-1 flex-shrink-0">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm sm:text-lg ${i < race.rating ? 'text-yellow-500' : 'text-gray-700'}`}>
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-wider hidden sm:inline">Unforgettable</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stats.topRaces.length === 0 && (
          <div className="p-6 sm:p-8 bg-racing-red/10 border-2 border-racing-red/30 rounded-xl">
            <p className="text-base sm:text-lg text-gray-400">Start rating races to see your favorites!</p>
          </div>
        )}
      </div>
    </div>,

    // Slide 5: Driver of the Year
    <div className="relative flex flex-col items-center justify-center h-full text-center px-6 bg-black overflow-hidden">
      {/* Racing background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-racing-red" />
        <div className="absolute bottom-0 left-0 w-full h-0.5 sm:h-1 bg-racing-red" />
        <div className="absolute left-0 top-1/2 w-full h-px bg-white transform -translate-y-1/2" />
      </div>

      <div className="relative space-y-6 sm:space-y-8 animate-fade-in max-w-full w-full z-10">
        <div className="space-y-2 sm:space-y-3 px-2">
          <p className="text-xs text-gray-500 uppercase tracking-[0.3em] sm:tracking-[0.4em] font-bold">The driver who</p>
          <p className="text-base sm:text-lg md:text-xl text-racing-red uppercase tracking-[0.15em] sm:tracking-[0.2em] font-black">
            could do no wrong in your eyes
          </p>
        </div>

        <div className="relative inline-block">
          <div className="absolute -inset-8 bg-racing-red/30 blur-3xl animate-pulse" />
          <div className="relative space-y-3 sm:space-y-4 px-2">
            <div className="flex gap-1 sm:gap-2 justify-center">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-0.5 sm:h-1 w-6 sm:w-8 ${i % 2 === 0 ? 'bg-racing-red' : 'bg-white'}`} />
              ))}
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white uppercase tracking-tight" style={{
              textShadow: '0 0 40px rgba(220,38,38,0.6)'
            }}>
              {stats.topDriver}
            </h1>
            <div className="flex gap-1 sm:gap-2 justify-center">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-0.5 sm:h-1 w-6 sm:w-8 ${i % 2 === 0 ? 'bg-white' : 'bg-racing-red'}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8 px-2">
          <p className="text-sm sm:text-base md:text-lg text-gray-400 leading-relaxed">
            Rain or shine, P1 or DNF,<br />you'd defend them in the group chat
          </p>
          <div className="inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-6 py-2.5 sm:py-3 bg-racing-red/20 border-2 border-racing-red/40 rounded-lg">
            <span className="text-2xl sm:text-3xl">🏆</span>
            <p className="text-white text-xs sm:text-sm uppercase tracking-wider">
              Your ride or die
            </p>
          </div>
        </div>
      </div>
    </div>,

    // Slide 7: The Roast
    <div className="relative flex flex-col items-center justify-center h-full text-center px-6 bg-black overflow-hidden">
      {/* Checkered flag everywhere */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
        backgroundPosition: '0 0, 16px 16px',
        backgroundSize: '32px 32px'
      }} />

      {/* Animated speed lines */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-racing-red to-transparent"
            style={{
              top: `${(i + 1) * 12}%`,
              left: '-100%',
              width: '200%',
              animation: `slide ${2 + i * 0.3}s linear infinite`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
      </div>

      <div className="relative space-y-4 sm:space-y-6 md:space-y-8 animate-fade-in max-w-full w-full z-10 px-4">
        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4">
          <span className="text-2xl sm:text-3xl md:text-4xl animate-bounce">🏁</span>
          <p className="text-[10px] sm:text-xs md:text-sm text-racing-red uppercase tracking-[0.2em] sm:tracking-[0.3em] md:tracking-[0.4em] font-black whitespace-nowrap">Your F1 DNA</p>
          <span className="text-2xl sm:text-3xl md:text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🏁</span>
        </div>

        <div className="relative w-full">
          <div className="absolute -inset-4 sm:-inset-6 bg-racing-red/30 blur-3xl animate-pulse" />
          <h1 className="relative text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight leading-tight break-words text-center px-2" style={{
            textShadow: '0 0 40px rgba(220,38,38,0.8)',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {stats.personality}
          </h1>
        </div>

        {/* Racing stripes */}
        <div className="flex gap-0.5 justify-center my-3 sm:my-4 md:my-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className={`h-0.5 sm:h-1 w-2 sm:w-2.5 md:w-3 ${i % 2 === 0 ? 'bg-racing-red' : 'bg-white'}`} />
          ))}
        </div>

        <div className="relative p-3 sm:p-4 md:p-5 bg-gradient-to-br from-racing-red/20 to-black border-2 sm:border-3 border-racing-red rounded-lg shadow-2xl shadow-racing-red/50 max-w-full">
          <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 text-sm sm:text-base md:text-lg">🏆</div>
          <div className="absolute bottom-1 left-1 sm:bottom-1.5 sm:left-1.5 text-sm sm:text-base md:text-lg">🏎️</div>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] text-racing-red uppercase tracking-[0.1em] sm:tracking-[0.15em] mb-1.5 sm:mb-2 font-black">THE VERDICT</p>
          <p className="text-[10px] sm:text-xs md:text-sm font-bold text-white leading-snug sm:leading-normal break-words hyphens-auto" style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto'
          }}>
            {stats.roast}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
          <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-r from-transparent via-racing-red to-transparent" />
          <span className="text-2xl sm:text-3xl md:text-4xl">🔥</span>
          <div className="h-px w-12 sm:w-16 md:w-20 bg-gradient-to-r from-transparent via-racing-red to-transparent" />
        </div>
      </div>
    </div>,
  ];

  if (loading) {
    return <div className="min-h-screen bg-black"></div>;
  }

  if (logs.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl font-black text-racing-red">NO DATA YET</h1>
          <p className="text-xl text-gray-400">
            You haven't logged any races yet! Go watch some Grand Prix and come back for your Formula Wrapped.
          </p>
          <Button onClick={() => navigate('/home')} className="bg-racing-red hover:bg-red-600">
            Go Log Some Races
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="w-full h-full bg-black overflow-hidden relative" style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}>
      {/* Action buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2" style={{
        top: 'max(1rem, env(safe-area-inset-top))'
      }}>
        <button
          onClick={handleShare}
          disabled={isCapturing}
          className="p-2 bg-black/60 border border-racing-red/40 rounded-full text-white hover:bg-racing-red/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCapturing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Share2 className="w-6 h-6" />
          )}
        </button>
        <button
          onClick={() => navigate('/')}
          className="p-2 bg-black/60 border border-racing-red/40 rounded-full text-white hover:bg-racing-red/20 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute top-4 left-4 right-20 z-50 flex gap-1.5" style={{
        top: 'max(1rem, env(safe-area-inset-top))',
        left: 'max(1rem, env(safe-area-inset-left))'
      }}>
        {slides.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-0.5 bg-gray-800 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-racing-red transition-all duration-500 ${
                idx === currentSlide ? 'w-full animate-progress' : idx < currentSlide ? 'w-full' : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Slides */}
      <div className="h-full w-full relative">
        <div
          ref={slideContainerRef}
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <div key={idx} className="min-w-full h-full flex-shrink-0" data-slide={idx}>
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="absolute inset-0 z-40 flex">
        <button
          onClick={prevSlide}
          className="flex-1"
          disabled={currentSlide === 0}
        />
        <button
          onClick={nextSlide}
          className="flex-1"
          disabled={currentSlide === slides.length - 1}
        />
      </div>

      {/* Next indicator */}
      {currentSlide < slides.length - 1 && (
        <div className="absolute bottom-8 right-8 z-50 animate-bounce" style={{
          bottom: 'max(2rem, env(safe-area-inset-bottom))',
          right: 'max(2rem, env(safe-area-inset-right))'
        }}>
          <Button
            onClick={nextSlide}
            className="rounded-full w-12 h-12 sm:w-16 sm:h-16 bg-racing-red hover:bg-red-600 shadow-2xl"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
          </Button>
        </div>
      )}
      </div>
    </div>
  );
};
