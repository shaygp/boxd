import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getRacesBySeason } from "@/services/f1Calendar";
import { createChallenge } from "@/services/challenges";
import { driversByYear } from "@/data/drivers2010-2025";
import { useToast } from "@/hooks/use-toast";
import { getCountryCodeFromGPName, getCountryFlag } from "@/services/f1Api";

interface CreateChallengeDialogProps {
  challengedUserId: string;
  challengedUserName: string;
  challengedUserAvatar?: string;
  trigger?: React.ReactNode;
}

export const CreateChallengeDialog = ({
  challengedUserId,
  challengedUserName,
  challengedUserAvatar,
  trigger,
}: CreateChallengeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [prediction, setPrediction] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const { toast } = useToast();

  // Load races for selected year
  useEffect(() => {
    const loadRaces = async () => {
      try {
        const raceData = await getRacesBySeason(year);
        // Filter to only show future races
        const now = new Date();
        const futureRaces = raceData.filter(race => {
          const raceDate = new Date(race.dateStart);
          return raceDate > now;
        });
        setRaces(futureRaces);
      } catch (error) {
        console.error('Error loading races:', error);
        setRaces([]);
      }
    };

    loadRaces();
  }, [year]);

  // Get drivers for selected race year
  const getDriversForYear = (year: number) => {
    const yearData = driversByYear[year];
    if (!yearData) return [];
    return yearData;
  };

  const drivers = selectedRace ? getDriversForYear(year) : [];

  const handleSubmit = async () => {
    if (!selectedRace || !prediction) {
      toast({
        title: "Missing information",
        description: "Please select a race and make a prediction",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await createChallenge(
        challengedUserId,
        challengedUserName,
        challengedUserAvatar,
        selectedRace.year,
        selectedRace.round,
        selectedRace.raceName,
        selectedRace.circuitName,
        new Date(selectedRace.dateStart),
        prediction
      );

      toast({
        title: "Challenge sent!",
        description: `${challengedUserName} has been challenged to predict ${selectedRace.raceName}`,
      });

      setOpen(false);
      setSelectedRace(null);
      setPrediction("");
      setSelectedDriver("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            size="sm"
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-black uppercase tracking-wider border-2 border-yellow-400"
          >
            Challenge
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="bg-black border-2 border-racing-red max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white font-black text-xl uppercase tracking-wider">
            Challenge {challengedUserName}
          </DialogTitle>
        </DialogHeader>

        <div className="py-12 text-center">
          <div className="text-6xl mb-4">🏁</div>
          <h3 className="text-2xl font-black text-white mb-2">2026</h3>
          <p className="text-gray-400 font-bold">Challenges coming for live season</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
