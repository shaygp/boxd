import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addRaceToList, RaceListItem } from "@/services/lists";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getCountryFlag } from "@/services/f1Api";

interface AddRaceToListDialogProps {
  trigger?: React.ReactNode;
  listId: string;
  onSuccess?: () => void;
}

// Popular F1 races to show as suggestions
const SUGGESTED_RACES = [
  { year: 2024, name: "Bahrain Grand Prix", location: "Sakhir", countryCode: "BH" },
  { year: 2024, name: "Saudi Arabian Grand Prix", location: "Jeddah", countryCode: "SA" },
  { year: 2024, name: "Australian Grand Prix", location: "Melbourne", countryCode: "AU" },
  { year: 2024, name: "Japanese Grand Prix", location: "Suzuka", countryCode: "JP" },
  { year: 2024, name: "Monaco Grand Prix", location: "Monaco", countryCode: "MC" },
  { year: 2024, name: "Canadian Grand Prix", location: "Montreal", countryCode: "CA" },
  { year: 2024, name: "Spanish Grand Prix", location: "Barcelona", countryCode: "ES" },
  { year: 2024, name: "British Grand Prix", location: "Silverstone", countryCode: "GB" },
  { year: 2024, name: "Belgian Grand Prix", location: "Spa-Francorchamps", countryCode: "BE" },
  { year: 2024, name: "Dutch Grand Prix", location: "Zandvoort", countryCode: "NL" },
  { year: 2024, name: "Italian Grand Prix", location: "Monza", countryCode: "IT" },
  { year: 2024, name: "Singapore Grand Prix", location: "Marina Bay", countryCode: "SG" },
  { year: 2024, name: "United States Grand Prix", location: "Austin", countryCode: "US" },
  { year: 2024, name: "Mexico City Grand Prix", location: "Mexico City", countryCode: "MX" },
  { year: 2024, name: "Brazilian Grand Prix", location: "Interlagos", countryCode: "BR" },
  { year: 2024, name: "Las Vegas Grand Prix", location: "Las Vegas", countryCode: "US" },
  { year: 2024, name: "Qatar Grand Prix", location: "Lusail", countryCode: "QA" },
  { year: 2024, name: "Abu Dhabi Grand Prix", location: "Yas Marina", countryCode: "AE" },
];

export const AddRaceToListDialog = ({ trigger, listId, onSuccess }: AddRaceToListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customYear, setCustomYear] = useState("2024");
  const [customName, setCustomName] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredRaces, setFilteredRaces] = useState(SUGGESTED_RACES);

  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery) {
      const filtered = SUGGESTED_RACES.filter(race =>
        race.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        race.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRaces(filtered);
    } else {
      setFilteredRaces(SUGGESTED_RACES);
    }
  }, [searchQuery]);

  const handleAddRace = async (year: number, name: string, location: string, countryCode?: string) => {
    setLoading(true);
    try {
      const raceItem: RaceListItem = {
        raceYear: year,
        raceName: name,
        raceLocation: location,
        countryCode: countryCode,
        order: 0,
        note: ''
      };

      await addRaceToList(listId, raceItem);

      toast({
        title: "Race added!",
        description: `${name} added to list`
      });

      setOpen(false);
      setSearchQuery("");
      setCustomName("");
      setCustomLocation("");
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

  const handleAddCustomRace = () => {
    if (!customName || !customLocation) {
      toast({
        title: "Missing information",
        description: "Please enter both race name and location",
        variant: "destructive"
      });
      return;
    }

    handleAddRace(parseInt(customYear), customName, customLocation);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Race
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Add Race to List</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label>Search Races</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by race name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Suggested Races */}
          <div className="space-y-2">
            <Label>Popular Races</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {filteredRaces.map((race, idx) => (
                <Card
                  key={idx}
                  className="p-3 hover:ring-2 hover:ring-racing-red transition-all cursor-pointer group"
                  onClick={() => !loading && handleAddRace(race.year, race.name, race.location, race.countryCode)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-background shadow-sm flex-shrink-0">
                      <img
                        src={getCountryFlag(race.countryCode)}
                        alt={race.location}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm group-hover:text-racing-red transition-colors truncate">
                        {race.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {race.year} • {race.location}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Race */}
          <div className="space-y-4 pt-4 border-t">
            <Label>Or Add Custom Race</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="year" className="text-xs">Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="2024"
                  value={customYear}
                  onChange={(e) => setCustomYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs">Race Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Monaco Grand Prix"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g. Monaco"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleAddCustomRace}
              disabled={loading || !customName || !customLocation}
              className="w-full"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Race
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
