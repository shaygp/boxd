import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RaceCard } from "@/components/RaceCard";
import { AddRaceToListDialog } from "@/components/AddRaceToListDialog";
import { Heart, MessageSquare, Share2, Edit, Trash2, Lock, Globe, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getListById, deleteList } from "@/services/lists";
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

  useEffect(() => {
    loadList();
  }, [listId]);

  const isOwner = auth.currentUser?.uid === list?.userId;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8">
          <div className="text-center py-12 text-muted-foreground">List not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* List Header */}
        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{list.title}</h1>
                {list.isPublic ? (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="w-3 h-3" />
                    Private
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{list.description}</p>

              {/* Tags */}
              {list.tags && list.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {list.tags.map((tag: string, idx: number) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Author */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Created by</span>
                <span
                  className="font-semibold hover:text-racing-red cursor-pointer"
                  onClick={() => navigate(`/user/${list.userId}`)}
                >
                  {list.username}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {list.races?.length || 0} races
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwner && listId && (
                <AddRaceToListDialog
                  listId={listId}
                  onSuccess={loadList}
                  trigger={
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Race
                    </Button>
                  }
                />
              )}

              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>

              {isOwner && (
                <>
                  <Button variant="outline" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this list?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your list.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive hover:bg-destructive/90"
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

          {/* Stats */}
          <div className="flex items-center gap-6 pt-6 border-t">
            <button className="flex items-center gap-2 hover:text-racing-red transition-colors">
              <Heart className="w-5 h-5" />
              <span className="font-semibold">{list.likesCount || 0}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-racing-red transition-colors">
              <MessageSquare className="w-5 h-5" />
              <span className="font-semibold">{list.commentsCount || 0}</span>
            </button>
          </div>
        </Card>

        {/* Races Grid */}
        {list.races && list.races.length > 0 ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Races in this list</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {list.races
                .sort((a: any, b: any) => a.order - b.order)
                .map((race: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-racing-red text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {race.order + 1}
                    </div>
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
                      <Card className="mt-2 p-2">
                        <p className="text-xs text-muted-foreground">{race.note}</p>
                      </Card>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <Card className="p-12 text-center border-dashed border-2">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No races yet</h3>
              <p className="text-muted-foreground mb-6">
                {isOwner
                  ? "Start adding races to build your collection"
                  : "This list doesn't have any races yet"}
              </p>
              {isOwner && listId && (
                <AddRaceToListDialog
                  listId={listId}
                  onSuccess={loadList}
                  trigger={
                    <Button size="lg" className="gap-2">
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
