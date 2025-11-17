import { Header } from "@/components/Header";
import { LogRaceDialog } from "@/components/LogRaceDialog";
import { RaceCard } from "@/components/RaceCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, List, Plus, Trash2, Edit, Star, Grid3x3 } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { getUserRaceLogs, calculateTotalHoursWatched, deleteRaceLog, RaceLog } from "@/services/raceLogs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getCountryFlag } from "@/services/f1Api";
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

const Diary = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "grid">("list");
  const [logs, setLogs] = useState<any[]>([]);
  const [rawLogs, setRawLogs] = useState<RaceLog[]>([]); // Store raw logs for calculations
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const loadLogs = async () => {
    if (!user) {
      console.log('[Diary] No authenticated user found');
      setLoading(false);
      return;
    }

    try {
      console.log('[Diary] Loading race logs for user:', user.uid);
      const userLogs = await getUserRaceLogs(user.uid);
      console.log('[Diary] Retrieved', userLogs.length, 'race logs');

      // Store raw logs for calculations (including sessionType)
      setRawLogs(userLogs);

      const mappedLogs = userLogs.map(log => {
        // dateWatched is now a Date object after conversion in getUserRaceLogs
        const dateString = log.dateWatched instanceof Date
          ? log.dateWatched.toISOString()
          : new Date(log.dateWatched).toISOString();

        return {
          id: log.id,
          season: log.raceYear,
          round: log.round || 1,
          gpName: log.raceName,
          circuit: log.raceLocation,
          date: dateString,
          rating: log.rating,
          watched: true,
          country: log.countryCode,
        };
      });

      console.log('[Diary] Mapped logs:', mappedLogs);
      setLogs(mappedLogs);
    } catch (error) {
      console.error('[Diary] Error loading logs:', error);
      toast({
        title: 'Error loading diary',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleDeleteClick = (logId: string) => {
    setLogToDelete(logId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!logToDelete) return;

    try {
      console.log('[Diary] Deleting race log:', logToDelete);
      await deleteRaceLog(logToDelete);
      toast({ title: 'Race log deleted' });
      await loadLogs(); // Reload logs after deletion
    } catch (error: any) {
      console.error('[Diary] Error deleting race log:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setLogToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pb-6 border-b-2 border-red-900/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-12 bg-racing-red rounded-full shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
              <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red rounded-full">
                <span className="text-racing-red font-black text-xs tracking-widest drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]">RACE DIARY</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">MY LOGGED RACES</h1>
            <p className="text-sm sm:text-base text-gray-300 mt-2 flex items-center gap-3 flex-wrap font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-racing-red rounded-full shadow-[0_0_4px_rgba(220,38,38,0.8)]" />
                {logs.length} RACES LOGGED
              </span>
              <span className="text-red-900">•</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-racing-red" />
                {calculateTotalHoursWatched(rawLogs).toFixed(1)} HOURS
              </span>
            </p>
          </div>

          <div className="flex gap-2 self-start sm:self-auto">
            <div className="flex gap-1 bg-black/60 border-2 border-red-900/50 rounded-lg p-1">
              <Button
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                onClick={() => setView("list")}
                className={view === "list" ? "bg-racing-red hover:bg-red-600 font-black" : "text-gray-400 hover:text-white"}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={view === "grid" ? "default" : "ghost"}
                onClick={() => setView("grid")}
                className={view === "grid" ? "bg-racing-red hover:bg-red-600 font-black" : "text-gray-400 hover:text-white"}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </div>

            <LogRaceDialog
              onSuccess={loadLogs}
              trigger={
                <Button className="gap-2 bg-racing-red hover:bg-red-600 border-2 border-red-400 shadow-lg shadow-red-500/30 font-black uppercase tracking-wider">
                  <Plus className="w-4 h-4" />
                  <span className="hidden xs:inline">Log Race</span>
                  <span className="xs:hidden">Log</span>
                </Button>
              }
            />
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-black uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">No races logged yet</p>
            <p className="text-sm mt-2 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">Start logging races to build your diary!</p>
          </div>
        ) : view === "list" ? (
          <div className="relative">
            {/* Starting Line with Traffic Lights */}
            <div className="mb-6 sm:mb-8 relative">
              <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-5 py-4 sm:py-6 border-y-4 border-red-900/50 bg-gradient-to-r from-black/40 via-red-900/10 to-black/40">
                {/* F1 Traffic Light Panel - Single at top */}
                <div className="flex gap-1.5 sm:gap-2 md:gap-3 p-3 sm:p-4 md:p-5 bg-gradient-to-b from-zinc-900 to-black rounded-lg sm:rounded-xl border-2 sm:border-3 md:border-4 border-racing-red/40 shadow-xl shadow-red-500/20">
                  {/* Row 1 - 2 lights */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                  </div>
                  {/* Row 2 - 2 lights */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                  </div>
                  {/* Row 3 - 2 lights */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                  </div>
                  {/* Row 4 - 2 lights */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                  </div>
                  {/* Row 5 - 2 lights */}
                  <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-2.5">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-racing-red border-2 border-red-700 shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
                  </div>
                </div>

                {/* Text below lights */}
                <div className="text-center px-2">
                  <div className="text-xl sm:text-2xl md:text-3xl font-black mb-1 uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">LIGHTS OUT</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-300 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{logs.length} RACES LOGGED</div>
                </div>
              </div>

              {/* Starting line on track */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-racing-red/50 shadow-[0_0_8px_rgba(220,38,38,0.6)]"></div>
            </div>

            {/* Racing Grid Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ top: '120px' }}>
              {/* Track edges */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-foreground/20"></div>
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-foreground/20"></div>

              {/* Starting grid pattern - repeating horizontal lines */}
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 160px,
                    rgba(255, 255, 255, 0.03) 160px,
                    rgba(255, 255, 255, 0.03) 165px,
                    transparent 165px,
                    transparent 170px,
                    rgba(255, 255, 255, 0.03) 170px,
                    rgba(255, 255, 255, 0.03) 175px
                  )
                `
              }}>
              </div>

              {/* Checkered flag pattern on sides */}
              <div className="absolute left-[5%] top-0 bottom-0 w-12 opacity-5">
                <div className="h-full" style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      45deg,
                      #000 0,
                      #000 10px,
                      #fff 10px,
                      #fff 20px
                    ),
                    repeating-linear-gradient(
                      -45deg,
                      #000 0,
                      #000 10px,
                      #fff 10px,
                      #fff 20px
                    )
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 0'
                }}></div>
              </div>
              <div className="absolute right-[5%] top-0 bottom-0 w-12 opacity-5">
                <div className="h-full" style={{
                  backgroundImage: `
                    repeating-linear-gradient(
                      45deg,
                      #000 0,
                      #000 10px,
                      #fff 10px,
                      #fff 20px
                    ),
                    repeating-linear-gradient(
                      -45deg,
                      #000 0,
                      #000 10px,
                      #fff 10px,
                      #fff 20px
                    )
                  `,
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 10px 0'
                }}></div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto relative z-10 px-2 sm:px-0">
              {rawLogs.map((log, index) => {
                const flagUrl = log.countryCode ? getCountryFlag(log.countryCode) : null;
                const dateStr = log.dateWatched instanceof Date
                  ? log.dateWatched.toLocaleDateString()
                  : new Date(log.dateWatched).toLocaleDateString();

                console.log('[Diary] Log data:', { id: log.id, driverOfTheDay: log.driverOfTheDay, hasDriver: !!log.driverOfTheDay });

                return (
                  <Card
                    key={log.id}
                    className="p-3 sm:p-4 md:p-5 hover:border-racing-red transition-all cursor-pointer group relative overflow-hidden bg-black/90 border-2 border-red-900/40 hover:shadow-xl hover:shadow-red-500/30 backdrop-blur-sm"
                    onClick={() => navigate(`/race/${log.id}`)}
                  >
                    {/* Racing stripe */}
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

                      <div className="flex gap-2 sm:gap-3 md:gap-4 items-center flex-wrap sm:flex-nowrap">
                        {/* Flag & Title */}
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          {flagUrl && (
                            <div className="w-14 h-9 sm:w-16 sm:h-10 md:w-20 md:h-12 rounded overflow-hidden border-2 border-racing-red/40 shadow-xl shadow-black/50 flex-shrink-0">
                              <img
                                src={flagUrl}
                                alt={log.countryCode || log.raceLocation}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-sm sm:text-base md:text-lg mb-0.5 truncate uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{log.raceName}</h3>
                            <p className="text-[10px] sm:text-xs md:text-sm text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                              {log.raceYear} • {log.raceLocation}
                            </p>
                            {log.raceWinner && (
                              <p className="text-[10px] sm:text-xs font-black text-racing-red mt-0.5 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                🏆 {log.raceWinner}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        {log.rating && (
                          <div className="flex items-center gap-1 bg-black/90 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full border border-racing-red/50 flex-shrink-0">
                            <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-racing-red text-racing-red drop-shadow-[0_0_4px_rgba(220,38,38,0.8)]" />
                            <span className="font-black text-xs sm:text-sm text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">{log.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>

                      {/* Driver of the Day & Review compact */}
                      <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                        {log.driverOfTheDay && (
                          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                            <span className="text-[10px] sm:text-xs text-gray-200 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">DRIVER OF THE DAY:</span>
                            <span className="font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">🏆 {log.driverOfTheDay}</span>
                          </div>
                        )}

                        {log.review && (
                          <p className="text-[10px] sm:text-xs md:text-sm text-gray-200 line-clamp-2 italic font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                            "{log.review}"
                          </p>
                        )}

                        {/* Footer compact */}
                        <div className="flex items-center justify-between pt-1.5 sm:pt-2">
                          <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                            <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-racing-red" />
                            <span>{dateStr}</span>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 sm:h-7 sm:w-7 opacity-0 group-hover:opacity-100 text-racing-red hover:text-red-600 hover:bg-red-900/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(log.id!);
                            }}
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </Button>
                        </div>
                      </div>
                  </Card>
                );
              })}
            </div>

            {/* Finish Line */}
            {rawLogs.length > 0 && (
              <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t-2 border-dashed border-red-900/50 px-2">
                <div className="text-3xl sm:text-4xl">🏁</div>
                <div className="text-center sm:text-left">
                  <div className="font-black text-base sm:text-lg uppercase tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">RACE COMPLETE!</div>
                  <div className="text-xs sm:text-sm text-gray-300 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {rawLogs.length} RACES • {calculateTotalHoursWatched(rawLogs).toFixed(1)} HOURS ON TRACK
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl">🏁</div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {logs.map((race) => (
              <div key={race.id} className="relative group">
                <RaceCard {...race} />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(race.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Race Log?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this race log. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Diary;
