import { Header } from "@/components/Header";
import { LiveChat } from "@/components/LiveChat";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const LiveChatPage = () => {
  const navigate = useNavigate();
  const { year, round } = useParams();

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(`/race/${year}/${round}`)}
          className="mb-3 sm:mb-4 text-gray-400 hover:text-white -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Race
        </Button>

        {/* Header */}
        <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-gray-800">
          <div className="inline-block px-2 sm:px-3 py-1 bg-racing-red/10 backdrop-blur-sm border border-racing-red/30 rounded-full mb-2 sm:mb-3">
            <span className="text-racing-red font-bold text-[10px] sm:text-xs tracking-wider">LIVE CHAT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">ABU DHABI GP 2025</h1>
          <p className="text-xs sm:text-sm md:text-base text-gray-400 mt-1 sm:mt-2">
            Chat with the F1 community during the race
          </p>
        </div>

        {/* Live Chat Component */}
        <LiveChat raceName="Abu Dhabi Grand Prix" raceYear={2025} limit={200} />
      </main>
    </div>
  );
};

export default LiveChatPage;
