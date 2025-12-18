import { Header } from "@/components/Header";
import { GrillLeaderboard } from "@/components/GrillLeaderboard";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const GrillLeaderboardPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-black">
        <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 pb-6 sm:pb-12">
          {/* Page Header */}
          <div className="max-w-4xl mx-auto mb-6">
            <div className="text-center mb-6">
              <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight mb-2">
                GRILL THE GRID
              </div>
              <div className="h-1 w-32 bg-racing-red mx-auto mb-3"></div>
              <div className="text-base sm:text-xl font-bold text-gray-400 uppercase">
                A–Z Challenge Leaderboard
              </div>
            </div>

            <div className="text-center mb-8">
              <Button
                onClick={() => navigate('/grill-the-grid')}
                className="bg-racing-red hover:bg-red-700 text-white font-black text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 uppercase tracking-wider"
              >
                PLAY CHALLENGE
              </Button>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="max-w-4xl mx-auto">
            <GrillLeaderboard challengeId="az-challenge" />
          </div>
        </div>
      </div>
    </>
  );
};
