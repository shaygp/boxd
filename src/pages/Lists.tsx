import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityFeed } from "@/components/ActivityFeed";
import { auth } from "@/lib/firebase";
import { useState } from "react";

const Lists = () => {
  const [activeTab, setActiveTab] = useState<'following' | 'global'>('following');

  return (
    <div className="min-h-screen bg-[#0a0a0a] racing-grid pb-20 lg:pb-0">
      <Header />

      <main className="container px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        <div className="mb-6 sm:mb-8 pb-4 border-b border-gray-800">
          <div className="inline-block px-3 py-1 bg-racing-red/10 backdrop-blur-sm border border-racing-red/30 rounded-full mb-3">
            <span className="text-racing-red font-bold text-xs tracking-wider">ACTIVITY FEED</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">COMMUNITY ACTIVITY</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-2">
            See what you and the F1 community are watching
          </p>
        </div>

        <Tabs defaultValue="following" value={activeTab} onValueChange={(v) => setActiveTab(v as 'following' | 'global')} className="w-full">
          <TabsList className="inline-grid grid-cols-2 bg-black/60 border-2 border-gray-800 mb-6">
            <TabsTrigger
              value="following"
              className="data-[state=active]:bg-racing-red data-[state=active]:text-white font-bold uppercase tracking-wider text-xs"
            >
              Following
            </TabsTrigger>
            <TabsTrigger
              value="global"
              className="data-[state=active]:bg-racing-red data-[state=active]:text-white font-bold uppercase tracking-wider text-xs"
            >
              Global
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following">
            <ActivityFeed feedType="following" limit={50} />
          </TabsContent>

          <TabsContent value="global">
            <ActivityFeed feedType="global" limit={50} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Lists;
