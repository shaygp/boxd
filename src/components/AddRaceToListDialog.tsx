import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addRaceToList, RaceListItem, getListById } from "@/services/lists";
import { getRacesBySeason, F1Race } from "@/services/f1Calendar";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCountryFlag } from "@/services/f1Api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddRaceToListDialogProps {
  trigger?: React.ReactNode;
  listId: string;
  onSuccess?: () => void;
}

const YEARS = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010];

export const AddRaceToListDialog = ({ trigger, listId, onSuccess }: AddRaceToListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [races, setRaces] = useState<F1Race[]>([]);
  const [filteredRaces, setFilteredRaces] = useState<F1Race[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [existingRaces, setExistingRaces] = useState<RaceListItem[]>([]);

  const { toast } = useToast();

  // Load existing list races and season races when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingRaces();
      loadRaces();
    }
  }, [open, selectedYear]);

  const loadExistingRaces = async () => {
    try {
      const list = await getListById(listId);
      if (list) {
        setExistingRaces(list.races || []);
      }
    } catch (error) {
      console.error('[AddRaceToListDialog] Error loading existing races:', error);
    }
  };

  // Filter races when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = races.filter(race =>
        race.raceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        race.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        race.circuitName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRaces(filtered);
    } else {
      setFilteredRaces(races);
    }
  }, [searchQuery, races]);

  const loadRaces = async () => {
    setLoadingRaces(true);
    try {
      const seasonRaces = await getRacesBySeason(selectedYear);
      setRaces(seasonRaces);
      setFilteredRaces(seasonRaces);
    } catch (error) {
      console.error('[AddRaceToListDialog] Error loading races:', error);
      toast({
        title: "Error",
        description: "Failed to load races",
        variant: "destructive"
      });
    } finally {
      setLoadingRaces(false);
    }
  };

  const handleAddRace = async (race: F1Race) => {
    // Check if race already exists in the list
    const isDuplicate = existingRaces.some(
      existingRace =>
        existingRace.raceYear === race.year &&
        existingRace.raceName === race.raceName
    );

    if (isDuplicate) {
      toast({
        title: "Already in list",
        description: `${race.raceName} is already in this list`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const raceItem: RaceListItem = {
        raceYear: race.year,
        raceName: race.raceName,
        raceLocation: race.location,
        countryCode: race.countryCode,
        order: 0,
        note: ''
      };

      await addRaceToList(listId, raceItem);

      // Update existing races to prevent immediate re-adding
      setExistingRaces([...existingRaces, raceItem]);

      toast({
        title: "Race added!",
        description: `${race.raceName} added to list`
      });

      setOpen(false);
      setSearchQuery("");
      onSuccess?.();
    } catch (error: any) {
      console.error('[AddRaceToListDialog] Error adding race:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add race to list",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-500/30">
            <Plus className="w-4 h-4" />
            Add Race
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col w-[95vw] sm:w-full bg-black/95 border-2 border-racing-red backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-wider text-racing-red">Add Race to List</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Year Selector and Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white font-bold uppercase tracking-wider text-sm">Season</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="bg-black/60 border-2 border-red-900/50 text-white focus:border-racing-red">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-2 border-racing-red">
                  {YEARS.map(year => (
                    <SelectItem key={year} value={year.toString()} className="text-white hover:bg-racing-red/20">
                      {year} Season
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white font-bold uppercase tracking-wider text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search races..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
                />
              </div>
            </div>
          </div>

          {/* Races Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white font-bold uppercase tracking-wider text-sm">
                {selectedYear} Races {filteredRaces.length > 0 && `(${filteredRaces.length})`}
              </Label>
              {loadingRaces && (
                <span className="text-xs text-gray-400 font-medium animate-pulse">Loading...</span>
              )}
            </div>

            {loadingRaces ? (
              <div className="text-center py-12 text-gray-400 font-medium">
                Loading races...
              </div>
            ) : filteredRaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredRaces.map((race) => {
                  const isAlreadyAdded = existingRaces.some(
                    existingRace =>
                      existingRace.raceYear === race.year &&
                      existingRace.raceName === race.raceName
                  );

                  return (
                    <Card
                      key={race.id}
                      className={`p-3 border-2 transition-all ${
                        isAlreadyAdded
                          ? 'border-gray-700 bg-black/40 opacity-50 cursor-not-allowed'
                          : 'border-red-900/50 bg-black/60 hover:border-racing-red hover:shadow-lg hover:shadow-red-500/20 cursor-pointer'
                      } group`}
                      onClick={() => !loading && !isAlreadyAdded && handleAddRace(race)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-racing-red/40 shadow-sm flex-shrink-0">
                          <img
                            src={getCountryFlag(race.countryCode)}
                            alt={race.location}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-sm transition-colors truncate ${
                            isAlreadyAdded
                              ? 'text-gray-500'
                              : 'text-white group-hover:text-racing-red'
                          }`}>
                            {race.raceName}
                          </h4>
                          <p className="text-xs text-gray-400 font-medium">
                            Round {race.round} • {race.location}
                          </p>
                          <p className="text-xs text-gray-500 font-medium">
                            {new Date(race.dateStart).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {isAlreadyAdded && (
                            <p className="text-xs text-gray-600 font-semibold uppercase mt-1">Already Added</p>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <p className="text-gray-400 font-medium">No races found</p>
                {searchQuery && (
                  <p className="text-sm text-gray-500 font-medium">Try a different search term</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t-2 border-gray-800">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1 bg-black/60 border-2 border-gray-700 text-white hover:bg-black/80 hover:text-white font-bold uppercase tracking-wider"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
