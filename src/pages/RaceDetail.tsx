import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogRaceDialog } from "@/components/LogRaceDialog";
import { PredictionBox } from "@/components/PredictionBox";
import { StarRating } from "@/components/StarRating";
import { AddToListDialog } from "@/components/AddToListDialog";
import { RaceHighlightsDialog } from "@/components/RaceHighlightsDialog";
import { FriendsRatings } from "@/components/FriendsRatings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Heart, Bookmark, Share2, Eye, Star, MessageSquare, List, Edit, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { addToWatchlist, removeFromWatchlist } from "@/services/watchlist";
import { toggleLike } from "@/services/likes";
import { getCountryFlag } from "@/services/f1Api";
import { getRaceByYearAndRound as getFirestoreRaceByYearAndRound } from "@/services/f1Calendar";
import { getRaceLogById, getPublicRaceLogs, getRaceLogsByRace, deleteRaceLog, getWeGotYouYukiCount } from "@/services/raceLogs";
import { auth } from "@/lib/firebase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const RaceDetail = () => {
  const { id, season, round } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const highlightReviewId = searchParams.get('highlight');
  const year = season;
  const currentUser = auth.currentUser;

  // Only log on mount to avoid spam
  // console.log('[RaceDetail] URL Params:', { id, season, year, round, highlightReviewId });
  // console.log('[RaceDetail] Highlight parameter from URL:', highlightReviewId);

  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [raceLog, setRaceLog] = useState<any>(null);
  const [raceInfo, setRaceInfo] = useState<any>(null);
  const [allRaceLogs, setAllRaceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [yukiTributeCount, setYukiTributeCount] = useState<number>(0);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const [winner, setWinner] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviewFilter, setReviewFilter] = useState<'recent' | 'liked'>('recent');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'race' | 'sprint' | 'qualifying' | 'sprintQualifying'>('all');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadRaceData = async () => {
    try {
      if (id) {
        const log = await getRaceLogById(id);

        if (log) {
          setRaceLog(log);
          setLoading(false); // Show content immediately with log data

          const user = auth.currentUser;
          if (user) {
            setIsLiked(log.likedBy?.includes(user.uid) || false);
          }

          // Load additional data in background
          const parallelTasks = [];

          // Load race-specific logs
          parallelTasks.push(
            getRaceLogsByRace(log.raceName, log.raceYear).catch(() => [])
          );

          // Add race info fetch if we have year and round
          if (log.raceYear && log.round) {
            parallelTasks.push(
              getFirestoreRaceByYearAndRound(log.raceYear, log.round).catch(() => null)
            );
          }

          const [raceLogs, firestoreRace] = await Promise.all(parallelTasks);

          setAllRaceLogs(raceLogs || []);

          if (firestoreRace) {
            const raceData = {
              meeting_key: firestoreRace.round,
              year: firestoreRace.year,
              round: firestoreRace.round,
              meeting_name: firestoreRace.raceName,
              circuit_short_name: firestoreRace.circuitName,
              date_start: firestoreRace.dateStart.toISOString(),
              country_code: firestoreRace.countryCode,
              country_name: firestoreRace.countryName,
              location: firestoreRace.location
            };
            setRaceInfo(raceData);
          }
        }
      } else if (year && round) {
        // Fetch race info from Firestore first and show immediately
        const firestoreRace = await getFirestoreRaceByYearAndRound(parseInt(year), parseInt(round));

        if (firestoreRace) {
          const raceData = {
            meeting_key: firestoreRace.round,
            year: firestoreRace.year,
            round: firestoreRace.round,
            meeting_name: firestoreRace.raceName,
            circuit_short_name: firestoreRace.circuitName,
            date_start: firestoreRace.dateStart.toISOString(),
            country_code: firestoreRace.countryCode,
            country_name: firestoreRace.countryName,
            location: firestoreRace.location
          };

          setRaceInfo(raceData);
          setLoading(false); // Show content immediately

          // Load logs and Yuki tribute in parallel
          const parallelTasks = [
            getRaceLogsByRace(firestoreRace.raceName, firestoreRace.year).catch(() => [])
          ];

          // Load Yuki tribute count for Abu Dhabi 2025
          if (firestoreRace.raceName.toLowerCase().includes('abu dhabi') && firestoreRace.year === 2025) {
            parallelTasks.push(
              getWeGotYouYukiCount(firestoreRace.raceName, firestoreRace.year).catch(() => 0)
            );
          }

          const results = await Promise.all(parallelTasks);
          setAllRaceLogs(results[0] || []);
          if (results[1] !== undefined) {
            setYukiTributeCount(results[1]);
          }
        } else {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('[RaceDetail] Error loading race data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadRaceData();
  }, [id, season, round]);

  // Auto-expand reviews when there's a highlight parameter
  useEffect(() => {
    if (highlightReviewId && !loading) {
      // Automatically show all reviews if there's a highlight parameter
      setShowAllReviews(true);
    }
  }, [highlightReviewId, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
        <Header />
        <main className="container px-4 sm:px-6 py-6 sm:py-8">
          {/* Loading Skeleton */}
          <div className="animate-pulse">
            {/* Title Skeleton */}
            <div className="h-8 bg-gray-800/50 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-800/30 rounded w-1/2 mb-8"></div>

            {/* Hero Image Skeleton */}
            <div className="w-full h-64 bg-gray-800/30 rounded-lg mb-6"></div>

            {/* Stats Skeleton */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="h-20 bg-gray-800/30 rounded-lg"></div>
              <div className="h-20 bg-gray-800/30 rounded-lg"></div>
              <div className="h-20 bg-gray-800/30 rounded-lg"></div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-800/30 rounded w-full"></div>
              <div className="h-4 bg-gray-800/30 rounded w-5/6"></div>
              <div className="h-4 bg-gray-800/30 rounded w-4/6"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Use raceInfo from F1 API if no logs exist
  let race = null;

  // Calculate average rating from all race logs
  const calculateAverageRating = (raceName: string, raceYear: number) => {
    const raceLogs = allRaceLogs.filter(l => l.raceName === raceName && l.raceYear === raceYear && l.rating);
    if (raceLogs.length === 0) return { avgRating: 0, totalRatings: 0 };
    const sum = raceLogs.reduce((acc, log) => acc + (log.rating || 0), 0);
    const average = sum / raceLogs.length;
    // Round to nearest 0.5 for half-star precision
    const roundedAverage = Math.round(average * 2) / 2;
    return {
      avgRating: roundedAverage,
      totalRatings: raceLogs.length
    };
  };

  if (raceLog) {
    const { avgRating, totalRatings } = calculateAverageRating(raceLog.raceName, raceLog.raceYear);
    race = {
      season: raceLog.raceYear,
      round: raceLog.round || 1,
      gpName: raceLog.raceName,
      circuit: raceLog.raceLocation,
      country: raceLog.raceLocation,
      countryCode: raceLog.countryCode || 'ae',
      date: raceLog.dateWatched?.toDate?.()?.toISOString() || new Date().toISOString(),
      rating: avgRating,
      totalRatings: totalRatings,
      watched: allRaceLogs.filter(l => l.raceName === raceLog.raceName && l.raceYear === raceLog.raceYear).length,
    };
  } else if (raceInfo) {
    const { avgRating, totalRatings } = calculateAverageRating(raceInfo.meeting_name, raceInfo.year);
    race = {
      season: raceInfo.year,
      round: raceInfo.round,
      gpName: raceInfo.meeting_name,
      circuit: raceInfo.circuit_short_name,
      country: raceInfo.country_name,
      countryCode: raceInfo.country_code || 'BRN',
      date: raceInfo.date_start,
      rating: avgRating,
      totalRatings: totalRatings,
      watched: allRaceLogs.filter(l => l.raceName === raceInfo.meeting_name && l.raceYear === raceInfo.year).length,
    };
  }

  if (!race) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] racing-grid">
        <Header />
        <div className="container py-8 text-center">
          <p className="text-gray-400 font-bold uppercase tracking-wider">Race not found. Please try again.</p>
        </div>
      </div>
    );
  }

  const flagUrl = getCountryFlag(race.countryCode);

  const handleWatchlistToggle = async () => {
    try {
      if (isInWatchlist && watchlistId) {
        await removeFromWatchlist(watchlistId);
        setIsInWatchlist(false);
        setWatchlistId(null);
        toast({ title: "Removed from watchlist" });
      } else {
        const id = await addToWatchlist({
          userId: '',
          raceYear: race.season,
          raceName: race.gpName,
          raceLocation: race.circuit,
          raceDate: new Date(race.date),
          notes: '',
          reminderEnabled: false,
        });
        setIsInWatchlist(true);
        setWatchlistId(id);
        toast({ title: "Added to watchlist" });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const reviews = allRaceLogs
    .filter(log => {
      if (!raceLog && !raceInfo) return false;
      const targetRaceName = raceLog?.raceName || raceInfo?.meeting_name;
      const targetRaceYear = raceLog?.raceYear || raceInfo?.year;
      const matchesRace = log.raceName === targetRaceName &&
        log.raceYear === targetRaceYear &&
        log.review &&
        log.review.length > 0;

      // Apply session filter
      if (sessionFilter === 'all') {
        return matchesRace;
      }
      return matchesRace && log.sessionType === sessionFilter;
    })
    .sort((a, b) => {
      // Always put highlighted review first
      if (highlightReviewId) {
        if (a.id === highlightReviewId) return -1;
        if (b.id === highlightReviewId) return 1;
      }

      // Put current user's review at the top (if not highlighted)
      if (currentUser) {
        if (a.userId === currentUser.uid) return -1;
        if (b.userId === currentUser.uid) return 1;
      }

      if (reviewFilter === 'liked') {
        // Sort by likes count (descending)
        const aLikes = a.likesCount || 0;
        const bLikes = b.likesCount || 0;
        return bLikes - aLikes;
      } else {
        // Sort by most recent (descending)
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return bDate.getTime() - aDate.getTime();
      }
    });

  // Debug: Log review IDs and highlight match
  if (highlightReviewId) {
    console.log('[RaceDetail] Looking for review ID:', highlightReviewId);
    console.log('[RaceDetail] Available review IDs:', reviews.map(r => r.id));
    console.log('[RaceDetail] All race logs count:', allRaceLogs.length);
    console.log('[RaceDetail] Filtered reviews count:', reviews.length);
    const matchingLog = allRaceLogs.find(log => log.id === highlightReviewId);
    if (matchingLog) {
      console.log('[RaceDetail] Found matching log:', {
        id: matchingLog.id,
        raceName: matchingLog.raceName,
        raceYear: matchingLog.raceYear,
        hasReview: !!matchingLog.review
      });
      console.log('[RaceDetail] Current page race:', {
        raceName: raceLog?.raceName || raceInfo?.meeting_name,
        raceYear: raceLog?.raceYear || raceInfo?.year
      });
    } else {
      console.log('[RaceDetail] No matching log found in allRaceLogs');
    }
  }

  const handleLikeReview = async (reviewId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    // Optimistic update - update UI immediately
    setAllRaceLogs(prevLogs =>
      prevLogs.map(log => {
        if (log.id === reviewId) {
          const isCurrentlyLiked = log.likedBy?.includes(user.uid);
          return {
            ...log,
            likedBy: isCurrentlyLiked
              ? log.likedBy.filter(id => id !== user.uid)
              : [...(log.likedBy || []), user.uid],
            likesCount: (log.likesCount || 0) + (isCurrentlyLiked ? -1 : 1)
          };
        }
        return log;
      })
    );

    try {
      await toggleLike(reviewId);
    } catch (error: any) {
      // Revert optimistic update on error
      const targetRaceName = raceLog?.raceName || raceInfo?.meeting_name;
      const targetRaceYear = raceLog?.raceYear || raceInfo?.year;
      if (targetRaceName && targetRaceYear) {
        const logs = await getRaceLogsByRace(targetRaceName, targetRaceYear);
        setAllRaceLogs(logs);
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLikeRace = async () => {
    if (!id) return;
    const user = auth.currentUser;
    if (!user) return;

    // Optimistic update - update UI immediately
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);

    if (raceLog) {
      setRaceLog({
        ...raceLog,
        likedBy: wasLiked
          ? raceLog.likedBy?.filter(uid => uid !== user.uid) || []
          : [...(raceLog.likedBy || []), user.uid],
        likesCount: (raceLog.likesCount || 0) + (wasLiked ? -1 : 1)
      });
    }

    try {
      await toggleLike(id);
      toast({ title: !wasLiked ? "Added to likes" : "Removed from likes" });
    } catch (error: any) {
      // Revert optimistic update on error
      setIsLiked(wasLiked);
      const log = await getRaceLogById(id);
      setRaceLog(log);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({ title: isBookmarked ? "Bookmark removed" : "Bookmarked" });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({
          title: race.gpName,
          text: `Check out ${race.gpName} on BoxBoxd`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (error) {
      toast({ title: "Link copied to clipboard" });
    }
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviewToDelete(reviewId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      console.log('[confirmDeleteReview] Attempting to delete review:', reviewToDelete);
      console.log('[confirmDeleteReview] Current user:', auth.currentUser?.uid);
      await deleteRaceLog(reviewToDelete);
      toast({ title: "Review deleted successfully" });
      await loadRaceData(); // Reload data
    } catch (error: any) {
      console.error('[confirmDeleteReview] Delete error:', error);
      console.error('[confirmDeleteReview] Error code:', error.code);
      console.error('[confirmDeleteReview] Error message:', error.message);

      let errorMessage = error.message;
      if (error.code === 'permission-denied') {
        errorMessage = "You don't have permission to delete this review";
      } else if (error.code === 'unavailable' || error.message?.includes('offline')) {
        errorMessage = "Unable to connect to server. Please check your internet connection";
      }

      toast({
        title: "Error deleting review",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
    }
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setLogDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8 max-w-full">
        <div className="max-w-5xl mx-auto">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Poster & Info */}
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:items-start">
              <div className="w-full md:w-auto bg-black/95 overflow-hidden relative flex-shrink-0">
                {/* Racing stripe accent at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-racing-red to-transparent"></div>
                {/* Checkered flag pattern overlay */}
                <div className="absolute top-0 right-0 w-16 h-16 opacity-10" style={{
                  backgroundImage: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)',
                  backgroundPosition: '0 0, 8px 8px',
                  backgroundSize: '16px 16px'
                }}></div>

                <div className="flex flex-row items-center justify-start p-4 md:p-6 gap-4 md:gap-6 bg-gradient-to-br from-racing-red/5 via-transparent to-transparent relative">
                  {/* Vertical racing red accent line */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent"></div>

                  <div className="w-24 h-16 md:w-32 md:h-20 overflow-hidden border-2 border-racing-red shadow-xl shadow-racing-red/50 flex-shrink-0 ml-2">
                    <img
                      src={flagUrl}
                      alt={race.country}
                      className="w-full h-full object-cover"
                      loading="eager"
                      fetchpriority="high"
                    />
                  </div>
                  <div className="flex flex-col items-start justify-center flex-1 space-y-1 min-w-0">
                    <div className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] tracking-tight uppercase">{race.season}</div>
                    <div className="text-sm md:text-base font-black uppercase tracking-wider text-racing-red drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] leading-tight">{race.gpName}</div>
                  </div>
                </div>

                {/* Bottom racing stripe */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-racing-red via-white to-racing-red"></div>
              </div>

              <div className="space-y-3 md:space-y-4">
                {winner && (
                  <div className="p-4 bg-racing-red/15 border-2 border-racing-red/40 rounded-lg">
                    <p className="text-sm text-gray-200 mb-1 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)] text-center md:text-left">Race Winner</p>
                    <p className="text-base font-black text-racing-red flex items-center justify-center md:justify-start gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                      <span>🏆</span>
                      <span>{winner}</span>
                    </p>
                  </div>
                )}

                {/* MAIN FOCUS: Rating */}
                <div className="flex justify-center md:justify-start mb-4">
                  <StarRating
                    rating={race.rating}
                    readonly
                    totalRatings={race.totalRatings}
                    onClickWhenReadonly={() => setLogDialogOpen(true)}
                    size="sm"
                  />
                </div>

                {/* Friends' Ratings */}
                <FriendsRatings
                  raceName={race.gpName}
                  raceYear={race.season}
                  allRaceLogs={allRaceLogs}
                />

                {/* Small info boxes */}
                <div className="flex gap-2 text-xs text-gray-400 justify-center md:justify-start flex-wrap">
                  <span>{race.circuit}</span>
                  <span>•</span>
                  <span>{race.country}</span>
                  <span>•</span>
                  <span>{new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* Action Icons */}
                <div className="flex gap-2 flex-wrap justify-center md:justify-start mt-4">
                  <LogRaceDialog
                    trigger={
                      <Button size="icon" className="h-9 w-9 bg-racing-red hover:bg-red-600 border-2 border-red-400 shadow-lg shadow-red-500/30">
                        <Plus className="w-4 h-4" />
                      </Button>
                    }
                    open={logDialogOpen}
                    onOpenChange={(open) => {
                      setLogDialogOpen(open);
                      if (!open) setEditingReview(null);
                    }}
                    onSuccess={() => {
                      loadRaceData();
                      setEditingReview(null);
                    }}
                    defaultCircuit={race.circuit}
                    defaultRaceName={race.gpName}
                    defaultYear={race.season}
                    defaultCountryCode={race.countryCode}
                    defaultDate={race.date}
                    existingLog={editingReview}
                    editMode={!!editingReview}
                  />
                  <AddToListDialog
                    raceYear={race.season}
                    raceName={race.gpName}
                    raceLocation={race.circuit}
                    countryCode={race.countryCode}
                    trigger={
                      <Button size="icon" variant="outline" className="h-9 w-9 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                        <List className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
                      </Button>
                    }
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                    onClick={handleWatchlistToggle}
                  >
                    <Eye className={`w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isInWatchlist ? 'fill-current' : ''}`} />
                  </Button>
                  {id && (
                    <Button size="icon" variant="outline" className="h-9 w-9 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" onClick={handleLikeRace}>
                      <Heart className={`w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isLiked ? 'fill-racing-red text-racing-red' : ''}`} />
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="h-9 w-9 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" onClick={handleBookmark}>
                    <Bookmark className={`w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" onClick={handleShare}>
                    <Share2 className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
                  </Button>
                </div>

                {/* What Happened Button */}
                <div className="mt-4 flex justify-center md:justify-start">
                  <RaceHighlightsDialog
                    year={race.season}
                    round={race.round}
                    raceName={race.gpName}
                  />
                </div>
              </div>
            </div>

            {/* Prediction Box - Only for Abu Dhabi GP - TEMPORARILY HIDDEN */}
            {false && race.gpName?.toLowerCase().includes('abu dhabi') && (
              <div className="mb-6">
                <PredictionBox
                  raceName={race.gpName}
                  raceYear={race.season}
                  round={race.round}
                  locked={true}
                />
              </div>
            )}

            {/* Abu Dhabi GP Features */}
            {race.gpName?.toLowerCase().includes('abu dhabi') && (
              <div className="mb-6 space-y-4">
                {/* Yuki Tribute Counter */}
                {race.season === 2025 && (
                  <Card className="p-4 border-2 border-racing-red/40 bg-black/90 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                          #WeGotYouYuki
                        </h3>
                        <p className="text-xs text-gray-400">
                          Supporting Yuki in his final RB race
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-racing-red">
                          {yukiTributeCount}
                        </div>
                        <div className="text-xs text-gray-400 font-bold uppercase">
                          {yukiTributeCount === 1 ? 'Tribute' : 'Tributes'}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

              </div>
            )}

            {/* Reviews */}
            <div>
              <div className="mb-4 md:mb-6 flex items-center justify-between flex-wrap gap-3">
                <span className="text-racing-red font-black text-xs tracking-widest">RACE REVIEWS ({reviews.length})</span>
                {reviews.length > 0 && (
                  <div className="flex gap-2">
                    <Select value={sessionFilter} onValueChange={(value: any) => setSessionFilter(value)}>
                      <SelectTrigger className="w-[130px] h-7 text-xs font-bold uppercase tracking-wider bg-black/60 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-gray-700">
                        <SelectItem value="all" className="text-xs font-bold uppercase text-white cursor-pointer">All Sessions</SelectItem>
                        <SelectItem value="race" className="text-xs font-bold uppercase text-white cursor-pointer">🏁 Race</SelectItem>
                        <SelectItem value="sprint" className="text-xs font-bold uppercase text-white cursor-pointer">⚡ Sprint</SelectItem>
                        <SelectItem value="qualifying" className="text-xs font-bold uppercase text-white cursor-pointer">🏎️ Qualifying</SelectItem>
                        <SelectItem value="sprintQualifying" className="text-xs font-bold uppercase text-white cursor-pointer">⚡ Sprint Qual</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reviewFilter} onValueChange={(value: 'recent' | 'liked') => setReviewFilter(value)}>
                      <SelectTrigger className="w-[120px] h-7 text-xs font-bold uppercase tracking-wider bg-black/60 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-gray-700">
                        <SelectItem value="recent" className="text-xs font-bold uppercase text-white cursor-pointer">Most Recent</SelectItem>
                        <SelectItem value="liked" className="text-xs font-bold uppercase text-white cursor-pointer">Most Liked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-4 md:space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-gray-400">
                    <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs sm:text-sm text-gray-500">No reviews yet. Be the first to review this race!</p>
                  </div>
                ) : (
                  <>
                  {(showAllReviews ? reviews : reviews.slice(0, 10)).map((review) => {
                    const isHighlighted = highlightReviewId === review.id;
                    return (<Card
                      key={review.id}
                      className={`p-4 sm:p-5 border backdrop-blur-sm hover:bg-black/80 transition-all ${
                        isHighlighted
                          ? 'border-racing-red border-2 bg-racing-red/10 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                          : 'border-gray-800 bg-black/60'
                      }`}
                    >
                      {/* Header with avatar and name */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center font-bold text-sm overflow-hidden text-white flex-shrink-0">
                          {review.userAvatar ? (
                            <img
                              src={review.userAvatar}
                              alt={review.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{review.username?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="font-bold text-sm sm:text-base hover:text-racing-red transition-colors cursor-pointer text-white"
                              onClick={() => navigate(`/user/${review.userId}`)}
                            >
                              {review.username}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-400">
                              {review.createdAt instanceof Date
                                ? review.createdAt.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : 'Recently'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  i < review.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-gray-700 fill-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Review content */}
                      <div className="space-y-2.5">
                        {/* Session Type Badge */}
                        {review.sessionType && (
                          <div className="inline-block">
                            <Badge variant="outline" className={`text-xs font-bold uppercase tracking-wider ${
                              review.sessionType === 'race' ? 'border-racing-red/60 text-racing-red' :
                              review.sessionType === 'sprint' ? 'border-orange-500/60 text-orange-500' :
                              review.sessionType === 'qualifying' ? 'border-blue-500/60 text-blue-500' :
                              review.sessionType === 'sprintQualifying' ? 'border-purple-500/60 text-purple-500' :
                              'border-gray-500/60 text-gray-500'
                            }`}>
                              {review.sessionType === 'race' ? '🏁 Race' :
                               review.sessionType === 'sprint' ? '⚡ Sprint' :
                               review.sessionType === 'qualifying' ? '🏎️ Qualifying' :
                               review.sessionType === 'sprintQualifying' ? '⚡ Sprint Qualifying' :
                               review.sessionType}
                            </Badge>
                          </div>
                        )}

                        {/* Driver of the Day */}
                        {review.driverOfTheDay && (
                          <div className="text-xs text-gray-400">
                            <span className="font-medium">Driver of the Day: </span>
                            <span className="text-white font-semibold">🏆 {review.driverOfTheDay}</span>
                          </div>
                        )}

                        {/* Review text */}
                        {review.spoilerWarning && !revealedSpoilers.has(review.id) ? (
                          <div className="relative min-h-[80px]">
                            <div className="text-sm leading-relaxed blur-sm select-none pointer-events-none text-gray-300">
                              {review.review}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                onClick={() => setRevealedSpoilers(new Set([...revealedSpoilers, review.id]))}
                                className="bg-racing-red hover:bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg"
                              >
                                ⚠️ Show Spoilers
                              </button>
                            </div>
                          </div>
                        ) : review.review && (
                          <div className="text-sm leading-relaxed text-gray-200">
                            {review.review.length > 300 && !expandedReviews.has(review.id) ? (
                              <>
                                <p className="whitespace-pre-wrap">{review.review.substring(0, 300)}...</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedReviews(new Set([...expandedReviews, review.id]));
                                  }}
                                  className="text-racing-red hover:text-red-400 text-xs font-semibold mt-1"
                                >
                                  Read more
                                </button>
                              </>
                            ) : (
                              <p className="whitespace-pre-wrap">{review.review}</p>
                            )}
                          </div>
                        )}

                        {/* Companions */}
                        {review.companions && review.companions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500">
                            <span>Watched with</span>
                            {review.companions.map((companion: string) => (
                              <span key={companion} className="text-racing-red font-medium">
                                @{companion}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions footer */}
                      <div className="flex items-center gap-6 mt-3 pt-3 border-t border-gray-800">
                        <button
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-racing-red transition-colors select-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            review.id && handleLikeReview(review.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Heart className={`w-4 h-4 ${
                            review.likedBy?.includes(auth.currentUser?.uid || '')
                              ? 'fill-racing-red text-racing-red'
                              : ''
                          }`} />
                          <span className="font-medium">{review.likesCount > 0 ? review.likesCount : 'Like'}</span>
                        </button>

                        <button
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-racing-red transition-colors"
                          onClick={() => {
                            const reviewUrl = `${window.location.origin}/race/${review.raceYear}/${review.round || '1'}?highlight=${review.id}`;
                            const tweetText = `Just watched the ${review.raceName}! 🏁\n\nLogged on @Box_Boxd\n${reviewUrl}`;

                            // Detect if on mobile device
                            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

                            if (isMobile) {
                              // Try to open Twitter app first, fallback to web
                              const twitterAppUrl = `twitter://post?message=${encodeURIComponent(tweetText)}`;
                              const twitterWebUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

                              // Try opening the Twitter app
                              window.location.href = twitterAppUrl;

                              // Fallback to web after a short delay if app doesn't open
                              setTimeout(() => {
                                window.open(twitterWebUrl, '_blank');
                              }, 500);
                            } else {
                              // Desktop: open web version
                              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="font-medium">Share</span>
                        </button>

                        {/* Edit & Delete buttons - only show for own reviews */}
                        {auth.currentUser?.uid === review.userId && (
                          <div className="flex items-center gap-3">
                            <button
                              className="text-sm text-gray-400 hover:text-white transition-colors"
                              onClick={() => handleEditReview(review)}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              className="text-sm text-gray-400 hover:text-racing-red transition-colors"
                              onClick={() => review.id && handleDeleteReview(review.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </Card>);
                  })}

                  {/* View More Button */}
                  {reviews.length > 10 && !showAllReviews && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => setShowAllReviews(true)}
                        variant="outline"
                        className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-bold uppercase tracking-wider"
                      >
                        View More Reviews ({reviews.length - 10} more)
                      </Button>
                    </div>
                  )}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0a0a0a] border-2 border-racing-red/40">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white font-black uppercase tracking-wider">Delete Review?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently delete your review. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-2 border-gray-700 bg-black/60 text-white hover:bg-gray-800 font-bold uppercase tracking-wider">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteReview}
              className="bg-racing-red hover:bg-red-600 text-white border-2 border-red-400 shadow-lg shadow-red-500/30 font-bold uppercase tracking-wider"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RaceDetail;
