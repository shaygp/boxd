import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RaceCard } from "@/components/RaceCard";
import { AddRaceToListDialog } from "@/components/AddRaceToListDialog";
import { Heart, MessageSquare, Share2, Edit, Trash2, Lock, Globe, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getListById, deleteList, removeRaceFromList, likeList, unlikeList, isListLiked } from "@/services/lists";
import { getRacesBySeason as getFirestoreRacesBySeason } from "@/services/f1Calendar";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ListDetail = () => {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);

  const loadList = async () => {
    if (!listId) {
      setLoading(false);
      return;
    }

    try {
      const listData = await getListById(listId);
      if (listData) {
        // Enrich race data with F1 API info for proper navigation
        if (listData.races && listData.races.length > 0) {
          const yearMap = new Map<number, any[]>();

          // Group races by year
          listData.races.forEach(race => {
            if (!yearMap.has(race.raceYear)) {
              yearMap.set(race.raceYear, []);
            }
            yearMap.get(race.raceYear)!.push(race);
          });

          // Fetch F1 data for each year from Firestore
          const enrichedRaces = await Promise.all(
            listData.races.map(async (race) => {
              try {
                const firestoreRaces = await getFirestoreRacesBySeason(race.raceYear);
                // Convert to expected format
                const yearRaces = firestoreRaces.map(r => ({
                  meeting_key: r.round,
                  year: r.year,
                  round: r.round,
                  meeting_name: r.raceName,
                  circuit_short_name: r.circuitName,
                  date_start: r.dateStart.toISOString(),
                  country_code: r.countryCode,
                  location: r.location,
                  circuit_key: r.round
                }));

                const matchedRace = yearRaces.find(r =>
                  r.meeting_name.toLowerCase().includes(race.raceName.toLowerCase()) ||
                  race.raceName.toLowerCase().includes(r.meeting_name.toLowerCase())
                );

                return {
                  ...race,
                  round: matchedRace?.round || 1,
                  countryCode: race.countryCode || matchedRace?.country_code,
                  date: matchedRace?.date_start || '',
                };
              } catch (error) {
                console.warn(`Failed to fetch F1 data for ${race.raceName}:`, error);
                return {
                  ...race,
                  round: 1,
                  date: '',
                };
              }
            })
          );

          listData.races = enrichedRaces;
        }

        setList(listData);
      } else {
        toast({
          title: "List not found",
          variant: "destructive"
        });
        navigate("/lists");
      }
    } catch (error: any) {
      toast({
        title: "Error loading list",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!listId) return;

    try {
      await deleteList(listId);
      toast({
        title: "List deleted",
        description: "Your list has been deleted successfully"
      });
      navigate("/lists");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "List link copied to clipboard"
    });
  };

  const handleRemoveRace = async (raceIndex: number, raceName: string) => {
    if (!listId) return;

    try {
      await removeRaceFromList(listId, raceIndex);
      toast({
        title: "Race removed",
        description: `${raceName} has been removed from the list`
      });
      await loadList(); // Reload the list to show updated races
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadList();
  }, [listId]);

  useEffect(() => {
    const checkLiked = async () => {
      if (listId && auth.currentUser) {
        const isLiked = await isListLiked(listId);
        setLiked(isLiked);
      }
    };
    checkLiked();
  }, [listId]);

  const handleLikeToggle = async () => {
    if (!listId || !auth.currentUser) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like lists',
        variant: 'destructive',
      });
      return;
    }

    setLiking(true);
    try {
      if (liked) {
        await unlikeList(listId);
        setLiked(false);
        setList((prev: any) => ({ ...prev, likesCount: (prev.likesCount || 1) - 1 }));
        toast({ title: 'Removed from likes' });
      } else {
        await likeList(listId);
        setLiked(true);
        setList((prev: any) => ({ ...prev, likesCount: (prev.likesCount || 0) + 1 }));
        toast({ title: 'Added to likes' });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLiking(false);
    }
  };

  const isOwner = auth.currentUser?.uid === list?.userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
        <Header />
        <main className="container px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">Loading...</div>
        </main>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
        <Header />
        <main className="container px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">List not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto">
        {/* List Header */}
        <Card className="relative overflow-hidden mb-6 sm:mb-8 bg-black/90 border-2 border-red-900/40 backdrop-blur-sm shadow-lg">
          {/* Racing accent line */}
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

          <div className="p-4 sm:p-5 md:p-6">
            {/* Header Section */}
            <div className="flex flex-col gap-4 mb-4">
              {/* Creator Info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-racing-red transition-colors"
                  onClick={() => navigate(`/user/${list.userId}`)}
                >
                  {list.userAvatar ? (
                    <img
                      src={list.userAvatar}
                      alt={list.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-black text-white uppercase">
                      {list.username?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="font-bold text-white hover:text-racing-red cursor-pointer transition-colors text-sm"
                      onClick={() => navigate(`/user/${list.userId}`)}
                    >
                      {list.username}
                    </span>
                    <span className="text-gray-500 text-xs">•</span>
                    <span className="text-gray-400 text-xs">
                      {list.races?.length || 0} {list.races?.length === 1 ? 'race' : 'races'}
                    </span>
                    {list.isPublic ? (
                      <>
                        <span className="text-gray-500 text-xs">•</span>
                        <Badge variant="secondary" className="gap-1 bg-black/60 border border-racing-red/40 text-white text-[10px] px-1.5 py-0">
                          <Globe className="w-2.5 h-2.5" />
                          Public
                        </Badge>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-500 text-xs">•</span>
                        <Badge variant="secondary" className="gap-1 bg-black/60 border border-gray-700 text-white text-[10px] px-1.5 py-0">
                          <Lock className="w-2.5 h-2.5" />
                          Private
                        </Badge>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(list.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Title and Description */}
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                  {list.title}
                </h1>
                {list.description && (
                  <p className="text-sm text-gray-300 leading-relaxed">{list.description}</p>
                )}
              </div>

              {/* Tags */}
              {list.tags && list.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {list.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="bg-black/40 border-racing-red/40 text-gray-300 text-[10px] px-2 py-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Actions and Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLikeToggle}
                  disabled={liking}
                  className={`flex items-center gap-1.5 transition-colors ${
                    liked
                      ? 'text-racing-red'
                      : 'text-gray-400 hover:text-racing-red'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-racing-red' : ''}`} />
                  <span className="text-xs font-medium">{list.likesCount || 0}</span>
                </button>
                <button className="flex items-center gap-1.5 text-gray-400 hover:text-racing-red transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-medium">{list.commentsCount || 0}</span>
                </button>
              </div>

              <div className="flex gap-1.5">
                {isOwner && listId && (
                  <AddRaceToListDialog
                    listId={listId}
                    onSuccess={loadList}
                    trigger={
                      <Button size="sm" className="gap-1.5 bg-racing-red hover:bg-red-600 text-white text-xs h-8">
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add Race</span>
                      </Button>
                    }
                  />
                )}

                <Button variant="outline" size="sm" onClick={handleShare} className="bg-black/60 border border-gray-700 text-white hover:bg-black/80 hover:text-racing-red hover:border-racing-red h-8 w-8 p-0">
                  <Share2 className="w-3.5 h-3.5" />
                </Button>

                {isOwner && (
                  <>
                    <Button variant="outline" size="sm" className="bg-black/60 border border-gray-700 text-white hover:bg-black/80 hover:text-racing-red hover:border-racing-red h-8 w-8 p-0">
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-black/60 border border-gray-700 text-white hover:bg-black/80 hover:text-red-600 hover:border-red-600 h-8 w-8 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-black/95 border-2 border-racing-red backdrop-blur-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-lg font-bold text-white">Delete this list?</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm text-gray-400">
                            This action cannot be undone. This will permanently delete your list.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-black/60 border border-gray-700 text-white hover:bg-black/80 text-sm">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Races Grid */}
        {list.races && list.races.length > 0 ? (
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white mb-4 sm:mb-6">Races in this list</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {list.races
                .sort((a: any, b: any) => a.order - b.order)
                .map((race: any, idx: number) => (
                  <div key={idx} className="relative group/race">
                    <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10 w-6 h-6 sm:w-7 sm:h-7 bg-racing-red text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg">
                      {race.order + 1}
                    </div>
                    {isOwner && (
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveRace(idx, race.raceName);
                        }}
                        className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 w-8 h-8 sm:w-9 sm:h-9 bg-black/90 hover:bg-red-600 text-white border-2 border-gray-700 hover:border-red-400 opacity-0 group-hover/race:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <RaceCard
                      season={race.raceYear}
                      round={race.round}
                      gpName={race.raceName}
                      circuit={race.raceLocation}
                      date={race.date}
                      watched={false}
                      country={race.countryCode}
                    />
                    {race.note && (
                      <Card className="mt-2 p-2 bg-black/60 border-2 border-gray-700">
                        <p className="text-xs text-gray-300 font-medium">{race.note}</p>
                      </Card>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <Card className="p-8 sm:p-12 text-center border-dashed border-2 border-gray-700 bg-black/40">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black/60 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-racing-red/40">
                <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-racing-red" />
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-wider text-white mb-2">No races yet</h3>
              <p className="text-sm sm:text-base text-gray-400 mb-6 font-medium">
                {isOwner
                  ? "Start adding races to build your collection"
                  : "This list doesn't have any races yet"}
              </p>
              {isOwner && listId && (
                <AddRaceToListDialog
                  listId={listId}
                  onSuccess={loadList}
                  trigger={
                    <Button size="lg" className="gap-2 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-500/30">
                      <Plus className="w-5 h-5" />
                      Add Your First Race
                    </Button>
                  }
                />
              )}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ListDetail;
