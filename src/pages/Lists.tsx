import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/ActivityFeed";
import { auth } from "@/lib/firebase";

const Lists = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        <div className="mb-6 sm:mb-8 pb-4 border-b border-gray-800">
          <div className="inline-block px-3 py-1 bg-racing-red/10 backdrop-blur-sm border border-racing-red/30 rounded-full mb-3">
            <span className="text-racing-red font-bold text-xs tracking-wider">GLOBAL FEED</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">COMMUNITY ACTIVITY</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            See what the F1 community is watching
          </p>
        </div>

        <ActivityFeed feedType="global" limit={50} />
      </main>
    </div>
  );
};

export default Lists;
