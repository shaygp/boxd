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

    // Prefetch race data if we have season and round
    if (season && round) {
      import('@/services/raceCache').then(({ prefetchRaceData }) => {
        prefetchRaceData(season, round);
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
      onMouseEnter={handleMouseEnter}
      className="group relative overflow-hidden bg-black border border-gray-800/50 hover:border-gray-600 transition-all duration-200 cursor-pointer"
    >
      {/* Poster */}
      <div className="aspect-[2/3] relative overflow-hidden bg-black">
        {/* Letterboxd-style subtle gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" />

        {posterUrl ? (
          <img
            src={posterUrl}
            alt={`${season} ${gpName}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 space-y-2 bg-gradient-to-br from-gray-900 to-black">
            {flagUrl && (
              <div className="w-24 h-16 rounded overflow-hidden border border-gray-700 shadow-lg flex items-center justify-center">
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
            <div className="text-center space-y-1">
              <div className="text-lg font-bold text-white">{season}</div>
              <div className="text-xs font-semibold line-clamp-2 px-2 text-gray-300">{gpName}</div>
              {sessionType && (
                <div className="flex justify-center mt-1">
                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0.5 font-semibold ${
                    sessionType === 'race' ? 'border-racing-red/40 text-racing-red/90 bg-racing-red/5' :
                    sessionType === 'sprint' ? 'border-orange-500/40 text-orange-400 bg-orange-500/5' :
                    sessionType === 'qualifying' ? 'border-blue-500/40 text-blue-400 bg-blue-500/5' :
                    sessionType === 'sprintQualifying' ? 'border-purple-500/40 text-purple-400 bg-purple-500/5' :
                    'border-gray-500/40 text-gray-400 bg-gray-500/5'
                  }`}>
                    {sessionType === 'race' ? 'Race' :
                     sessionType === 'sprint' ? 'Sprint' :
                     sessionType === 'qualifying' ? 'Qualifying' :
                     sessionType === 'sprintQualifying' ? 'Sprint Qual' :
                     sessionType}
                  </Badge>
                </div>
              )}
              {displayWinner && (
                <div className="text-xs font-medium text-gray-400 line-clamp-1 px-2 mt-1">
                  <span>Winner: {displayWinner}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rating overlay - Subtle */}
        {rating && (
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 z-20">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-white">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Watched indicator - Minimal */}
        {watched && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-racing-red/90 backdrop-blur-sm rounded-full flex items-center justify-center z-20">
            <Eye className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Action buttons - Letterboxd style on hover */}
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
                  className="h-8 w-8 bg-black/80 hover:bg-white hover:text-black backdrop-blur-sm border-none text-white rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              }
            />
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 bg-black/80 hover:bg-white hover:text-black backdrop-blur-sm border-none text-white rounded-full"
              onClick={handleWatchlistToggle}
            >
              <Eye className={`w-3.5 h-3.5 ${isInWatchlist ? 'fill-white' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* Info - Minimal Letterboxd style */}
      <div className="p-2.5 bg-black border-t border-gray-800/50">
        <h3 className="font-medium text-xs line-clamp-1 text-gray-200 mb-0.5">{gpName}</h3>
        <p className="text-xs text-gray-600">{season}</p>
      </div>
    </Card>
  );
};

export const RaceCard = memo(RaceCardComponent);
