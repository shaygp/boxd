import { Card } from "@/components/ui/card";
import { Star, Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getCountryFlag, getRaceWinner } from "@/services/f1Api";
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
}: RaceCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistId, setWatchlistId] = useState<string | null>(null);
  const [fetchedWinner, setFetchedWinner] = useState<string | null>(null);

  useEffect(() => {
    checkWatchlistStatus();
  }, [season, gpName]);

  useEffect(() => {
    // Fetch winner if not provided and race is in the past
    const fetchWinner = async () => {
      if (!winner && season && round && date) {
        const raceDate = new Date(date);
        if (raceDate < new Date()) {
          try {
            const raceWinner = await getRaceWinner(season, round);
            if (raceWinner) {
              setFetchedWinner(raceWinner);
            }
          } catch (error) {
            console.error('[RaceCard] Error fetching winner:', error);
          }
        }
      }
    };
    fetchWinner();
  }, [season, round, date, winner]);

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
      className="group relative overflow-hidden bg-black/90 border-2 border-red-900/40 hover:border-racing-red hover:ring-2 hover:ring-racing-red hover:shadow-xl hover:shadow-red-500/30 transition-all duration-200 cursor-pointer touch-manipulation backdrop-blur-sm"
    >
      {/* Poster */}
      <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-racing-red/30 to-black/90">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${season} ${gpName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2 bg-black/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-yellow-500/50 flex items-center gap-0.5 sm:gap-1">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-yellow-500 text-yellow-500 drop-shadow-[0_0_4px_rgba(234,179,8,0.8)]" />
            <span className="text-[10px] sm:text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Watched indicator */}
        {watched && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-racing-red/90 backdrop-blur-sm px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider border border-red-400">
            Logged
          </div>
        )}

        {/* Action buttons */}
        {showWatchlistButton && !watched && (
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex gap-1">
            <LogRaceDialog
              defaultCircuit={circuit}
              defaultRaceName={gpName}
              defaultYear={season}
              defaultCountryCode={country}
              trigger={
                <Button
                  size="icon"
                  variant="secondary"
                  className="min-h-[44px] min-w-[44px] h-11 w-11 bg-black/90 hover:bg-racing-red hover:text-white backdrop-blur-sm touch-manipulation border border-red-900/50 text-white"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              }
            />
            <Button
              size="icon"
              variant="secondary"
              className="min-h-[44px] min-w-[44px] h-11 w-11 bg-black/90 hover:bg-racing-red hover:text-white backdrop-blur-sm touch-manipulation border border-red-900/50 text-white"
              onClick={handleWatchlistToggle}
            >
              <Eye className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWatchlist ? 'fill-white' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-1.5 sm:p-2 text-center sm:text-left bg-gradient-to-b from-black/90 to-black border-t-2 border-red-900/40">
        <h3 className="font-black text-xs sm:text-sm line-clamp-1 text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{gpName}</h3>
        <p className="text-[10px] sm:text-xs text-gray-300 mt-0.5 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{season} • R{round}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 line-clamp-1 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{circuit}</p>
      </div>
    </Card>
  );
};

export const RaceCard = memo(RaceCardComponent);
