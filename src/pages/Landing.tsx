import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Flag,
  Gauge,
  Trophy,
  Zap,
  Timer,
  Target
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    // Animate speed gauge on load
    const interval = setInterval(() => {
      setSpeed(prev => {
        if (prev >= 350) return 350;
        return prev + 10;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 z-0">
        {/* Racing grid lines */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 49px, rgba(220, 38, 38, 0.03) 49px, rgba(220, 38, 38, 0.03) 50px),
            repeating-linear-gradient(90deg, transparent, transparent 49px, rgba(220, 38, 38, 0.03) 49px, rgba(220, 38, 38, 0.03) 50px)
          `
        }} />

        {/* Animated speed lines */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
          <div className="absolute top-1/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
          <div className="absolute top-3/4 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[slide_2.2s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-red-950/20 via-transparent to-black/50" />
      </div>

      {/* Checkered flag pattern top corner */}
      <div className="fixed top-0 right-0 w-64 h-64 opacity-10 z-0">
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

      {/* Top navigation bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-red-900/20 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter">
              <span className="text-white">BOX</span>
              <span className="text-racing-red">BOXD</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="text-white hover:text-racing-red hover:bg-white/10 font-bold"
            >
              SIGN IN
            </Button>
            <Button
              onClick={() => navigate('/login')}
              className="bg-racing-red hover:bg-red-600 text-white font-black px-6 shadow-lg shadow-red-500/50"
            >
              START
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Racing position indicator */}
          <div className="absolute top-10 left-8 hidden lg:block">
            <div className="bg-racing-red/10 border-2 border-racing-red rounded-lg p-4 backdrop-blur-sm">
              <div className="text-racing-red font-black text-6xl leading-none">P1</div>
              <div className="text-white text-xs mt-1 font-bold">POSITION</div>
            </div>
          </div>

          {/* Speed gauge */}
          <div className="absolute top-10 right-8 hidden lg:block">
            <div className="bg-racing-red/10 border-2 border-racing-red rounded-full w-32 h-32 flex flex-col items-center justify-center backdrop-blur-sm">
              <Gauge className="w-8 h-8 text-racing-red mb-1" />
              <div className="text-racing-red font-black text-3xl leading-none">{speed}</div>
              <div className="text-white text-xs font-bold">KM/H</div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Main title with racing stripes */}
            <div className="relative">
              <div className="absolute -left-4 top-0 w-2 h-full bg-racing-red" />
              <div className="absolute -right-4 top-0 w-2 h-full bg-racing-red" />
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-tighter">
                <div className="text-white mb-2">TRACK EVERY</div>
                <div className="text-racing-red mb-2 relative inline-block">
                  RACE
                  <div className="absolute -bottom-2 left-0 right-0 h-2 bg-racing-red/30" />
                </div>
                <div className="text-white">YOU WATCH</div>
              </h1>
            </div>

            {/* Racing subtext */}
            <p className="text-xl sm:text-2xl text-gray-400 font-bold max-w-3xl mx-auto leading-relaxed">
              Your personal <span className="text-racing-red font-black">F1 TELEMETRY</span>.
              Log races, track stats, dominate leaderboards.
            </p>

            {/* CTA Buttons with racing style */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                size="lg"
                className="w-full sm:w-auto text-lg px-12 h-16 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-wider shadow-2xl shadow-red-500/50 border-2 border-red-400 relative overflow-hidden group"
                onClick={() => navigate('/login')}
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Flag className="w-6 h-6" />
                  Lights Out
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              </Button>
            </div>

            {/* Racing stats ticker */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
              {[
                { icon: Timer, label: "70+ YEARS", sublabel: "F1 HISTORY" },
                { icon: Trophy, label: "1000+", sublabel: "GP RACES" },
                { icon: Target, label: "24", sublabel: "CIRCUITS" },
                { icon: Zap, label: "LIVE", sublabel: "COMMUNITY" }
              ].map((stat, i) => (
                <div key={i} className="bg-black/40 border-2 border-red-900/50 rounded-lg p-4 backdrop-blur-sm hover:border-racing-red transition-all">
                  <stat.icon className="w-8 h-8 text-racing-red mx-auto mb-2" />
                  <div className="text-2xl font-black text-white">{stat.label}</div>
                  <div className="text-xs text-gray-400 font-bold mt-1">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tire marks decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-32 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 1200 100" preserveAspectRatio="none">
            <path d="M0,50 Q300,20 600,50 T1200,50" stroke="currentColor" strokeWidth="40" fill="none" className="text-white" />
          </svg>
        </div>
      </section>

      {/* Features Section - Pit Lane Style */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-black/50 to-black relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyMjAsMzgsMzgsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block px-6 py-2 bg-racing-red/20 border-2 border-racing-red rounded-full mb-6">
              <span className="text-racing-red font-black text-sm tracking-widest">PIT LANE · FEATURES</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter">
              RACE CONTROL
              <span className="text-racing-red"> FEATURES</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {[
              {
                number: "01",
                title: "LOG RACES",
                desc: "Track every GP with precision timing. Rate performances, log DNFs, record fastest laps.",
                color: "red"
              },
              {
                number: "02",
                title: "RACE ANALYTICS",
                desc: "Deep dive into your watching stats. Hours logged, favorite circuits, driver analysis.",
                color: "yellow"
              },
              {
                number: "03",
                title: "CREATE LISTS",
                desc: "Curate greatest moments. Legendary overtakes, championship deciders, rain masters.",
                color: "green"
              },
              {
                number: "04",
                title: "COMMUNITY",
                desc: "Connect with F1 fans worldwide. Share reviews, discuss strategies, predict winners.",
                color: "blue"
              },
              {
                number: "05",
                title: "LIVE TRENDING",
                desc: "See what's hot in the paddock. Most-watched races, trending drivers, viral moments.",
                color: "purple"
              },
              {
                number: "06",
                title: "ACHIEVEMENTS",
                desc: "Unlock trophies and badges. Complete seasons, reach milestones, climb leaderboards.",
                color: "orange"
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-black/60 border-2 border-red-900/30 p-6 backdrop-blur-sm hover:border-racing-red hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 group relative overflow-hidden">
                <div className="absolute top-0 right-0 text-[120px] font-black text-red-900/10 leading-none group-hover:text-red-900/20 transition-colors">
                  {feature.number}
                </div>
                <div className="relative z-10">
                  <div className="text-racing-red font-black text-sm mb-2 tracking-widest">{feature.number}</div>
                  <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-racing-red group-hover:w-full transition-all duration-500" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Finish Line */}
      <section className="py-20 sm:py-32 relative overflow-hidden">
        {/* Checkered flag pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(45deg, #fff 25%, transparent 25%),
              linear-gradient(-45deg, #fff 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #fff 75%),
              linear-gradient(-45deg, transparent 75%, #fff 75%)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
          }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-racing-red rounded-full">
              <Flag className="w-8 h-8 text-white animate-pulse" />
              <span className="text-white font-black text-xl tracking-wider">FINISH LINE</span>
              <Flag className="w-8 h-8 text-white animate-pulse" />
            </div>

            <h2 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-none tracking-tighter">
              READY TO
              <br />
              <span className="text-racing-red">JOIN THE GRID?</span>
            </h2>

            <p className="text-xl text-gray-400 font-bold">
              Start your racing journey. Track every lap, every overtake, every championship moment.
            </p>

            <Button
              size="lg"
              className="text-xl px-16 h-20 bg-racing-red hover:bg-red-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-red-500/50 border-4 border-red-400"
              onClick={() => navigate('/login')}
            >
              <Flag className="w-8 h-8 mr-3" />
              Get Started Free
            </Button>

            <p className="text-sm text-gray-500 font-bold">
              No credit card required · Join thousands of F1 fans
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-red-900/20 py-12 bg-black">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-racing-red rounded flex items-center justify-center">
                <Flag className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter">
                <span className="text-white">BOX</span>
                <span className="text-racing-red">BOXD</span>
              </h3>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm font-bold">
              <a href="/support" className="text-gray-400 hover:text-racing-red transition-colors uppercase tracking-wider">
                Support
              </a>
              <span className="text-gray-700">•</span>
              <a href="/privacy-policy" className="text-gray-400 hover:text-racing-red transition-colors uppercase tracking-wider">
                Privacy
              </a>
              <span className="text-gray-700">•</span>
              <a href="/terms-of-service" className="text-gray-400 hover:text-racing-red transition-colors uppercase tracking-wider">
                Terms
              </a>
            </div>
            <p className="text-xs text-gray-600 text-center font-bold uppercase tracking-wider">
              © 2025 BoxBoxd. Not affiliated with Formula 1®
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes slide {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
