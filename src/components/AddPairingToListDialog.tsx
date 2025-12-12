import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPairingToList, PairingListItem, getListById } from "@/services/lists";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { allF1Drivers } from "@/data/allF1Drivers";

interface AddPairingToListDialogProps {
  trigger?: React.ReactNode;
  listId: string;
  onSuccess?: () => void;
}

export const AddPairingToListDialog = ({ trigger, listId, onSuccess }: AddPairingToListDialogProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery1, setSearchQuery1] = useState("");
  const [searchQuery2, setSearchQuery2] = useState("");
  const [selectedDriver1, setSelectedDriver1] = useState<{ id: string; name: string } | null>(null);
  const [selectedDriver2, setSelectedDriver2] = useState<{ id: string; name: string } | null>(null);
  const [filteredDrivers1, setFilteredDrivers1] = useState<Array<{ id: string; name: string }>>([]);
  const [filteredDrivers2, setFilteredDrivers2] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [existingPairings, setExistingPairings] = useState<PairingListItem[]>([]);

  const { toast } = useToast();

  // Load existing pairings when dialog opens
  useEffect(() => {
    if (open) {
      loadExistingPairings();
      setFilteredDrivers1(allF1Drivers);
      setFilteredDrivers2(allF1Drivers);
    }
  }, [open]);

  const loadExistingPairings = async () => {
    try {
      const list = await getListById(listId);
      if (list) {
        setExistingPairings(list.pairings || []);
      }
    } catch (error) {
      console.error('[AddPairingToListDialog] Error loading existing pairings:', error);
    }
  };

  // Filter drivers for first selection
  useEffect(() => {
    if (searchQuery1) {
      const filtered = allF1Drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery1.toLowerCase())
      );
      setFilteredDrivers1(filtered);
    } else {
      setFilteredDrivers1(allF1Drivers);
    }
  }, [searchQuery1]);

  // Filter drivers for second selection
  useEffect(() => {
    if (searchQuery2) {
      const filtered = allF1Drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchQuery2.toLowerCase())
      );
      setFilteredDrivers2(filtered);
    } else {
      setFilteredDrivers2(allF1Drivers);
    }
  }, [searchQuery2]);

  const handleSelectDriver1 = (driver: { id: string; name: string }) => {
    setSelectedDriver1(driver);
    setSearchQuery1("");
  };

  const handleSelectDriver2 = (driver: { id: string; name: string }) => {
    setSelectedDriver2(driver);
    setSearchQuery2("");
  };

  const handleAddPairing = async () => {
    if (!selectedDriver1 || !selectedDriver2) {
      toast({
        title: "Missing drivers",
        description: "Please select both drivers for the pairing",
        variant: "destructive"
      });
      return;
    }

    if (selectedDriver1.id === selectedDriver2.id) {
      toast({
        title: "Invalid pairing",
        description: "Please select two different drivers",
        variant: "destructive"
      });
      return;
    }

    // Check if pairing already exists (in either order)
    const isDuplicate = existingPairings.some(
      existingPairing =>
        (existingPairing.driver1Id === selectedDriver1.id && existingPairing.driver2Id === selectedDriver2.id) ||
        (existingPairing.driver1Id === selectedDriver2.id && existingPairing.driver2Id === selectedDriver1.id)
    );

    if (isDuplicate) {
      toast({
        title: "Already in list",
        description: `${selectedDriver1.name} and ${selectedDriver2.name} pairing already exists in this list`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const pairingItem: PairingListItem = {
        driver1Id: selectedDriver1.id,
        driver1Name: selectedDriver1.name,
        driver2Id: selectedDriver2.id,
        driver2Name: selectedDriver2.name,
        order: 0,
        note: ''
      };

      await addPairingToList(listId, pairingItem);

      // Update existing pairings to prevent immediate re-adding
      setExistingPairings([...existingPairings, pairingItem]);

      toast({
        title: "Pairing added!",
        description: `${selectedDriver1.name} and ${selectedDriver2.name} added to list`
      });

      setSelectedDriver1(null);
      setSelectedDriver2(null);
      setSearchQuery1("");
      setSearchQuery2("");
      onSuccess?.();
    } catch (error: any) {
      console.error('[AddPairingToListDialog] Error adding pairing:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add pairing to list",
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
            Add Pairing
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col w-[95vw] sm:w-full bg-black/95 border-2 border-racing-red backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase tracking-wider text-racing-red">Add Driver Pairing</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Selected Drivers Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white font-bold uppercase tracking-wider text-sm">Driver 1</Label>
              {selectedDriver1 ? (
                <Card className="p-3 border-2 border-racing-red bg-racing-red/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{selectedDriver1.name}</span>
                    <button
                      onClick={() => setSelectedDriver1(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ) : (
                <Card className="p-3 border-2 border-red-900/50 bg-black/60">
                  <span className="text-gray-500 text-sm font-medium">No driver selected</span>
                </Card>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-white font-bold uppercase tracking-wider text-sm">Driver 2</Label>
              {selectedDriver2 ? (
                <Card className="p-3 border-2 border-racing-red bg-racing-red/10">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{selectedDriver2.name}</span>
                    <button
                      onClick={() => setSelectedDriver2(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              ) : (
                <Card className="p-3 border-2 border-red-900/50 bg-black/60">
                  <span className="text-gray-500 text-sm font-medium">No driver selected</span>
                </Card>
              )}
            </div>
          </div>

          {/* Driver Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Driver 1 Search */}
            {!selectedDriver1 && (
              <div className="space-y-2">
                <Label className="text-white font-bold uppercase tracking-wider text-sm">Search for Driver 1</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={searchQuery1}
                    onChange={(e) => setSearchQuery1(e.target.value)}
                    className="pl-10 bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {filteredDrivers1.slice(0, 50).map((driver) => (
                    <Card
                      key={driver.id}
                      className="p-2 border-2 border-red-900/50 bg-black/60 hover:border-racing-red hover:shadow-lg hover:shadow-red-500/20 cursor-pointer group transition-all"
                      onClick={() => handleSelectDriver1(driver)}
                    >
                      <h4 className="font-bold text-white text-sm group-hover:text-racing-red transition-colors">
                        {driver.name}
                      </h4>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Driver 2 Search */}
            {!selectedDriver2 && (
              <div className="space-y-2">
                <Label className="text-white font-bold uppercase tracking-wider text-sm">Search for Driver 2</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={searchQuery2}
                    onChange={(e) => setSearchQuery2(e.target.value)}
                    className="pl-10 bg-black/60 border-2 border-red-900/50 text-white placeholder:text-gray-500 focus:border-racing-red"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2">
                  {filteredDrivers2.slice(0, 50).map((driver) => (
                    <Card
                      key={driver.id}
                      className="p-2 border-2 border-red-900/50 bg-black/60 hover:border-racing-red hover:shadow-lg hover:shadow-red-500/20 cursor-pointer group transition-all"
                      onClick={() => handleSelectDriver2(driver)}
                    >
                      <h4 className="font-bold text-white text-sm group-hover:text-racing-red transition-colors">
                        {driver.name}
                      </h4>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t-2 border-gray-800">
          <Button
            onClick={handleAddPairing}
            disabled={loading || !selectedDriver1 || !selectedDriver2}
            className="flex-1 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider border-2 border-red-400 shadow-lg shadow-red-500/30"
          >
            {loading ? "Adding..." : "Add Pairing"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-black/60 border-2 border-gray-700 text-white hover:bg-black/80 hover:text-white font-bold uppercase tracking-wider"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
