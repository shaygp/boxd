import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Offline = () => {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden flex items-center justify-center">
      {/* Animated background grid */}
      <div className="fixed inset-0 z-0">
        {/* Racing grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(220, 38, 38, 0.03) 49px, rgba(220, 38, 38, 0.03) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(220, 38, 38, 0.03) 49px, rgba(220, 38, 38, 0.03) 50px)
          `
        }} />

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-red-950/20 via-transparent to-black/50" />
      </div>

      {/* Checkered flag pattern corner */}
      <div className="fixed top-0 right-0 w-64 h-64 opacity-5 z-0">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(45deg, #fff 25%, transparent 25%),
            linear-gradient(-45deg, #fff 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #fff 75%),
            linear-gradient(-45deg, transparent 75%, #fff 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 text-center space-y-8 max-w-2xl">
        {/* Icon with racing stripe */}
        <div className="relative inline-block">
          <div className="absolute -left-4 top-0 w-2 h-full bg-racing-red opacity-50" />
          <div className="absolute -right-4 top-0 w-2 h-full bg-racing-red opacity-50" />

          <div className="relative bg-racing-red/10 border-4 border-racing-red rounded-full w-32 h-32 mx-auto flex items-center justify-center backdrop-blur-sm">
            <WifiOff className="w-16 h-16 text-racing-red" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="inline-block px-6 py-2 bg-racing-red/20 border-2 border-racing-red rounded-full">
          <span className="text-racing-red font-black text-sm tracking-widest">CONNECTION LOST</span>
        </div>

        {/* Main Title */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-none tracking-tighter">
            <div className="text-white mb-2">YOU ARE</div>
            <div className="text-racing-red relative inline-block">
              OFFLINE
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-racing-red/30" />
            </div>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-400 font-bold leading-relaxed max-w-xl mx-auto">
            No internet connection detected.
            <span className="block mt-2 text-racing-red font-black">Check your network and try again.</span>
          </p>
        </div>

        {/* Racing stats style info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-xl mx-auto">
          <div className="bg-black/40 border-2 border-red-900/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-racing-red font-black text-sm mb-1 tracking-widest">STATUS</div>
            <div className="text-lg font-black text-white">DISCONNECTED</div>
          </div>
          <div className="bg-black/40 border-2 border-red-900/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-racing-red font-black text-sm mb-1 tracking-widest">NETWORK</div>
            <div className="text-lg font-black text-white">UNAVAILABLE</div>
          </div>
          <div className="bg-black/40 border-2 border-red-900/50 rounded-lg p-4 backdrop-blur-sm">
            <div className="text-racing-red font-black text-sm mb-1 tracking-widest">CONNECTION</div>
            <div className="text-lg font-black text-white">FAILED</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Button
            size="lg"
            className="w-full sm:w-auto text-lg px-12 h-16 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider shadow-2xl shadow-red-500/50 border-2 border-red-400 relative overflow-hidden group"
            onClick={handleRetry}
          >
            <span className="relative z-10 flex items-center gap-3">
              <RefreshCw className="w-6 h-6" />
              Retry Connection
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-lg px-12 h-16 border-2 border-racing-red bg-black/60 text-white hover:bg-racing-red/20 font-black uppercase tracking-wider"
            onClick={() => navigate('/home')}
          >
            <span className="flex items-center gap-3">
              <Home className="w-6 h-6" />
              Go Home
            </span>
          </Button>
        </div>

        {/* Tips Section */}
        <div className="pt-12 space-y-4">
          <div className="inline-block px-4 py-1 bg-black/60 backdrop-blur-sm border-2 border-racing-red/50 rounded-full">
            <span className="text-racing-red/80 font-black text-xs tracking-widest">TROUBLESHOOTING</span>
          </div>
          <div className="text-left max-w-lg mx-auto space-y-3 text-gray-400 font-bold">
            <div className="flex gap-3 items-start bg-black/20 p-4 rounded-lg border border-red-900/20">
              <div className="w-2 h-2 bg-racing-red rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm">Check your WiFi or mobile data connection</p>
            </div>
            <div className="flex gap-3 items-start bg-black/20 p-4 rounded-lg border border-red-900/20">
              <div className="w-2 h-2 bg-racing-red rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm">Make sure airplane mode is turned off</p>
            </div>
            <div className="flex gap-3 items-start bg-black/20 p-4 rounded-lg border border-red-900/20">
              <div className="w-2 h-2 bg-racing-red rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm">Try moving to an area with better signal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tire marks decoration */}
      <div className="fixed bottom-0 left-0 right-0 h-32 opacity-5 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0,50 Q300,20 600,50 T1200,50" stroke="currentColor" strokeWidth="40" fill="none" className="text-white" />
        </svg>
      </div>

      {/* Logo in corner */}
      <div className="fixed top-8 left-8 z-20">
        <div className="text-3xl font-black tracking-tighter">
          <span className="text-white">BOX</span>
          <span className="text-racing-red">BOXD</span>
        </div>
      </div>
    </div>
  );
};

export default Offline;
