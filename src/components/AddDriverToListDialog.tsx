import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDriverToList, DriverListItem, getListById } from "@/services/lists";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { allF1Drivers } from "@/data/allF1Drivers";

interface AddDriverToListDialogProps {
  trigger?: React.ReactNode;
  listId: string;
  onSuccess?: () => void;
}

const ALL_DRIVERS = allF1Drivers;

export const AddDriverToListDialog = ({ trigger, listId, onSuccess }: AddDriverToListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDrivers, setFilteredDrivers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [existingDrivers, setExistingDrivers] = useState<DriverListItem[]>([]);

  const { toast } = useToast();

  // Load existing list drivers when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingDrivers();
      setFilteredDrivers(ALL_DRIVERS);
    }
  }, [open]);

  const loadExistingDrivers = async () => {
    try {
      const list = await getListById(listId);
      if (list) {
        setExistingDrivers(list.drivers || []);
      }
    } catch (error) {
      console.error('[AddDriverToListDialog] Error loading existing drivers:', error);
    }
  };

  // Filter drivers when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = ALL_DRIVERS.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrivers(filtered);
    } else {
      setFilteredDrivers(ALL_DRIVERS);
    }
  }, [searchQuery]);

  const handleAddDriver = async (driver: { id: string; name: string }) => {
    // Check if driver already exists in the list
    const isDuplicate = existingDrivers.some(
      existingDriver => existingDriver.driverId === driver.id
    );

    if (isDuplicate) {
      toast({
        title: "Already in list",
        description: `${driver.name} is already in this list`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const driverItem: DriverListItem = {
        driverId: driver.id,
        driverName: driver.name,
        team: '',
        year: 0,
        order: 0,
        note: ''
      };

      await addDriverToList(listId, driverItem);

      // Update existing drivers to prevent immediate re-adding
      setExistingDrivers([...existingDrivers, driverItem]);

      toast({
        title: "Driver added!",
        description: `${driver.name} added to list`
      });

      setSearchQuery("");
      onSuccess?.();
    } catch (error: any) {
      console.error('[AddDriverToListDialog] Error adding driver:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add driver to list",
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
            Add Driver
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col w-[95vw] sm:w-full bg-black/95 border-2 border-racing-red backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-wider text-racing-red">Add Driver to List</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label className="text-white font-bold uppercase tracking-wider text-sm">Search Drivers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search drivers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
              />
            </div>
          </div>

          {/* Drivers Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white font-bold uppercase tracking-wider text-sm">
                All Drivers {filteredDrivers.length > 0 && `(${filteredDrivers.length})`}
              </Label>
            </div>

            {filteredDrivers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {filteredDrivers.map((driver) => {
                  const isAlreadyAdded = existingDrivers.some(
                    existingDriver => existingDriver.driverId === driver.id
                  );

                  return (
                    <Card
                      key={driver.id}
                      className={`p-3 border-2 transition-all ${
                        isAlreadyAdded
                          ? 'border-gray-700 bg-black/40 opacity-50 cursor-not-allowed'
                          : 'border-red-900/50 bg-black/60 hover:border-racing-red hover:shadow-lg hover:shadow-red-500/20 cursor-pointer'
                      } group`}
                      onClick={() => !loading && !isAlreadyAdded && handleAddDriver(driver)}
                    >
                      <div className="space-y-1">
                        <h4 className={`font-bold text-sm transition-colors ${
                          isAlreadyAdded
                            ? 'text-gray-500'
                            : 'text-white group-hover:text-racing-red'
                        }`}>
                          {driver.name}
                        </h4>
                        {isAlreadyAdded && (
                          <p className="text-xs text-gray-600 font-semibold uppercase mt-1">Already Added</p>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <p className="text-gray-400 font-medium">No drivers found</p>
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

