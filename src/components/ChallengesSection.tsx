import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { getUserChallenges, acceptChallenge, declineChallenge, deleteChallenge, Challenge } from "@/services/challenges";
import { driversByYear } from "@/data/drivers2010-2025";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { getCountryCodeFromGPName, getCountryFlag } from "@/services/f1Api";

interface ChallengesSectionProps {
  userId: string;
  isOwnProfile: boolean;
}

export const ChallengesSection = ({ userId, isOwnProfile }: ChallengesSectionProps) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string>("");
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  useEffect(() => {
    loadChallenges();
  }, [userId]);

  const loadChallenges = async () => {
    try {
      const data = await getUserChallenges(userId);
      setChallenges(data);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (challengeId: string, prediction: string) => {
    if (!prediction) {
      toast({
        title: "Missing prediction",
        description: "Please select a driver",
        variant: "destructive",
      });
      return;
    }

    try {
      await acceptChallenge(challengeId, prediction);
      toast({
        title: "Challenge accepted!",
        description: "May the best prediction win 🏁",
      });
      loadChallenges();
      setRespondingTo(null);
      setPrediction("");
      setSelectedDriver("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      await declineChallenge(challengeId);
      toast({
        title: "Challenge declined",
      });
      loadChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (challengeId: string) => {
    try {
      await deleteChallenge(challengeId);
      toast({
        title: "Challenge cancelled",
        description: "The challenge has been deleted",
      });
      loadChallenges();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getDriversForYear = (year: number) => {
    const yearData = driversByYear[year];
    if (!yearData) return [];
    return yearData;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">
        Loading...
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-3">⚔️</div>
        <p className="text-gray-400 font-bold">No challenges yet</p>
        {!isOwnProfile && currentUser && (
          <p className="text-gray-500 text-sm mt-2">Be the first to challenge this user!</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {challenges.map((challenge) => {
        const isPending = challenge.status === 'pending' && challenge.challengedId === currentUser?.uid;
        const isCompleted = challenge.status === 'completed';
        const drivers = getDriversForYear(challenge.raceYear);
        const countryCode = getCountryCodeFromGPName(challenge.raceName);
        const flagUrl = countryCode ? getCountryFlag(countryCode) : null;

        return (
          <Card key={challenge.id} className="bg-black/90 border-2 border-red-900/40 hover:border-racing-red hover:shadow-xl hover:shadow-red-500/30 transition-all backdrop-blur-sm overflow-hidden relative group p-0">
            {/* Racing stripe */}
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-racing-red to-transparent shadow-[0_0_8px_rgba(220,38,38,0.8)]" />

            <div className="p-4">
              {/* Header with Flag and Status */}
              <div className="flex items-center gap-4 mb-4">
                {/* Flag */}
                {flagUrl && (
                  <div className="w-16 h-10 sm:w-20 sm:h-12 rounded overflow-hidden border-2 border-racing-red/40 shadow-xl shadow-black/50 flex-shrink-0">
                    <img
                      src={flagUrl}
                      alt={countryCode || challenge.raceLocation}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Race Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-base sm:text-lg text-white uppercase tracking-wider truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    {challenge.raceName}
                  </h3>
                  <p className="text-xs text-gray-200 font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    {challenge.raceYear} • {challenge.raceLocation}
                  </p>
                </div>

                {/* Status Badge */}
                <Badge
                  variant="outline"
                  className={`
                    ${challenge.status === 'pending' && 'bg-yellow-500/10 border-yellow-500/40 text-yellow-400'}
                    ${challenge.status === 'accepted' && 'bg-blue-500/10 border-blue-500/40 text-blue-400'}
                    ${challenge.status === 'declined' && 'bg-red-500/10 border-red-500/40 text-red-400'}
                    ${challenge.status === 'completed' && 'bg-green-500/10 border-green-500/40 text-green-400'}
                    text-xs font-black uppercase tracking-wider whitespace-nowrap
                  `}
                >
                  {challenge.status}
                </Badge>
              </div>

              {/* Predictions VS Section */}
              <div className="bg-black/60 rounded-lg p-4 border border-gray-800 mb-4">
                <div className="flex items-center gap-4">
                  {/* Challenger */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-gray-700 overflow-hidden flex-shrink-0">
                        {challenge.challengerAvatar ? (
                          <img src={challenge.challengerAvatar} alt={challenge.challengerName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white">{challenge.challengerName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 font-bold truncate">{challenge.challengerName}</span>
                    </div>
                    <div className="bg-black/80 rounded px-3 py-2 border border-racing-red/30">
                      <p className="text-sm font-black text-white truncate">{challenge.challengerPrediction}</p>
                    </div>
                  </div>

                  {/* VS - Centered */}
                  <div className="flex items-center justify-center self-stretch">
                    <div className="text-2xl font-black text-racing-red drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">VS</div>
                  </div>

                  {/* Challenged */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 justify-end">
                      <span className="text-xs text-gray-400 font-bold truncate">{challenge.challengedName}</span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center border border-gray-700 overflow-hidden flex-shrink-0">
                        {challenge.challengedAvatar ? (
                          <img src={challenge.challengedAvatar} alt={challenge.challengedName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-white">{challenge.challengedName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div className={`bg-black/80 rounded px-3 py-2 border ${challenge.challengedPrediction ? 'border-racing-red/30' : 'border-gray-700'}`}>
                      {challenge.challengedPrediction ? (
                        <p className="text-sm font-black text-white truncate text-right">{challenge.challengedPrediction}</p>
                      ) : (
                        <p className="text-sm font-bold text-gray-500 truncate text-right">???</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Accept/Decline Section for Pending */}
              {isPending && !challenge.challengedPrediction && (
                <div className="space-y-3">
                  {respondingTo === challenge.id ? (
                    <>
                      {/* Driver Grid */}
                      <div className="bg-black/40 rounded-lg p-3 border border-gray-800">
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">Pick your driver:</p>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                          {drivers.map((driver) => (
                            <button
                              key={driver.id}
                              onClick={() => {
                                setPrediction(driver.name);
                                setSelectedDriver(driver.id);
                              }}
                              className={`p-2 rounded border transition-all text-left ${
                                selectedDriver === driver.id
                                  ? 'bg-racing-red border-racing-red text-white'
                                  : 'bg-black/60 border-gray-700 text-gray-300 hover:border-racing-red/50'
                              }`}
                            >
                              <p className="text-xs font-black truncate">{driver.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{driver.team}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAccept(challenge.id!, prediction)}
                          className="flex-1 bg-green-600 hover:bg-green-700 font-black uppercase tracking-wider"
                          disabled={!prediction}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRespondingTo(null);
                            setPrediction("");
                            setSelectedDriver("");
                          }}
                          className="flex-1 font-black uppercase tracking-wider border-gray-700"
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setRespondingTo(challenge.id!)}
                        className="flex-1 bg-green-600 hover:bg-green-700 font-black uppercase tracking-wider"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept Challenge
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDecline(challenge.id!)}
                        className="flex-1 font-black uppercase tracking-wider"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Winner Display */}
              {isCompleted && (
                <div className={`p-3 rounded-lg border-2 ${
                  challenge.winnerId
                    ? 'bg-yellow-500/10 border-yellow-500/40'
                    : 'bg-gray-800/40 border-gray-700'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Winner</p>
                        <p className="text-sm font-black text-white">{challenge.winner}</p>
                      </div>
                    </div>
                    {challenge.winnerId && (
                      <div className="text-xs font-bold text-yellow-400 bg-black/60 px-3 py-1 rounded-full border border-yellow-500/30">
                        {challenge.winnerId === challenge.challengerId
                          ? challenge.challengerName
                          : challenge.challengedName} +{challenge.points} pts
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Waiting State - For Challenger */}
              {!isPending && !challenge.challengedPrediction && challenge.status === 'pending' && challenge.challengerId === currentUser?.uid && (
                <div className="p-3 bg-black/40 rounded-lg border border-gray-800 text-center relative">
                  <button
                    onClick={() => handleCancel(challenge.id!)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-all"
                    title="Cancel Challenge"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-gray-500 font-bold">Waiting for {challenge.challengedName} to respond...</p>
                </div>
              )}

              {/* Waiting State - For Others Viewing */}
              {!isPending && !challenge.challengedPrediction && challenge.status === 'pending' && challenge.challengerId !== currentUser?.uid && (
                <div className="p-3 bg-black/40 rounded-lg border border-gray-800 text-center">
                  <p className="text-xs text-gray-500 font-bold">Waiting for {challenge.challengedName} to respond...</p>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
