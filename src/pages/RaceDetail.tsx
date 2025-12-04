import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogRaceDialog } from "@/components/LogRaceDialog";
import { StarRating } from "@/components/StarRating";
import { AddToListDialog } from "@/components/AddToListDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Heart, Bookmark, Share2, Eye, Star, MessageSquare, List, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { addToWatchlist, removeFromWatchlist } from "@/services/watchlist";
import { toggleLike } from "@/services/likes";
import { getCountryFlag } from "@/services/f1Api";
import { getRaceByYearAndRound as getFirestoreRaceByYearAndRound } from "@/services/f1Calendar";
import { getRaceLogById, getPublicRaceLogs, deleteRaceLog } from "@/services/raceLogs";
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
  const year = season;

  // Only log on mount to avoid spam
  console.log('[RaceDetail] URL Params:', { id, season, year, round });

  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [raceLog, setRaceLog] = useState<any>(null);
  const [raceInfo, setRaceInfo] = useState<any>(null);
  const [allRaceLogs, setAllRaceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const [winner, setWinner] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [reviewFilter, setReviewFilter] = useState<'recent' | 'liked'>('recent');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { toast } = useToast();

  const loadRaceData = async () => {
    console.log('[RaceDetail] Starting data load...');

    // Try to load public race logs, but don't let it block the rest
    try {
      const logs = await getPublicRaceLogs(100);
      console.log('[RaceDetail] Loaded', logs.length, 'public race logs');
      setAllRaceLogs(logs);
    } catch (error) {
      console.warn('[RaceDetail] Failed to load public logs (probably missing index):', error);
      setAllRaceLogs([]);
    }

    try {
      if (id) {
        console.log('[RaceDetail] Loading by ID:', id);
        const log = await getRaceLogById(id);
        console.log('[RaceDetail] Race log by ID:', log);

        if (log) {
          setRaceLog(log);

          const user = auth.currentUser;
          if (user) {
            setIsLiked(log.likedBy?.includes(user.uid) || false);
          }

          // Try to load the race info from Firestore using the log's race details
          if (log.raceYear && log.round) {
            try {
              const firestoreRace = await getFirestoreRaceByYearAndRound(log.raceYear, log.round);
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
            } catch (error) {
              console.warn('[RaceDetail] Could not load race info for log:', error);
            }
          }
        }
      } else if (year && round) {
        console.log('[RaceDetail] Loading by year/round:', year, round);

        // Fetch race info from Firestore
        console.log('[RaceDetail] Fetching from Firestore: year=', parseInt(year), 'round=', parseInt(round));
        const firestoreRace = await getFirestoreRaceByYearAndRound(parseInt(year), parseInt(round));
        console.log('[RaceDetail] Firestore returned:', firestoreRace);

        if (firestoreRace) {
          console.log('[RaceDetail] ✅ Found race in Firestore:', firestoreRace);
          // Convert Firestore format to expected format
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

          // Winner will be stored in Firestore in the future
          // For now, we don't fetch from external APIs
          console.log('[RaceDetail] Race data loaded successfully from Firestore');
        } else {
          console.error('[RaceDetail] ❌ Race not found in Firestore for year:', year, 'round:', round);
          console.error('[RaceDetail] This race may not be seeded in the database yet.');
        }
      } else {
        console.error('[RaceDetail] No id, year, or round found in URL params!');
      }
    } catch (error) {
      console.error('[RaceDetail] Error loading race data:', error);
    } finally {
      setLoading(false);
      console.log('[RaceDetail] Loading complete');
    }
  };

  useEffect(() => {
    console.log('[RaceDetail] useEffect triggered with:', { id, year, round });
    setLoading(true);
    loadRaceData();
  }, [id, season, round]); // Use 'season' instead of 'year' to avoid stale closure

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] racing-grid">
        <Header />
        <div className="container py-8 text-center text-white font-black uppercase tracking-wider">Loading...</div>
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
    return {
      avgRating: sum / raceLogs.length,
      totalRatings: raceLogs.length
    };
  };

  if (raceLog) {
    console.log('Using race log data:', raceLog);
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
    console.log('Using F1 API data:', raceInfo);
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

  console.log('Final race object:', race);

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
      return log.raceName === targetRaceName &&
        log.raceYear === targetRaceYear &&
        log.review &&
        log.review.length > 0;
    })
    .sort((a, b) => {
      if (reviewFilter === 'liked') {
        // Sort by likes count (descending)
        const aLikes = a.likesCount || 0;
        const bLikes = b.likesCount || 0;
        console.log('[RaceDetail] Sorting by likes:', { aUser: a.username, aLikes, bUser: b.username, bLikes });
        return bLikes - aLikes;
      } else {
        // Sort by most recent (descending)
        const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        console.log('[RaceDetail] Sorting by date:', { aUser: a.username, aDate, bUser: b.username, bDate });
        return bDate.getTime() - aDate.getTime();
      }
    });

  // Log the final sorted order
  console.log('[RaceDetail] Reviews after sorting:', reviews.map(r => ({
    username: r.username,
    likesCount: r.likesCount || 0,
    createdAt: r.createdAt
  })));

  const handleLikeReview = async (reviewId: string) => {
    try {
      const liked = await toggleLike(reviewId);
      const logs = await getPublicRaceLogs(100);
      setAllRaceLogs(logs);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLikeRace = async () => {
    if (!id) return;
    try {
      const liked = await toggleLike(id);
      setIsLiked(liked);
      toast({ title: liked ? "Added to likes" : "Removed from likes" });

      const log = await getRaceLogById(id);
      setRaceLog(log);
    } catch (error: any) {
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
      await deleteRaceLog(reviewToDelete);
      toast({ title: "Review deleted successfully" });
      await loadRaceData(); // Reload data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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

                {/* Small info boxes */}
                <div className="flex gap-2 text-xs text-gray-400 justify-center md:justify-start flex-wrap">
                  <span>{race.circuit}</span>
                  <span>•</span>
                  <span>{race.country}</span>
                  <span>•</span>
                  <span>{new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* Action Icons */}
                <div className="flex gap-2 justify-center md:justify-start mt-4">
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
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="mb-4 md:mb-6 flex items-center justify-between flex-wrap gap-3">
                <span className="text-racing-red font-black text-xs tracking-widest">RACE REVIEWS ({reviews.length})</span>
                {reviews.length > 0 && (
                  <Select value={reviewFilter} onValueChange={(value: 'recent' | 'liked') => setReviewFilter(value)}>
                    <SelectTrigger className="w-[140px] h-7 text-xs font-bold uppercase tracking-wider bg-black/60 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/95 border-gray-700">
                      <SelectItem value="recent" className="text-xs font-bold uppercase text-white cursor-pointer">Most Recent</SelectItem>
                      <SelectItem value="liked" className="text-xs font-bold uppercase text-white cursor-pointer">Most Liked</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {(showAllReviews ? reviews : reviews.slice(0, 10)).map((review) => (
                    <Card key={review.id} className="p-4 sm:p-5 border border-gray-800 bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-all">
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
                              {review.dateWatched instanceof Date
                                ? review.dateWatched.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : review.createdAt instanceof Date
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
                          <p className="text-sm leading-relaxed text-gray-200">
                            {review.review}
                          </p>
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
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-racing-red transition-colors"
                          onClick={() => review.id && handleLikeReview(review.id)}
                        >
                          <Heart className={`w-4 h-4 ${
                            review.likedBy?.includes(auth.currentUser?.uid || '')
                              ? 'fill-racing-red text-racing-red'
                              : ''
                          }`} />
                          <span className="font-medium">{review.likesCount > 0 ? review.likesCount : 'Like'}</span>
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
                    </Card>
                  ))}

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
