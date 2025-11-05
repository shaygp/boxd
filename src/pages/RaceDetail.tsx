import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogRaceDialog } from "@/components/LogRaceDialog";
import { StarRating } from "@/components/StarRating";
import { AddToListDialog } from "@/components/AddToListDialog";
import { Plus, Heart, Bookmark, Share2, Eye, Star, MessageSquare, List, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { addToWatchlist, removeFromWatchlist } from "@/services/watchlist";
import { toggleLike } from "@/services/likes";
import { getCountryFlag, getRaceByYearAndRound, getRaceWinner } from "@/services/f1Api";
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
        setRaceLog(log);

        const user = auth.currentUser;
        if (user && log) {
          setIsLiked(log.likedBy?.includes(user.uid) || false);
        }
      } else if (year && round) {
        console.log('[RaceDetail] Loading by year/round:', year, round);

        // Always fetch race info from F1 API
        console.log('[RaceDetail] Fetching from F1 API: year=', parseInt(year), 'round=', parseInt(round));
        const raceData = await getRaceByYearAndRound(parseInt(year), parseInt(round));
        console.log('[RaceDetail] F1 API returned:', raceData);
        if (raceData) {
          setRaceInfo(raceData);

          // Fetch winner if race is in the past
          const raceDate = new Date(raceData.date_start);
          if (raceDate < new Date()) {
            try {
              const raceWinner = await getRaceWinner(parseInt(year), parseInt(round));
              if (raceWinner) {
                setWinner(raceWinner);
              }
            } catch (error) {
              console.error('[RaceDetail] Error fetching winner:', error);
            }
          }
        } else {
          console.error('[RaceDetail] F1 API returned null!');
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
    loadRaceData();
  }, [id, year, round]);

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

  const reviews = allRaceLogs.filter(log => {
    if (!raceLog && !raceInfo) return false;
    const targetRaceName = raceLog?.raceName || raceInfo?.meeting_name;
    const targetRaceYear = raceLog?.raceYear || raceInfo?.year;
    return log.raceName === targetRaceName &&
      log.raceYear === targetRaceYear &&
      log.review &&
      log.review.length > 0;
  });

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
    <div className="min-h-[100vh] min-h-[100dvh] bg-[#0a0a0a] racing-grid pb-[env(safe-area-inset-bottom,4rem)] lg:pb-0">
      <Header />

      <main className="container px-[4vw] py-[2vh] sm:py-[3vh] max-w-full">
        <div className="grid lg:grid-cols-3 gap-[3vh] sm:gap-[4vh]">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Poster & Info */}
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-56 lg:w-64 aspect-[16/9] md:aspect-[2/3] bg-gradient-to-br from-racing-red/30 to-black/90 rounded-lg overflow-hidden relative border-2 border-red-900/40 mx-auto md:mx-0">
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-6 gap-3 md:gap-4 bg-gradient-to-b from-transparent via-black/30 to-black/70">
                  <div className="w-28 h-[70px] md:w-32 md:h-20 rounded overflow-hidden border-2 border-racing-red/40 shadow-xl shadow-black/50 flex-shrink-0">
                    <img
                      src={flagUrl}
                      alt={race.country}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center flex-shrink-0">
                    <div className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{race.season}</div>
                    <div className="text-xs md:text-sm mt-1 md:mt-2 font-black line-clamp-2 uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)] px-2">{race.gpName}</div>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4">
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
                  />
                </div>

                {/* Small info boxes */}
                <div className="flex gap-2 text-xs text-gray-400 justify-center md:justify-start">
                  <span>{race.circuit}</span>
                  <span>•</span>
                  <span>{race.country}</span>
                  <span>•</span>
                  <span>{new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                {/* ICONS ONLY */}
                <div className="flex gap-2 justify-center md:justify-start mt-4">
                  <LogRaceDialog
                    trigger={
                      <Button size="sm" className="gap-2 bg-racing-red hover:bg-red-600 border-2 border-red-400 shadow-lg shadow-red-500/30 font-black uppercase tracking-wider">
                        <Plus className="w-4 h-4" />
                        <span className="hidden xs:inline">Log</span>
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
                  />
                  <AddToListDialog
                    raceYear={race.season}
                    raceName={race.gpName}
                    raceLocation={race.circuit}
                    countryCode={race.countryCode}
                    trigger={
                      <Button size="sm" variant="outline" className="gap-2 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                        <List className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
                        <span className="hidden sm:inline">Add to List</span>
                      </Button>
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]"
                    onClick={handleWatchlistToggle}
                  >
                    <Eye className={`w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isInWatchlist ? 'fill-current' : ''}`} />
                    <span className="hidden sm:inline">{isInWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
                  </Button>
                  {id && (
                    <Button size="sm" variant="outline" className="gap-2 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" onClick={handleLikeRace}>
                      <Heart className={`w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isLiked ? 'fill-racing-red text-racing-red' : ''}`} />
                      <span className="hidden xs:inline">{isLiked ? 'Liked' : 'Like'}</span>
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" onClick={handleBookmark}>
                    <Bookmark className={`w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] ${isBookmarked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button variant="outline" size="icon" className="border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" onClick={handleShare}>
                    <Share2 className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div>
              <div className="mb-4 md:mb-6">
                <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-2">
                  <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">RACE REVIEWS</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  COMMUNITY THOUGHTS <span className="text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">({reviews.length})</span>
                </h2>
              </div>

              <div className="space-y-4 md:space-y-6">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-gray-300">
                    <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
                    <p className="text-sm sm:text-base font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No reviews yet. Be the first to review this race!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <Card key={review.id} className="p-5 sm:p-6 border-2 border-red-900/40 bg-black/90 backdrop-blur-sm hover:border-racing-red/60 transition-all">
                      {/* Header with avatar, name, and rating */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/90 border-2 border-racing-red/40 flex items-center justify-center font-black text-base overflow-hidden text-white flex-shrink-0">
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
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-black text-base sm:text-lg hover:text-racing-red transition-colors cursor-pointer text-white">
                              {review.username}
                            </span>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-500 text-yellow-500'
                                      : 'text-gray-600 fill-gray-600'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {review.dateWatched instanceof Date
                              ? review.dateWatched.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : review.createdAt instanceof Date
                                ? review.createdAt.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'Recently'}
                          </div>
                        </div>
                      </div>

                      {/* Review content */}
                      <div className="space-y-3">
                        {/* Driver of the Day */}
                        {review.driverOfTheDay && (
                          <div className="text-sm text-gray-300">
                            <span className="font-bold">Driver of the Day: </span>
                            <span className="text-white font-bold">🏆 {review.driverOfTheDay}</span>
                          </div>
                        )}

                        {/* Review text */}
                        {review.spoilerWarning && !revealedSpoilers.has(review.id) ? (
                          <div className="relative min-h-[100px]">
                            <div className="text-base leading-relaxed blur-sm select-none pointer-events-none text-gray-200">
                              {review.review}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                onClick={() => setRevealedSpoilers(new Set([...revealedSpoilers, review.id]))}
                                className="bg-racing-red hover:bg-racing-red/90 text-white px-4 py-2 rounded text-sm font-bold shadow-lg"
                              >
                                ⚠️ Show Spoilers
                              </button>
                            </div>
                          </div>
                        ) : review.review && (
                          <p className="text-base leading-relaxed text-gray-200">
                            {review.review}
                          </p>
                        )}

                        {/* Companions */}
                        {review.companions && review.companions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-400">
                            <span>Watched with</span>
                            {review.companions.map((companion: string) => (
                              <span key={companion} className="text-white font-medium">
                                @{companion}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions footer */}
                      <div className="flex items-center justify-between gap-4 mt-4">
                        <button
                          className="flex items-center gap-2 text-sm text-gray-400 hover:text-racing-red transition-colors"
                          onClick={() => review.id && handleLikeReview(review.id)}
                        >
                          <Heart className={`w-4 h-4 ${
                            review.likedBy?.includes(auth.currentUser?.uid || '')
                              ? 'fill-racing-red text-racing-red'
                              : ''
                          }`} />
                          <span>{review.likesCount > 0 ? review.likesCount : 'Like'}</span>
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-5 md:p-6 border-2 border-red-900/40 bg-black/90 backdrop-blur-sm shadow-sm">
              <div className="inline-block px-3 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full mb-3">
                <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">POPULAR</span>
              </div>
              <h3 className="font-black text-base sm:text-lg mb-3 sm:mb-4 text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">TRENDING TAGS</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {['overtake', 'late-drama', 'season-finale', 'sunset', 'rain', 'safety-car'].map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs hover:bg-racing-red/10 transition-colors cursor-pointer"
                    onClick={() => navigate(`/?tag=${encodeURIComponent(tag)}`)}
                  >
                    #{tag}
                  </Badge>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your review. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteReview} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default RaceDetail;
