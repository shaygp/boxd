import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCountryFlag } from "@/services/f1Api";
import { getRaceWinner } from "@/data/raceWinners2010-2019";
import { Button } from "@/components/ui/button";
import { addToWatchlist, removeFromWatchlist, getUserWatchlist } from "@/services/watchlist";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { useState, useEffect, memo } from "react";
import { AddToListDialog } from "@/components/AddToListDialog";
import { LogRaceDialog } from "@/components/LogRaceDialog";

interface RaceCardProps {
  season: number;
  round: number;
  gpName: string;
  circuit: string;
  date: string;
  rating?: number;
  posterUrl?: string;
  watched?: boolean;
  id?: string;
  country?: string;
  showWatchlistButton?: boolean;
  winner?: string;
  onWatchlistChange?: () => void;
  sessionType?: string;
}

const RaceCardComponent = ({
  season,
  round,
  gpName,
  circuit,
  date,
  rating,
  posterUrl,
  watched = false,
  id,
  country,
  showWatchlistButton = true,
  winner,
  onWatchlistChange,
  sessionType,
}: RaceCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [fetchedWinner, setFetchedWinner] = useState<string | null>(null);

  useEffect(() => {
    // Only check watchlist if button is shown and not already watched
    if (showWatchlistButton && !watched) {
      checkWatchlistStatus();
    }
  }, [season, gpName, showWatchlistButton, watched]);

  useEffect(() => {
    // Only fetch winner if not provided, race is in past, and card is not already watched
    if (!winner && !watched && season && round && date) {
      const raceDate = new Date(date);
      if (raceDate < new Date()) {
        // Get winner from hardcoded data (instant, no API call needed)
        const raceWinner = getRaceWinner(season, round);
        if (raceWinner) {
          setFetchedWinner(raceWinner);
        }
      }
    }
  }, [season, round, date, winner, watched]);

  const checkWatchlistStatus = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const items = await getUserWatchlist(user.uid);
      console.log('[RaceCard] Checking watchlist status for:', { season, gpName, totalItems: items.length });

      const watchlistItem = items.find(
        item => item.raceYear === season && item.raceName === gpName
      );

      if (watchlistItem) {
        console.log('[RaceCard] Found in watchlist:', watchlistItem);
        setIsInWatchlist(true);
        setWatchlistId(watchlistItem.id || null);
      } else {
        console.log('[RaceCard] Not in watchlist');
      }
    } catch (error) {
      console.error('[RaceCard] Error checking watchlist:', error);
    }
  };

  const handleClick = () => {
    if (id) {
      navigate(`/race/${id}`);
    } else if (season && round) {
      navigate(`/race/${season}/${round}`);
    } else {
      console.error('[RaceCard] Cannot navigate - missing id and season/round', { id, season, round });
      toast({
        title: "Error",
        description: "Cannot view race details - missing information",
        variant: "destructive"
      });
    }
  };

  const handleMouseEnter = () => {
    // Prefetch RaceDetail component on hover
    import('@/pages/RaceDetail');
  };

  const handleWatchlistToggle = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add races to your watchlist",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isInWatchlist && watchlistId) {
        console.log('[RaceCard] Removing from watchlist:', watchlistId);
        await removeFromWatchlist(watchlistId);
        setIsInWatchlist(false);
        setWatchlistId(null);
        toast({ title: "Removed from watchlist" });
        // Notify parent component about the change
        if (onWatchlistChange) {
          onWatchlistChange();
        }
      } else {
        console.log('[RaceCard] Adding to watchlist:', { season, gpName, circuit, date });
        const newId = await addToWatchlist({
          userId: user.uid,
          raceYear: season,
          raceName: gpName,
          raceLocation: circuit,
          raceDate: new Date(date),
          countryCode: country,
          notes: '',
          reminderEnabled: false,
        });
        console.log('[RaceCard] Successfully added with ID:', newId);
        setIsInWatchlist(true);
        setWatchlistId(newId);
        toast({ title: "Added to watchlist" });
        // Notify parent component about the change
        if (onWatchlistChange) {
          onWatchlistChange();
        }
      }
    } catch (error: any) {
      console.error('[RaceCard] Error toggling watchlist:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const flagUrl = country ? getCountryFlag(country) : null;
  const displayWinner = winner || fetchedWinner;

  return (
    <Card
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className="group relative overflow-hidden bg-gradient-to-br from-black via-black to-red-950/20 border border-gray-800/60 hover:border-racing-red/50 hover:scale-[1.02] transition-all duration-300 cursor-pointer touch-manipulation"
    >
      {/* Poster */}
      <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-red-950/30">
        {/* Letterboxd-style hover overlay - only on desktop */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${season} ${gpName}`}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 sm:p-3 space-y-1.5 sm:space-y-2 bg-gradient-to-b from-transparent via-black/30 to-black/70">
            {flagUrl && (
              <div className="w-20 h-12 sm:w-24 sm:h-14 md:w-28 md:h-16 rounded overflow-hidden border-2 border-racing-red/40 shadow-xl shadow-black/50 flex items-center justify-center">
                <img
                  src={flagUrl}
                  alt={country || circuit}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="text-center space-y-0.5">
              <div className="text-base sm:text-lg md:text-xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{season}</div>
              <div className="text-[10px] sm:text-xs font-black line-clamp-2 px-1 text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{gpName}</div>
              {sessionType && (
                <div className="flex justify-center">
                  <Badge variant="outline" className={`text-[8px] sm:text-[9px] px-1 py-0 h-4 font-bold uppercase tracking-wider ${
                    sessionType === 'race' ? 'border-racing-red/60 text-racing-red bg-racing-red/10' :
                    sessionType === 'sprint' ? 'border-orange-500/60 text-orange-500 bg-orange-500/10' :
                    sessionType === 'qualifying' ? 'border-blue-500/60 text-blue-500 bg-blue-500/10' :
                    sessionType === 'sprintQualifying' ? 'border-purple-500/60 text-purple-500 bg-purple-500/10' :
                    'border-gray-500/60 text-gray-500 bg-gray-500/10'
                  }`}>
                    {sessionType === 'race' ? '🏁 Race' :
                     sessionType === 'sprint' ? '⚡ Sprint' :
                     sessionType === 'qualifying' ? '🏎️ Qualifying' :
                     sessionType === 'sprintQualifying' ? '⚡ Sprint Qual' :
                     sessionType}
                  </Badge>
                </div>
              )}
              {displayWinner && (
                <div className="text-xs sm:text-sm font-black text-racing-red line-clamp-1 px-1 flex items-center justify-center gap-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                  <span>🏆 {displayWinner}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rating overlay */}
        {rating && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1 z-20">
            <Star className="w-3 h-3 fill-racing-red text-racing-red" />
            <span className="text-xs font-bold text-white">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Watched indicator */}
        {watched && (
          <div className="absolute top-2 right-2 bg-racing-red/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold z-20">
            ✓ Logged
          </div>
        )}

        {/* Action buttons - Show on hover (Letterboxd style) */}
        {showWatchlistButton && !watched && (
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            <LogRaceDialog
              defaultCircuit={circuit}
              defaultRaceName={gpName}
              defaultYear={season}
              defaultCountryCode={country}
              trigger={
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 bg-black/90 hover:bg-racing-red hover:text-white backdrop-blur-sm border border-gray-700 text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              }
            />
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 bg-black/90 hover:bg-racing-red hover:text-white backdrop-blur-sm border border-gray-700 text-white"
              onClick={handleWatchlistToggle}
            >
              <Eye className={`w-4 h-4 ${isInWatchlist ? 'fill-white' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 bg-gradient-to-br from-black via-black to-red-950/10 border-t border-gray-800/60">
        <h3 className="font-bold text-sm line-clamp-1 text-white mb-1">{gpName}</h3>
        <p className="text-xs text-gray-500">{season}</p>
      </div>
    </Card>
  );
};

export const RaceCard = memo(RaceCardComponent);
